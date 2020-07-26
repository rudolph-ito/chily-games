import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  NgZone,
} from "@angular/core";
import { GameService } from "src/app/services/game.service";
import {
  IGame,
  PlayerColor,
  Action,
  IGameSetupRequirements,
  IGameSetupChange,
} from "src/app/shared/dtos/game";
import { ActivatedRoute } from "@angular/router";
import { Observable, of, Subject, forkJoin } from "rxjs";
import { IUser } from "src/app/shared/dtos/authentication";
import { AuthenticationService } from "src/app/services/authentication.service";
import { IVariant } from "src/app/shared/dtos/variant";
import { VariantService } from "src/app/services/variant.service";
import { BaseBoard } from "src/app/game/board/base_board";
import {
  doesNotHaveValue,
  doesHaveValue,
} from "../../shared/utilities/value_checker";
import { buildBoard } from "src/app/game/board/board_builder";
import { debounceTime } from "rxjs/operators";
import { UserService } from "src/app/services/user.service";
import { HttpErrorResponse } from "@angular/common/http";
import { MatSnackBar } from "@angular/material/snack-bar";

@Component({
  selector: "app-game-show",
  templateUrl: "./game-show.component.html",
  styleUrls: ["./game-show.component.styl"],
})
export class GameShowComponent implements OnInit {
  loading = false;
  game: IGame;
  gameSetupRequirements: IGameSetupRequirements;
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
    private readonly ngZone: NgZone
  ) {
    this.resizeObservable
      .pipe(debounceTime(250))
      .subscribe(() => this.updateBoard());
  }

  ngOnInit(): void {
    this.loading = true;
    this.gameService.get(this.getGameId()).subscribe((game) => {
      this.game = game;
      forkJoin({
        variant: this.variantService.get(game.variantId),
        gameSetupRequirements:
          this.game.action === Action.SETUP
            ? this.gameService.getSetupRequirements(this.getGameId())
            : of(null as IGameSetupRequirements),
        alabasterUser: this.userService.get(this.game.alabasterUserId),
        onyxUser: this.userService.get(this.game.onyxUserId),
      }).subscribe(
        ({ variant, gameSetupRequirements, alabasterUser, onyxUser }) => {
          this.gameSetupRequirements = gameSetupRequirements;
          this.variant = variant;
          this.alabasterUser = alabasterUser;
          this.onyxUser = onyxUser;
          this.loading = false;
          this.drawBoard();
        }
      );
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
      setupRequirements: this.gameSetupRequirements,
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
      },
    });
    this.board.addSpaces(true);
    if (this.game.action === Action.SETUP) {
      this.board.addSetup(this.gameSetupRequirements);
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
        setupRequirements: this.gameSetupRequirements,
      });
    }
  }

  getPlayerName(isHeader: boolean): string {
    let headerUser = this.onyxUser;
    let footerUser = this.alabasterUser;
    if (this.getPlayerColor() === PlayerColor.ONYX) {
      headerUser = this.alabasterUser;
      footerUser = this.onyxUser;
    }
    const user = isHeader ? headerUser : footerUser;
    return user.username;
  }

  getGameId(): number {
    return parseInt(this.route.snapshot.params.gameId);
  }

  onResize(): void {
    this.resizeObservable.next(true);
  }
}
