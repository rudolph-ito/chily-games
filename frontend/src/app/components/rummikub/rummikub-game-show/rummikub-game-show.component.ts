import { HttpErrorResponse } from "@angular/common/http";
import { Component, ElementRef, ViewChild } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ActivatedRoute, Router } from "@angular/router";
import moment from "moment";
import { Subject } from "rxjs";
import { RummikubTable } from "src/app/canvas/rummikub/table";
import { WrappedSocket } from "src/app/modules/socket.io/socket.io.service";
import { AuthenticationService } from "src/app/services/authentication.service";
import { RummikubGameService } from "src/app/services/rummikub/rummikub-game-service";
import { IUser } from "src/app/shared/dtos/authentication";
import {
  GameState,
  IActionToNextPlayerEvent,
  IDoneWithTurnResponse,
  IGame,
  INewGameStartedEvent,
  IPlayerJoinedEvent,
  IPlayerUpdatedSetsEvent,
  IRoundFinishedEvent,
  IUpdateSets,
  RevertUpdateSetsType,
} from "src/app/shared/dtos/rummikub/game";
import {
  ConfirmationDialogComponent,
  IConfirmationDialogData,
} from "../../common/confirmation-dialog/confirmation-dialog.component";
import { RummikubGameScoreboardDialogComponent } from "../rummikub-game-scoreboard-dialog/rummikub-game-scoreboard-dialog.component";
import { ITile } from "src/app/shared/dtos/rummikub/tile";
import { RummikubNewGameDialogComponent } from "../rummikub-new-game-dialog/rummikub-new-game-dialog.component";
import { ErrorHandlerService } from "src/app/services/error.handler.service";

@Component({
  selector: "app-rummikub-game-show",
  templateUrl: "./rummikub-game-show.component.html",
  styleUrls: ["./rummikub-game-show.component.scss"],
})
export class RummikubGameShowComponent {
  loading: boolean;
  game: IGame | null;
  user: IUser | null;
  resizeObservable = new Subject<boolean>();
  table: RummikubTable;
  newGameStartedEvent: INewGameStartedEvent | null;
  socketDisconnected = false;
  enum_RevertUpdateSetsType = RevertUpdateSetsType;

