import { HttpErrorResponse } from "@angular/common/http";
import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from "@angular/router";
import { Socket } from 'ngx-socket-io';
import { Subject } from "rxjs";
import { YanivTable } from "src/app/canvas/yaniv/table";
import { AuthenticationService } from "src/app/services/authentication.service";
import { YanivGameService } from "src/app/services/yaniv/yaniv-game.service";
import { IUser } from "src/app/shared/dtos/authentication";
import { GameState, IActionToNextPlayerEvent, IGame, IGameActionRequest, IPlayerJoinedEvent, IRoundFinishedEvent, IRoundScore, RoundScoreType } from "src/app/shared/dtos/yaniv/game";
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
    private readonly snackBar: MatSnackBar,
    private readonly socket: Socket
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
    this.socket.emit("yaniv-join-game", this.getGameId());
    this.socket
      .fromEvent("player-joined")
      .subscribe((event: IPlayerJoinedEvent) => {
        this.game.playerStates = event.playerStates
      });
    this.socket
      .fromEvent("round-started")
      .subscribe(() => {
        this.gameService.get(this.getGameId()).subscribe((game) => {
          this.updateGame(game)
          this.refreshTable()
        })
      });
    this.socket
      .fromEvent<IActionToNextPlayerEvent>("action-to-next-player")
      .subscribe((event: IActionToNextPlayerEvent) => {
        if (event.lastAction.userId !== this.user?.userId) {
          this.game.actionToUserId = event.actionToUserId;
          this.game.cardsOnTopOfDiscardPile = event.lastAction.cardsDiscarded
          this.game.playerStates.forEach(playerState => {
            if (playerState.userId == event.lastAction.userId) {
              playerState.numberOfCards -= event.lastAction.cardsDiscarded.length - 1
            }
          })
          this.refreshTable()
        }
      });
    this.socket
      .fromEvent("round-finished")
      .subscribe((event: IRoundFinishedEvent) => {
        this.game.state = GameState.ROUND_COMPLETE
        this.game.playerStates = event.playerStates;
        this.game.roundScores.push(event.roundScore);
        this.updateGame(this.game);
        this.refreshTable()
      });
  }

  updateGame(game: IGame): void {
    this.game = game;
    this.scoresDataSource.data = game.roundScores.concat([this.computeTotalScoreRow(game.roundScores)]);
    this.scoresTableDisplayedColumns = game.playerStates.map(x => `player-${x.userId}`)
  }

  computeTotalScoreRow(roundScores: IRoundScore[]): IRoundScore {
    const out: IRoundScore = {};
    roundScores.forEach(roundScore => {
      for (let userId in roundScore) {
        if (doesNotHaveValue(out[userId])) {
          out[userId] = { scoreType: RoundScoreType.TOTAL, score: 0 }
        }
        out[userId].score += roundScore[userId].score
      }
    })
    return out
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
      this.game.state === GameState.ROUND_ACTIVE
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
