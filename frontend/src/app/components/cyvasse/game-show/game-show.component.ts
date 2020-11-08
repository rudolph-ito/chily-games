import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  NgZone,
} from "@angular/core";
import { GameService } from "src/app/services/cyvasse/game.service";
import {
  IGame,
  PlayerColor,
  Action,
  IGameRules,
  IGameSetupChange,
  IGamePlyEvent,
  IGamePly,
  IGetGameValidPliesRequest,
  ValidPlies,
} from "../../../shared/dtos/game";
import { ActivatedRoute } from "@angular/router";
import { Observable, of, Subject, forkJoin } from "rxjs";
import { IUser } from "../../../shared/dtos/authentication";
import { AuthenticationService } from "src/app/services/authentication.service";
import { IVariant } from "src/app/shared/dtos/variant";
import { VariantService } from "src/app/services/cyvasse/variant.service";
import { BaseBoard } from "src/app/game/board/base_board";
import {
  doesNotHaveValue,
  doesHaveValue,
} from "../../../shared/utilities/value_checker";
import { buildBoard } from "src/app/game/board/board_builder";
import { debounceTime } from "rxjs/operators";
import { UserService } from "src/app/services/user.service";
import { HttpErrorResponse } from "@angular/common/http";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Socket } from "ngx-socket-io";

@Component({
  selector: "app-game-show",
  templateUrl: "./game-show.component.html",
  styleUrls: ["./game-show.component.styl"],
})
export class GameShowComponent implements OnInit {
  loading = false;
  game: IGame;
  gameRules: IGameRules;
  variant: IVariant;
  user: IUser;
  alabasterUser: IUser;
  onyxUser: IUser;
  userObservable: Observable<IUser> = of(null);
  board: BaseBoard;
  resizeObservable = new Subject<boolean>();

