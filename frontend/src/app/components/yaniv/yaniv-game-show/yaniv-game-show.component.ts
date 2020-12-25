import { HttpErrorResponse } from "@angular/common/http";
import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatTableDataSource } from "@angular/material/table";
import { ActivatedRoute } from "@angular/router";
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
  IPlayerJoinedEvent,
  IPlayerState,
  IRoundFinishedEvent,
  IRoundPlayerScore,
  IRoundScore,
  RoundScoreType,
} from "../../../shared/dtos/yaniv/game";
import { doesNotHaveValue } from "../../../shared/utilities/value_checker";

interface RoundResult {
  userId: string;
  scoreType: RoundScoreType;
}

interface IFullRoundPlayerScore {
  userId: string;
  roundScore: IRoundPlayerScore;
}

@Component({
  selector: "app-yaniv-game-show",
  templateUrl: "./yaniv-game-show.component.html",
  styleUrls: ["./yaniv-game-show.component.styl"],
})
export class YanivGameShowComponent implements OnInit {
  loading: boolean;
  game: IGame | null;
  user: IUser | null;
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
        this.updateGame(game);
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
          this.updateGame(game);
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
        this.updateGame(this.game);
        this.initializeTable();
      });
  }

  updateGame(game: IGame): void {
    this.game = game;
    this.scoresDataSource.data = game.roundScores.concat([
      this.computeTotalScoreRow(game.roundScores),
    ]);
    this.scoresTableDisplayedColumns = game.playerStates.map(
      (x) => `player-${x.userId}`
    );
  }

  getUniquePlayerShortName(playerState: IPlayerState): string {
    if (this.game == null) {
      throw new Error("Game is required");
    }

    // First one / two / three letters
    for (let i = 0; i < 2; i++) {
      const fn: (x: IPlayerState) => string = (x) => x.username.slice(0, i + 1);
      if (this.isShortNameFunctionUnique(playerState, fn)) {
        return fn(playerState);
      }
    }

    // Combinations of three letters
    for (let j = 1; j < playerState.username.length; j++) {
      for (let k = j + 1; k < playerState.username.length; k++) {
        const fn: (x: IPlayerState) => string = (x) => {
          let value = x.username[0];
          if (j < x.username.length) {
            value += x.username[j];
            if (k < x.username.length) {
              value += x.username[k];
            }
          }
          return value;
        };
        if (this.isShortNameFunctionUnique(playerState, fn)) {
          return fn(playerState);
        }
      }
    }

    // Fall back to first three letters
    return playerState.username.slice(0, 3);
  }

  private isShortNameFunctionUnique(
    playerState: IPlayerState,
    fn: (x: IPlayerState) => string
  ): boolean {
    if (this.game == null) {
      throw new Error("Game is required");
    }
    const value = fn(playerState);
    return this.game.playerStates.every(
      (x) => x.userId === playerState.userId || fn(x) !== value
    );
  }

  computeTotalScoreRow(roundScores: IRoundScore[]): IRoundScore {
    const out: IRoundScore = {};
    roundScores.forEach((roundScore) => {
      for (const userId in roundScore) {
        if (doesNotHaveValue(out[userId])) {
          out[userId] = { scoreType: RoundScoreType.TOTAL, score: 0 };
        }
        out[userId].score += roundScore[userId].score;
      }
    });
    return out;
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
        this.updateGame(updatedGame);
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
    return this.game != null && this.game.state === GameState.ROUND_ACTIVE;
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
        this.updateGame(game);
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

  hasGameMessage(): boolean {
    return this.game != null && this.game.state === GameState.COMPLETE;
  }

  getGameMessage(): string {
    if (this.game != null) {
      if (this.game.state === GameState.COMPLETE) {
        const totalScoreMap = this.computeTotalScoreRow(this.game.roundScores);
        const roundScores: IFullRoundPlayerScore[] = Object.keys(
          totalScoreMap
        ).map((userId) => ({
          userId,
          roundScore: totalScoreMap[userId],
        }));
        const minScore = Math.min(
          ...roundScores.map((x) => x.roundScore.score)
        );
        const winners = roundScores.filter(
          (x) => x.roundScore.score === minScore
        );
        const usernames = winners.map((x) => this.getUsername(x.userId));
        if (usernames.length === 1) {
          return `Game over. The winner is: ${usernames[0]}`;
        }
        return `Game over. The winners are: ${usernames.join(",")}`;
      }
    }
    return "";
  }

  hasRoundMessage(): boolean {
    return (
      this.game != null &&
      (this.game.state === GameState.ROUND_COMPLETE ||
        this.game.state === GameState.COMPLETE)
    );
  }

  getRoundMessage(): string {
    if (this.hasRoundMessage()) {
      const result = this.getLastRoundResult();
      const username = this.getUsername(result.userId);
      if (result.scoreType === RoundScoreType.ASAF) {
        return `ASAF! ${username} called yaniv but did not have the lowest score`;
      }
      return `YANIV! ${username} called yaniv and had the lowest score`;
    }
    return "";
  }

  getRoundMessageClass(): any {
    const out: any = { "round-message": true };
    if (this.hasRoundMessage()) {
      const result = this.getLastRoundResult();
      if (result.scoreType === RoundScoreType.ASAF) {
        out.asaf = true;
      } else {
        out.yaniv = true;
      }
    }
    return out;
  }

  getLastRoundResult(): RoundResult {
    if (this.game == null) {
      throw new Error("Game unexpectedly null");
    }
    const lastRound = this.game.roundScores[this.game.roundScores.length - 1];
    const roundScores: IFullRoundPlayerScore[] = Object.keys(lastRound).map(
      (userId) => ({
        userId,
        roundScore: lastRound[userId],
      })
    );
    const yanivScores = roundScores.filter(
      (x) => x.roundScore.scoreType === RoundScoreType.YANIV
    );
    const asafScores = roundScores.filter(
      (x) => x.roundScore.scoreType === RoundScoreType.ASAF
    );
    if (asafScores.length === 1) {
      return { userId: asafScores[0].userId, scoreType: RoundScoreType.ASAF };
    }
    return { userId: yanivScores[0].userId, scoreType: RoundScoreType.YANIV };
  }

  getUsername(userId: string): string {
    if (this.game == null) {
      throw new Error("Game unexpectedly null");
    }
    return this.game.playerStates.filter(
      (x) => x.userId.toString() === userId
    )[0].username;
  }
}
