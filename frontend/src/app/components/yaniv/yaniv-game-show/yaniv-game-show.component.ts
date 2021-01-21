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
import { ActivatedRoute, Router } from "@angular/router";
import { Socket } from "ngx-socket-io";
import { Subject } from "rxjs";
import { YanivTable } from "src/app/canvas/yaniv/table";
import { AuthenticationService } from "src/app/services/authentication.service";
import { YanivGameService } from "src/app/services/yaniv/yaniv-game.service";
import { IUser } from "../../../shared/dtos/authentication";
import {
  GameState,
  IActionToNextPlayerEvent,
  IGame,
  IGameActionRequest,
  IGameActionResponse,
  INewGameStartedEvent,
  IPlayerJoinedEvent,
  IRoundFinishedEvent,
} from "../../../shared/dtos/yaniv/game";
import { YanivGameScoreboardDialogComponent } from "../yaniv-game-scoreboard-dialog/yaniv-game-scoreboard-dialog.component";
import moment from "moment";
import {
  ConfirmationDialogComponent,
  IConfirmationDialogData,
} from "../../common/confirmation-dialog/confirmation-dialog.component";

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
  newGameStartedEvent: INewGameStartedEvent | null;

  @ViewChild("tableContainer") tableContainer: ElementRef;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly gameService: YanivGameService,
    private readonly authenticationService: AuthenticationService,
    private readonly snackBar: MatSnackBar,
    private readonly socket: Socket,
    private readonly dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.authenticationService.getUserSubject().subscribe((u) => {
      this.user = u;
    });
    this.route.params.subscribe(() => {
      if (this.game != null) {
        this.socket.emit("yaniv-leave-game", this.game.gameId);
        if (this.table != null) {
          this.table.clear();
        }
      }
      this.loadGameAndListenForEvents();
    });
  }

  loadGameAndListenForEvents(): void {
    this.loading = true;
    this.gameService.get(this.getGameId()).subscribe((game) => {
      this.game = game;
      this.loading = false;
      this.initializeTable();
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
    this.socket
      .fromEvent("new-game-started")
      .subscribe((event: INewGameStartedEvent) => {
        if (event.userId !== this.user?.userId) {
          this.newGameStartedEvent = event;
          this.confirmJoinNewGame();
        }
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

  canStartNewGame(): boolean {
    return (
      this.game != null &&
      this.game.state === GameState.COMPLETE &&
      moment(this.game.updatedAt) > moment().subtract(1, "hour") &&
      this.newGameStartedEvent == null
    );
  }

  canJoinNewGame(): boolean {
    return this.newGameStartedEvent != null;
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

  startNewGame(): void {
    if (this.game == null) {
      throw new Error("Game unexpectedly null");
    }
    this.gameService
      .rematch(this.game.gameId, { playTo: 100 })
      .subscribe((game) => {
        this.navigateToGame(game.gameId);
      });
  }

  confirmJoinNewGame(): void {
    if (this.game == null) {
      throw new Error("Game unexpectedly null");
    }
    if (this.newGameStartedEvent == null) {
      throw new Error("newGameStartedEvent unexpectedly null");
    }
    const userId = this.newGameStartedEvent.userId;
    const player = this.game.playerStates.find((x) => x.userId === userId);
    if (player == null) {
      throw new Error("Unexpectedly unable to find host player");
    }
    const data: IConfirmationDialogData = {
      title: "Join rematch?",
      message: `${player.displayName} has started a new game. Would you like to join?`,
    };
    this.dialog
      .open(ConfirmationDialogComponent, { data })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.joinNewGame();
        }
      });
  }

  joinNewGame(): void {
    if (this.newGameStartedEvent == null) {
      throw new Error("newGameStartedEvent unexpectedly null");
    }
    this.gameService.join(this.newGameStartedEvent.gameId).subscribe(
      (game) => {
        this.navigateToGame(game.gameId);
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

  navigateToGame(gameId: number): void {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.router.navigate([`yaniv/games/${gameId}`]);
  }
}
