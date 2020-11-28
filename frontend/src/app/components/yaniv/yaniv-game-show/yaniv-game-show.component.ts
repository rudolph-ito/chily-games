import { HttpErrorResponse } from "@angular/common/http";
import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from "@angular/router";
import { Subject } from "rxjs";
import { YanivTable } from "src/app/canvas/yaniv/table";
import { AuthenticationService } from "src/app/services/authentication.service";
import { YanivGameService } from "src/app/services/yaniv/yaniv-game.service";
import { IUser } from "src/app/shared/dtos/authentication";
import { GameState, IGame, IGameActionRequest, IRoundScore } from "src/app/shared/dtos/yaniv/game";
import {
  doesHaveValue,
  doesNotHaveValue,
} from "src/app/shared/utilities/value_checker";

@Component({
  selector: "app-yaniv-game-show",
  templateUrl: "./yaniv-game-show.component.html",
  styleUrls: ["./yaniv-game-show.component.styl"],
})
export class YanivGameShowComponent implements OnInit {
  loading: boolean;
  game: IGame;
  user: IUser;
  resizeObservable = new Subject<boolean>();
  table: YanivTable;
  scoresDataSource = new MatTableDataSource<IRoundScore>();
  scoresTableDisplayedColumns: string[] = [];

  @ViewChild("tableContainer") tableContainer: ElementRef;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly gameService: YanivGameService,
    private readonly authenticationService: AuthenticationService,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.authenticationService.getUserSubject().subscribe((u) => {
      this.user = u;
      this.gameService.get(this.getGameId()).subscribe((game) => {
        this.updateGame(game)
        this.loading = false;
        this.refreshTable();
      });
    });
  }

  updateGame(game: IGame): void {
    this.game = game;
    this.scoresDataSource.data = game.roundScores;
    this.scoresTableDisplayedColumns = game.playerStates.map(x => `player-${x.userId}`)
  }

  ngAfterViewInit(): void {
    this.refreshTable();
  }

  async refreshTable(): Promise<void> {
    if (doesHaveValue(this.game) && doesHaveValue(this.tableContainer)) {
      if (doesNotHaveValue(this.table)) {
        this.table = new YanivTable({
          element: this.tableContainer.nativeElement,
        }, this.onPlay);
      }
      await this.table.refreshState(this.game, this.user?.userId);
    }
  }

  getGameId(): number {
    return parseInt(this.route.snapshot.params.gameId);
  }

  isWaitingForPlayers(): boolean {
    return this.game.state === GameState.PLAYERS_JOINING;
  }

  onResize() {}

  canStartRound(): boolean {
    return (
      (this.game.state == GameState.PLAYERS_JOINING ||
        this.game.state == GameState.ROUND_COMPLETE) &&
      this.game.hostUserId == this.user?.userId
    );
  }

  canCallYaniv(): boolean {
    return (
      this.game.state == GameState.ROUND_ACTIVE &&
      this.game.actionToUserId == this.user?.userId
    );
  }

  callYaniv(): void {
    this.onPlay({callYaniv: true})
  }

  startRound(): void {
    this.gameService.startRound(this.game.gameId).subscribe(
      async (game) => {
        this.updateGame(game)
        await this.table.refreshState(this.game, this.user?.userId)
      },
      (errorResponse: HttpErrorResponse) => {
        if (errorResponse.status === 422) {
          this.snackBar.open(errorResponse.error, null, {
            duration: 2500,
          });
        }
      }
    );
  }

  onPlay = async (action: IGameActionRequest): Promise<void> => {
    this.gameService.play(this.getGameId(), action).subscribe(
      async (game: IGame) => {
        this.updateGame(game)
        await this.table.refreshState(this.game, this.user?.userId)
      },
      (errorResponse: HttpErrorResponse) => {
        if (errorResponse.status === 422) {
          this.snackBar.open(errorResponse.error, null, {
            duration: 2500,
          });
        }
      }
    );
  }
}