  @ViewChild("boardContainer") boardContainer: ElementRef;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly gameService: GameService,
    private readonly authenticationService: AuthenticationService,
    private readonly variantService: VariantService,
    private readonly userService: UserService,
    private readonly snackBar: MatSnackBar,
    private readonly ngZone: NgZone,
    private readonly socket: Socket
  ) {
    this.resizeObservable
      .pipe(debounceTime(250))
      .subscribe(() => this.updateBoard());
  }

  ngOnInit(): void {
    this.socket.emit("cyvasse-join-game", this.getGameId());
    this.socket
      .fromEvent<IGamePlyEvent>("game-ply")
      .subscribe((gamePlyEvent) => {
        this.game.action = gamePlyEvent.nextAction;
        this.game.actionTo = gamePlyEvent.nextActionTo;
        if (this.game.plies.length === gamePlyEvent.plyIndex) {
          this.game.plies.push(gamePlyEvent.ply);
          this.board.applyPly(gamePlyEvent.ply);
        } else {
          // TODO refresh with snackbar saying game out of date, refreshing
          alert("Out of date. Please refresh");
        }
      });
    this.loading = true;
    this.gameService.get(this.getGameId()).subscribe((game) => {
      this.game = game;
      forkJoin({
        variant: this.variantService.get(game.variantId),
        gameRules: this.gameService.getRules(this.getGameId()),
        alabasterUser: this.userService.get(this.game.alabasterUserId),
        onyxUser: this.userService.get(this.game.onyxUserId),
      }).subscribe(({ variant, gameRules, alabasterUser, onyxUser }) => {
        this.gameRules = gameRules;
        this.variant = variant;
        this.alabasterUser = alabasterUser;
        this.onyxUser = onyxUser;
        this.loading = false;
        this.drawBoard();
      });
    });
    this.userObservable = this.authenticationService.getUserSubject();
    this.authenticationService.getUserSubject().subscribe((u) => {
      this.user = u;
      this.gameService.get(this.getGameId()).subscribe((game) => {
        this.game = game;
        this.updateBoard();
      });
    });
  }

  ngAfterViewInit(): void {
    this.drawBoard();
  }

  drawBoard(): void {
    if (
      doesNotHaveValue(this.variant) ||
      doesNotHaveValue(this.boardContainer)
    ) {
      return;
    }
    this.board = buildBoard({
      element: this.boardContainer.nativeElement,
      color: this.getPlayerColor(),
      game: this.game,
      variant: {
        boardType: this.variant.boardType,
        boardSize: this.variant.boardSize,
        boardColumns: this.variant.boardColumns,
        boardRows: this.variant.boardRows,
        pieceRanks: this.variant.pieceRanks,
      },
      gameRules: this.gameRules,
      gameCallbacks: {
        onUpdateSetup: async (setupChange: IGameSetupChange) => {
          return await new Promise((resolve, reject) => {
            this.gameService
              .updateSetup(this.getGameId(), setupChange)
              .subscribe(
                () => resolve(true),
                (errorResponse: HttpErrorResponse) => {
                  if (errorResponse.status === 422) {
                    this.ngZone.run(() => {
                      this.snackBar.open(errorResponse.error.general, null, {
                        duration: 2500,
                      });
                    });
                    resolve(false);
                  } else {
                    reject(errorResponse);
                  }
                }
              );
          });
        },
        onCreatePly: async (ply: IGamePly) => {
          return await new Promise((resolve, reject) => {
            this.gameService.createPly(this.getGameId(), ply).subscribe(
              () => resolve(true),
              (errorResponse: HttpErrorResponse) => {
                if (errorResponse.status === 422) {
                  this.ngZone.run(() => {
                    this.snackBar.open(errorResponse.error.general, null, {
                      duration: 2500,
                    });
                  });
                  resolve(false);
                } else {
                  reject(errorResponse);
                }
              }
            );
          });
        },
        onGetValidPlies: async (request: IGetGameValidPliesRequest) => {
          return await new Promise((resolve, reject) => {
            this.gameService.getValidPlies(this.getGameId(), request).subscribe(
              (validPlies: ValidPlies) => resolve(validPlies),
              (errorResponse: HttpErrorResponse) => reject(errorResponse)
            );
          });
        },
      },
    });
    this.board.addSpaces(true);
    if (this.game.action === Action.SETUP) {
      this.board.addSetup();
    } else {
      this.board.addCurrentSetup();
    }
    this.updateBoard();
  }

  getPlayerColor(): PlayerColor {
    let color = null;
    if (doesHaveValue(this.user)) {
      if (this.user.userId === this.game.alabasterUserId) {
        color = PlayerColor.ALABASTER;
      }
      if (this.user.userId === this.game.onyxUserId) {
        color = PlayerColor.ONYX;
      }
    }
    return color;
  }

  updateBoard(): void {
    if (doesHaveValue(this.board)) {
      this.board.update({
        color: this.getPlayerColor(),
        game: this.game,
        gameRules: this.gameRules,
      });
    }
  }

  getPlayerName(isHeader: boolean): string {
    let isAlabaster = true;
    if (isHeader) {
      isAlabaster = this.getPlayerColor() === PlayerColor.ONYX;
    } else {
      isAlabaster = this.getPlayerColor() !== PlayerColor.ONYX;
    }
    if (isAlabaster) {
      return `Alabaster (${this.alabasterUser.username})`;
    }
    return `Onyx (${this.onyxUser.username})`;
  }

  getGameId(): number {
    return parseInt(this.route.snapshot.params.gameId);
  }

  onResize(): void {
    this.resizeObservable.next(true);
  }

  canCompleteSetup(): boolean {
    return (
      doesHaveValue(this.getPlayerColor()) &&
      this.game.action === Action.SETUP &&
      (doesNotHaveValue(this.game.actionTo) ||
        this.game.actionTo === this.getPlayerColor())
    );
  }

  onCompleteSetup(): void {
    this.gameService.completeSetup(this.getGameId()).subscribe(
      () => {
        this.gameService.get(this.getGameId()).subscribe((game) => {
          this.game = game;
        });
      },
      (errorResponse: HttpErrorResponse) => {
        if (errorResponse.status === 422) {
          this.ngZone.run(() => {
            this.snackBar.open(errorResponse.error.general, null, {
              duration: 2500,
            });
          });
        }
      }
    );
  }

  getGameStatus(): string {
    if (this.game.action === Action.SETUP) {
      if (doesNotHaveValue(this.game.actionTo)) {
        return "Both players setting up";
      } else {
        return `${this.game.actionTo} setting up`;
      }
    } else if (this.game.action === Action.PLAY) {
      return `${this.game.actionTo} to play`;
    } else if (this.game.action === Action.COMPLETE) {
      return `${this.game.actionTo} has been defeated`;
    }
    return "TODO";
  }

  isActionTo(isHeader: boolean): boolean {
    let isAlabaster = true;
    if (isHeader) {
      isAlabaster = this.getPlayerColor() === PlayerColor.ONYX;
    } else {
      isAlabaster = this.getPlayerColor() !== PlayerColor.ONYX;
    }
    if (isAlabaster) {
      return this.game.actionTo === PlayerColor.ALABASTER;
    }
    return this.game.actionTo === PlayerColor.ONYX;
  }
}
