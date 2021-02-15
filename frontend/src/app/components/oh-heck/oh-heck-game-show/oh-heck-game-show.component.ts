import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import moment from 'moment';
import { Subject } from 'rxjs';
import { OhHeckTable } from 'src/app/canvas/oh-heck/table';
import { WrappedSocket } from 'src/app/modules/socket.io/socket.io.service';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { OhHeckGameService } from 'src/app/services/oh-heck/oh-heck-game-service';
import { IUser } from 'src/app/shared/dtos/authentication';
import { ICard } from 'src/app/shared/dtos/card';
import { GameState, IBetEvent, IGame, INewGameStartedEvent, IPlayerJoinedEvent, ITrickEvent } from 'src/app/shared/dtos/oh_heck/game';
import { ConfirmationDialogComponent, IConfirmationDialogData } from '../../common/confirmation-dialog/confirmation-dialog.component';
import { OhHeckGameScoreboardDialogComponent } from '../oh-heck-game-scoreboard-dialog/oh-heck-game-scoreboard-dialog.component';
import { OhHeckNewGameDialogComponent } from '../oh-heck-new-game-dialog/oh-heck-new-game-dialog.component';

@Component({
  selector: 'app-oh-heck-game-show',
  templateUrl: './oh-heck-game-show.component.html',
  styleUrls: ['./oh-heck-game-show.component.styl']
})
export class OhHeckGameShowComponent implements OnInit, AfterViewInit, OnDestroy {
  betControl = new FormControl(0);
  loading: boolean;
  game: IGame | null;
  user: IUser | null;
  resizeObservable = new Subject<boolean>();
  table: OhHeckTable;
  newGameStartedEvent: INewGameStartedEvent | null;

  @ViewChild("tableContainer") tableContainer: ElementRef;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly gameService: OhHeckGameService,
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
        this.socket.emit("oh-heck-leave-game", this.game.gameId);
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
    this.socket.emit("oh-heck-join-game", this.getGameId());
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
      .fromEvent("bet-placed")
      .subscribe((event: IBetEvent) => {
        if (this.game == null) {
          throw new Error("Game unexpectedly null");
        }
        if (event.betPlaced.userId !== this.user?.userId) {
          this.table.updateStateWithBetPlaced(event)
          this.game.actionToUserId = event.actionToUserId;
          this.game.state = event.updatedGameState;
        }
      });
    this.socket
      .fromEvent("card-played")
      .subscribe((event: ITrickEvent) => {
        if (this.game == null) {
          throw new Error("Game unexpectedly null");
        }
        if (event.cardPlayed.userId !== this.user?.userId) {
          this.table.updateStateWithCardPlayed(event);
          this.game.actionToUserId = event.actionToUserId;
          this.game.state = event.updatedGameState;
          if (event.roundScore != null) {
            this.game.roundScores.push(event.roundScore)
          }
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
    this.socket.emit("oh-heck-leave-game", this.getGameId());
  }

  ngAfterViewInit(): void {
    this.initializeTable();
  }

  initializeTable(): void {
    if (this.game != null && this.tableContainer != null) {
      if (this.table == null) {
        this.table = new OhHeckTable(
          {
            element: this.tableContainer.nativeElement,
          },
          this.onPlayCard,
          this.onRearrangeCards
        );
      }
      if (this.game.state !== GameState.PLAYERS_JOINING) {
        this.table.initializeState(this.game, this.user?.userId);
      }
    }
  }

  viewScores(): void {
    this.dialog.open(OhHeckGameScoreboardDialogComponent, {
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

  canBet(): boolean {
    return this.game != null && this.game.state == GameState.BETTING && this.game.actionToUserId == this.user?.userId;
  }

  getBetOptions(): number[] {
    if (this.game == null) {
      throw new Error("Game unexpectedly null");
    }
    const maxBet = this.game.playerStates[0].numberOfCards;
    return Array.from({length: maxBet + 1}, (_, i) => i);
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

  onPlayCard = async (card: ICard): Promise<void> => {
    this.gameService.playCard(this.getGameId(), { card }).subscribe(
      async (event: ITrickEvent) => {
        if (this.game == null) {
          throw new Error("Game unexpectedly null");
        }
        this.table.updateStateWithCardPlayed(event);
        this.game.actionToUserId = event.actionToUserId;
        this.game.state = event.updatedGameState;
        if (event.roundScore != null) {
          this.game.roundScores.push(event.roundScore)
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

  placeBet = async (): Promise<void> => {
    this.gameService.placeBet(this.getGameId(), { bet: this.betControl.value }).subscribe(
      async (response: IBetEvent) => {
        if (this.game == null) {
          throw new Error("Game unexpectedly null");
        }
        this.table.updateStateWithBetPlaced(response)
        this.game.actionToUserId = response.actionToUserId;
        this.game.state = response.updatedGameState;
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
    // TODO open with option to use rematch
    this.dialog.open(OhHeckNewGameDialogComponent)
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
}