  @ViewChild("tableContainer") tableContainer: ElementRef;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly gameService: RummikubGameService,
    private readonly authenticationService: AuthenticationService,
    private readonly snackBar: MatSnackBar,
    private readonly socket: WrappedSocket,
    private readonly dialog: MatDialog,
    private readonly errorHandlerService: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.authenticationService.getUserSubject().subscribe((u) => {
      this.user = u;
    });
    this.route.params.subscribe(() => {
      this.resetGame();
    });
  }

  resetGame(): void {
    if (this.game != null) {
      this.socket.emit("rummikub-leave-game", this.game.gameId);
      if (this.table != null) {
        this.table.clear();
      }
    }
    this.setupWebsocket();
    this.loadGame();
  }

  loadGame(): void {
    this.loading = true;
    this.gameService.get(this.getGameId()).subscribe((game) => {
      this.game = game;
      this.loading = false;
      this.initializeTable();
    });
  }

  setupWebsocket(): void {
    this.socket.emit("rummikub-join-game", this.getGameId());
    this.socket
      .fromEvent("player-joined")
      .subscribe((event: IPlayerJoinedEvent) => {
        if (this.game == null) {
          throw new Error("Game unexpectedly null");
        }
        this.game.playerStates = event.playerStates;
      });
    this.socket.fromEvent("round-started").subscribe(() => {
      this.loadGame();
    });
    this.socket
      .fromEvent<IActionToNextPlayerEvent>("action-to-next-player")
      .subscribe((event: IActionToNextPlayerEvent) => {
        if (this.game == null) {
          console.warn(
            "action-to-next-player event handler: game unexpectedly null"
          );
          return;
        }
        if (this.game.version >= event.version) {
          console.warn(
            "action-to-next-player event handler: skipping earlier / duplicate event"
          );
          return;
        }
        this.game.version = event.version;
        this.game.actionToUserId = event.actionToUserId;
        if (event.lastAction.userId !== this.user?.userId) {
          this.table.updateStateWithUserAction(
            event.lastAction,
            event.actionToUserId
          );
        }
      });
    this.socket
      .fromEvent<IPlayerUpdatedSetsEvent>("update-sets")
      .subscribe((event: IPlayerUpdatedSetsEvent) => {
        if (this.game == null) {
          console.warn("update-sets event handler: game unexpectedly null");
          return;
        }
        if (this.game.version >= event.version) {
          console.warn(
            "update-sets event handler: skipping earlier / duplicate event"
          );
          return;
        }
        this.game.version = event.version;
        if (this.game?.actionToUserId !== this.user?.userId) {
          try {
            this.table.updateStateWithUpdateSets(event.updateSets, false);
          } catch (e) {
            this.errorHandlerService.handleError(e);
            this.resetGame();
          }
        }
      });
    this.socket
      .fromEvent("round-finished")
      .subscribe((event: IRoundFinishedEvent) => {
        if (this.game == null) {
          console.warn("round-finished event handler: game unexpectedly null");
          return;
        }
        if (this.game.version >= event.version) {
          console.warn(
            "round-finished event handler: skipping earlier / duplicate event"
          );
          return;
        }
        this.game.version = event.version;
        this.game.state = event.updatedGameState;
        this.game.playerStates = event.playerStates;
        this.game.roundScores.push(event.roundScore);
        const winningPlayer = this.game.playerStates.find(
          (x) => x.userId == event.winnerUserId
        );
        if (winningPlayer == null) {
          throw new Error("Winning player unexpectedly null");
        }
        this.table.updateStateWithUserAction(
          event.lastAction,
          event.winnerUserId
        );
        this.table.updateGameState(event.updatedGameState);
        this.viewScores(
          `${winningPlayer.displayName} won this round.`,
          this.getSurpriseMessage()
        );
      });
    this.socket
      .fromEvent("new-game-started")
      .subscribe((event: INewGameStartedEvent) => {
        if (event.userId !== this.user?.userId) {
          this.newGameStartedEvent = event;
          this.confirmJoinNewGame();
        }
      });
    this.socket.fromEvent("aborted").subscribe(() => {
      if (this.game == null) {
        console.warn("aborted event handler: game unexpectedly null");
        return;
      }
      this.game.state = GameState.ABORTED;
      this.initializeTable();
    });
    this.socket.fromEvent("connect").subscribe(() => {
      this.socketDisconnected = false;
      this.loadGame();
    });
    this.socket.fromEvent("connect_error").subscribe(() => {
      this.socketDisconnected = true;
      if (!this.socket.isActive()) {
        this.socket.connect();
      }
    });
    this.socket.fromEvent("disconnect").subscribe(() => {
      this.socketDisconnected = true;
      if (!this.socket.isActive()) {
        this.socket.connect();
      }
    });
  }

  ngOnDestroy(): void {
    this.socket.emit("rummikub-leave-game", this.getGameId());
  }

  ngAfterViewInit(): void {
    this.initializeTable();
  }

  initializeTable(): void {
    if (this.game != null && this.tableContainer != null) {
      if (this.table == null) {
        this.table = new RummikubTable(
          {
            element: this.tableContainer.nativeElement,
          },
          this.onRearrangeTiles,
          this.onUpdateSets
        );
      }
      if (this.game.state !== GameState.PLAYERS_JOINING) {
        this.table.initializeState(this.game, this.user?.userId);
      }
    }
  }

  viewScores(message: string = "", surpriseMessage: string = ""): void {
    this.dialog.open(RummikubGameScoreboardDialogComponent, {
      data: { game: this.game, message, surpriseMessage },
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

  isRoundActive(): boolean {
    return this.game != null && this.game.state == GameState.ROUND_ACTIVE;
  }

  isRoundFinished(): boolean {
    return (
      this.game != null &&
      (this.game.state == GameState.ROUND_COMPLETE ||
        this.game.state == GameState.COMPLETE)
    );
  }

  isGameAborted(): boolean {
    return this.game != null && this.game.state === GameState.ABORTED;
  }

  canAbortGame(): boolean {
    return (
      this.game !== null &&
      this.game.state !== GameState.COMPLETE &&
      this.game.state !== GameState.ABORTED &&
      this.game.hostUserId === this.user?.userId
    );
  }

  canBeDoneWithTurn(): boolean {
    return (
      this.game !== null &&
      this.game.state == GameState.ROUND_ACTIVE &&
      this.game?.actionToUserId === this.user?.userId
    );
  }

  canRevertUpdateSets(): boolean {
    return (
      this.game !== null &&
      this.game.state == GameState.ROUND_ACTIVE &&
      this.game?.actionToUserId === this.user?.userId &&
      this.table.hasUpdateSets()
    );
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

  doneWithTurn(): void {
    this.gameService.doneWithTurn(this.getGameId()).subscribe(
      (response: IDoneWithTurnResponse) => {
        this.table.updateStateWithCurrentUserAction(response);
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

  onRearrangeTiles = (tiles: ITile[]): void => {
    this.gameService.rearrangeTiles(this.getGameId(), tiles).subscribe({
      error: (errorResponse: HttpErrorResponse) => {
        if (errorResponse.status === 422) {
          this.snackBar.open(errorResponse.error, undefined, {
            duration: 2500,
          });
          this.resetGame();
        }
      },
    });
  };

  onUpdateSets = (updateSets: IUpdateSets): void => {
    this.gameService.updateSets(this.getGameId(), updateSets).subscribe({
      error: (errorResponse: HttpErrorResponse) => {
        if (errorResponse.status === 422) {
          this.snackBar.open(errorResponse.error, undefined, {
            duration: 2500,
          });
          this.resetGame();
        }
      },
    });
  };

  revertUpdateSets(revertType: RevertUpdateSetsType): void {
    this.gameService.revertUpdateSets(this.getGameId(), revertType).subscribe({
      next: (updateSets: IUpdateSets) => {
        try {
          this.table.updateStateWithUpdateSets(updateSets, true);
        } catch (e) {
          this.errorHandlerService.handleError(e);
          this.resetGame();
        }
      },
      error: (errorResponse: HttpErrorResponse) => {
        if (errorResponse.status === 422) {
          this.snackBar.open(errorResponse.error, undefined, {
            duration: 2500,
          });
        }
      },
    });
  }

  onResize(): void {
    if (this.table !== null) {
      this.table.resize();
    }
  }

  startNewGame(): void {
    if (this.game == null) {
      throw new Error("Game unexpectedly null");
    }
    this.dialog
      .open(RummikubNewGameDialogComponent, {
        data: { rematchForGameId: this.game.gameId },
      })
      .afterClosed()
      .subscribe((game: IGame) => {
        if (game != null) {
          this.navigateToGame(game.gameId);
        }
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

  confirmAbortGame(): void {
    const data: IConfirmationDialogData = {
      title: "Confirmation",
      message: `Abort the game?`,
    };
    this.dialog
      .open(ConfirmationDialogComponent, { data })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.abortGame();
        }
      });
  }

  abortGame(): void {
    this.gameService.abort(this.getGameId()).subscribe(
      async (game) => {
        this.game = game;
        this.initializeTable();
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
    this.router.navigate([`rummikub/games/${gameId}`]);
  }

  getChatId(): string {
    return `rummikub-game-${this.getGameId()}`;
  }

  getSurpriseMessage(): string {
    if (this.game != null) {
      const playerNameSet = new Set(
        this.game.playerStates.map((x) => x.displayName)
      );
      if (playerNameSet.has("Charlie") && playerNameSet.has("Lily")) {
        this.table.displayConfetti(20000);
        return "Surprise! We're having a baby girl!";
      }
    }
    return "";
  }
}
