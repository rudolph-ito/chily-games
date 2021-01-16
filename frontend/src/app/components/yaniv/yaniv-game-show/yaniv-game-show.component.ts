import { HttpErrorResponse } from "@angular/common/http";
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ActivatedRoute } from "@angular/router";
import { Subject } from "rxjs";
import { YanivTable } from "src/app/canvas/yaniv/table";
import { WrappedSocket } from "src/app/modules/socket.io/socket.io.service";
import { AuthenticationService } from "src/app/services/authentication.service";
import { YanivGameService } from "src/app/services/yaniv/yaniv-game.service";
import { IUser } from "../../../shared/dtos/authentication";
import {
  GameState,
  IActionToNextPlayerEvent,
  IGame,
  IGameActionRequest,
  IGameActionResponse,
  IPlayerJoinedEvent,
  IRoundFinishedEvent,
} from "../../../shared/dtos/yaniv/game";
import { YanivGameScoreboardDialogComponent } from "../yaniv-game-scoreboard-dialog/yaniv-game-scoreboard-dialog.component";

@Component({
  selector: "app-yaniv-game-show",
  templateUrl: "./yaniv-game-show.component.html",
  styleUrls: ["./yaniv-game-show.component.styl"],
})
export class YanivGameShowComponent
  implements OnInit, AfterViewInit, OnDestroy {
  loading: boolean;
  game: IGame | null;
  user: IUser | null;
  resizeObservable = new Subject<boolean>();
  table: YanivTable;

  @ViewChild("tableContainer") tableContainer: ElementRef;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly gameService: YanivGameService,
    private readonly authenticationService: AuthenticationService,
    private readonly snackBar: MatSnackBar,
    private readonly socket: WrappedSocket,
    private readonly dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.authenticationService.getUserSubject().subscribe((u) => {
      this.user = u;
      this.gameService.get(this.getGameId()).subscribe((game) => {
        this.game = game;
        this.loading = false;
        this.initializeTable();
      });
    });
    this.socket.emit("yaniv-join-game", this.getGameId());
    this.socket
      .fromEvent("player-joined")
      .subscribe((event: IPlayerJoinedEvent) => {
        if (this.game == null) {
          throw new Error("Game unexpectedly null");
        }
        this.game.playerStates = event.playerStates;
      });
    this.socket.fromEvent("round-started").subscribe(() => {
      this.gameService.get(this.getGameId()).subscribe((game) => {
        if (game.hostUserId !== this.user?.userId) {
          this.game = game;
          this.initializeTable();
        }
      });
    });
    this.socket
      .fromEvent<IActionToNextPlayerEvent>("action-to-next-player")
      .subscribe((event: IActionToNextPlayerEvent) => {
        if (event.lastAction.userId !== this.user?.userId) {
          this.table.updateStateWithUserAction(
            event.lastAction,
            event.actionToUserId
          );
        }
      });
    this.socket
      .fromEvent("round-finished")
      .subscribe((event: IRoundFinishedEvent) => {
        if (this.game == null) {
          throw new Error("Game unexpectedly null");
        }
        this.game.state = event.updatedGameState;
        this.game.playerStates = event.playerStates;
        this.game.roundScores.push(event.roundScore);
        this.initializeTable();
      });
  }

  ngOnDestroy(): void {
    this.socket.emit("yaniv-leave-game", this.getGameId());
  }

  ngAfterViewInit(): void {
    this.initializeTable();
  }

  initializeTable(): void {
    if (this.game != null && this.tableContainer != null) {
      if (this.table == null) {
        this.table = new YanivTable(
          {
            element: this.tableContainer.nativeElement,
          },
          this.onPlay
        );
      }
      if (this.game.state !== GameState.PLAYERS_JOINING) {
        this.table.initializeState(this.game, this.user?.userId);
      }
    }
  }

  viewScores(): void {
    this.dialog.open(YanivGameScoreboardDialogComponent, {
      data: { game: this.game },
    });
  }

  getGameId(): number {
    return parseInt(this.route.snapshot.params.gameId);
  }

  canJoin(): boolean {
    if (this.user == null || this.game == null) {
      return false;
    }
    const currentUserId = this.user.userId;
    return this.game.playerStates.every((x) => x.userId !== currentUserId);
  }

  couldJoinOrPlayIfLoggedIn(): boolean {
    return this.user == null;
  }

  join(): void {
    this.gameService.join(this.getGameId()).subscribe(
      (updatedGame) => {
        this.game = updatedGame;
      },
      (errorResponse: HttpErrorResponse) => {
        if (errorResponse.status === 422) {
          this.snackBar.open(errorResponse.error, undefined, {
            duration: 2500,
          });
        }
      }
    );
  }

  isWaitingForPlayers(): boolean {
    return this.game != null && this.game.state === GameState.PLAYERS_JOINING;
  }

  canStartRound(): boolean {
    return (
      this.game != null &&
      (this.game.state === GameState.PLAYERS_JOINING ||
        this.game.state === GameState.ROUND_COMPLETE) &&
      this.game.hostUserId === this.user?.userId
    );
  }

  canCallYaniv(): boolean {
    return (
      this.game != null &&
      this.game.state === GameState.ROUND_ACTIVE &&
      this.game.playerStates.some((x) => x.userId === this.user?.userId)
    );
  }

  async callYaniv(): Promise<void> {
    await this.onPlay({ callYaniv: true });
  }

  startRound(): void {
    if (this.game == null) {
      throw new Error("Game unexpectedly null");
    }
    this.gameService.startRound(this.game.gameId).subscribe(
      async (game) => {
        this.game = game;
        await this.table.initializeState(game, this.user?.userId);
      },
      (errorResponse: HttpErrorResponse) => {
        if (errorResponse.status === 422) {
          this.snackBar.open(errorResponse.error, undefined, {
            duration: 2500,
          });
        }
      }
    );
  }

  onPlay = async (action: IGameActionRequest): Promise<void> => {
    this.gameService.play(this.getGameId(), action).subscribe(
      async (response: IGameActionResponse) => {
        if (response.actionToNextPlayerEvent != null) {
          const event = response.actionToNextPlayerEvent;
          this.table.updateStateWithUserAction(
            event.lastAction,
            event.actionToUserId,
            response.cardPickedUpFromDeck
          );
        }
      },
      (errorResponse: HttpErrorResponse) => {
        if (errorResponse.status === 422) {
          this.snackBar.open(errorResponse.error, undefined, {
            duration: 2500,
          });
        }
      }
    );
  };

  onResize(): void {
    if (this.table !== null) {
      this.table.resize();
    }
  }
}
