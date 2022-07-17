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
import { Subject } from "rxjs";
import { WrappedSocket } from "src/app/modules/socket.io/socket.io.service";
import { AuthenticationService } from "src/app/services/authentication.service";
import { ICard } from "src/app/shared/dtos/card";
import { IUser } from "../../../shared/dtos/authentication";
import moment from "moment";
import {
  ConfirmationDialogComponent,
  IConfirmationDialogData,
} from "../../common/confirmation-dialog/confirmation-dialog.component";
import {
  GameState,
  IDiscardEvent,
  IDiscardInput,
  IGame,
  IMeldEvent,
  IMeldInput,
  INewGameStartedEvent,
  IPickupEvent,
  IPickupInput,
  IPickupOutput,
  IPlayerJoinedEvent,
} from "src/app/shared/dtos/rummy/game";
import { RummyGameService } from "src/app/services/rummy-game.service";
import { RummyTable } from "src/app/canvas/rummy/table";
import { RummyNewGameDialogComponent } from "../rummy-new-game-dialog/rummy-new-game-dialog.component";

@Component({
  selector: "app-rummy-game-show",
  templateUrl: "./rummy-game-show.component.html",
  styleUrls: ["./rummy-game-show.component.scss"],
})
export class RummyGameShowComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  loading: boolean;
  game: IGame | null;
  user: IUser | null;
  resizeObservable = new Subject<boolean>();
  table: RummyTable;
  newGameStartedEvent: INewGameStartedEvent | null;

  @ViewChild("tableContainer") tableContainer: ElementRef;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly gameService: RummyGameService,
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
      .fromEvent<IPickupEvent>("pickup")
      .subscribe((event: IPickupEvent) => {
        if (event.userId !== this.user?.userId) {
          this.table.updateStateWithPickup(event);
        }
      });
    this.socket.fromEvent<IMeldEvent>("meld").subscribe((event: IMeldEvent) => {
      if (event.userId !== this.user?.userId) {
        this.table.updateStateWithMeld(event);
      }
    });
    this.socket
      .fromEvent<IDiscardEvent>("discard")
      .subscribe((event: IDiscardEvent) => {
        if (event.userId !== this.user?.userId) {
          this.table.updateStateWithDiscard(event);
        }
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
    this.socket.emit("yaniv-leave-game", this.getGameId());
  }

  ngAfterViewInit(): void {
    this.initializeTable();
  }

  initializeTable(): void {
    if (this.game != null && this.tableContainer != null) {
      if (this.table == null) {
        this.table = new RummyTable(
          {
            element: this.tableContainer.nativeElement,
          },
          this.onPickup,
          this.onMeld,
          this.onDiscard,
          this.onRearrangeCards
        );
      }
      if (this.game.state !== GameState.PLAYERS_JOINING) {
        this.table.initializeState(this.game, this.user?.userId);
      }
    }
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

  onPickup = async (input: IPickupInput): Promise<void> => {
    this.gameService.pickup(this.getGameId(), input).subscribe({
      next: async (response: IPickupOutput) => {
        this.table.updateStateWithPickup(
          response.event,
          response.cardPickedUpFromDeck
        );
      },
      error: (errorResponse: HttpErrorResponse) => {
        if (errorResponse.status === 422) {
          this.snackBar.open(errorResponse.error, undefined, {
            duration: 2500,
          });
        }
      },
    });
  };
  onMeld = async (input: IMeldInput): Promise<void> => {
    this.gameService.meld(this.getGameId(), input).subscribe({
      next: async (response: IMeldEvent) => {
        this.table.updateStateWithMeld(response);
      },
      error: (errorResponse: HttpErrorResponse) => {
        if (errorResponse.status === 422) {
          this.snackBar.open(errorResponse.error, undefined, {
            duration: 2500,
          });
        }
      },
    });
  };
  onDiscard = async (input: IDiscardInput): Promise<void> => {
    this.gameService.discard(this.getGameId(), input).subscribe({
      next: async (response: IDiscardEvent) => {
        this.table.updateStateWithDiscard(response);
      },
      error: (errorResponse: HttpErrorResponse) => {
        if (errorResponse.status === 422) {
          this.snackBar.open(errorResponse.error, undefined, {
            duration: 2500,
          });
        }
      },
    });
  };

  onRearrangeCards = async (cards: ICard[]): Promise<void> => {
    this.gameService
      .rearrangeCards(this.getGameId(), cards)
      .subscribe(null, (errorResponse: HttpErrorResponse) => {
        if (errorResponse.status === 422) {
          this.snackBar.open(errorResponse.error, undefined, {
            duration: 2500,
          });
        }
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
    this.dialog
      .open(RummyNewGameDialogComponent, {
        data: { rematchForGameId: this.getGameId() },
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
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.router.navigate([`yaniv/games/${gameId}`]);
  }

  getChatId(): string {
    return `yaniv-game-${this.getGameId()}`;
  }
}
