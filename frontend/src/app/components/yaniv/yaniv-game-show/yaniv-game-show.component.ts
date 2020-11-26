import { HttpErrorResponse } from "@angular/common/http";
import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ActivatedRoute } from "@angular/router";
import { Subject } from "rxjs";
import { YanivTable } from "src/app/canvas/yaniv/table";
import { AuthenticationService } from "src/app/services/authentication.service";
import { YanivGameService } from "src/app/services/yaniv/yaniv-game.service";
import { IUser } from "src/app/shared/dtos/authentication";
import { GameState, IGame } from "src/app/shared/dtos/yaniv/game";
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
        this.game = game;
        this.loading = false;
        this.refreshTable();
      });
    });
  }

  ngAfterViewInit(): void {
    this.refreshTable();
  }

  async refreshTable(): Promise<void> {
    if (doesHaveValue(this.game) && doesHaveValue(this.tableContainer)) {
      if (doesNotHaveValue(this.table)) {
        this.table = new YanivTable({
          element: this.tableContainer.nativeElement,
        });
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
        GameState.ROUND_COMPLETE) &&
      this.game.hostUserId == this.user?.userId
    );
  }

  startRound(): void {
    this.gameService.startRound(this.game.gameId).subscribe(
      (game) => {
        this.game = game;
        // reload interface
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
