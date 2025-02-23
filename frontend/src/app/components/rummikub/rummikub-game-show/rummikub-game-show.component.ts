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
  IRoundFinishedEvent,
  IUpdateSets,
} from "src/app/shared/dtos/rummikub/game";
import {
  ConfirmationDialogComponent,
  IConfirmationDialogData,
} from "../../common/confirmation-dialog/confirmation-dialog.component";
import { RummikubGameScoreboardDialogComponent } from "../rummikub-game-scoreboard-dialog/rummikub-game-scoreboard-dialog.component";
import { ITile } from "src/app/shared/dtos/rummikub/tile";

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

  @ViewChild("tableContainer") tableContainer: ElementRef;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly gameService: RummikubGameService,
    private readonly authenticationService: AuthenticationService,
    private readonly snackBar: MatSnackBar,
    private readonly socket: WrappedSocket,
    private readonly dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.authenticationService.getUserSubject().subscribe((u) => {
      this.user = u;
    });
    this.route.params.subscribe(() => {
      if (this.game != null) {
        this.socket.emit("rummikub-leave-game", this.game.gameId);
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
        if (this.game == null) {
          throw Error(
            "Action to next player event handler: Game unexepcetedly null"
          );
        }
        this.game.actionToUserId = event.actionToUserId;
        if (event.lastAction.userId !== this.user?.userId) {
          this.table.updateStateWithUserAction(
            event.lastAction,
            event.actionToUserId
          );
        }
      });
    this.socket
      .fromEvent<IUpdateSets>("update-sets")
      .subscribe((event: IUpdateSets) => {
        if (this.game?.actionToUserId !== this.user?.userId) {
          this.table.updateStateWithUpdateSets(event);
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
        // snackbar message round is over, open score dialog
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
        throw new Error("Game unexpectedly null");
      }
      this.game.state = GameState.ABORTED;
      this.initializeTable();
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

  viewScores(): void {
    this.dialog.open(RummikubGameScoreboardDialogComponent, {
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
      this.game.playerStates.find((x) => x.userId == this.user?.userId) != null
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
        }
      },
    });
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
      .rematch(this.game.gameId, { hideTileCount: true, playTo: 100 })
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
    this.router.navigate([`yaniv/games/${gameId}`]);
  }

  getChatId(): string {
    return `rummikub-game-${this.getGameId()}`;
  }
}
