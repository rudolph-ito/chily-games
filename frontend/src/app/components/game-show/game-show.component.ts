import { Component, OnInit, ElementRef, ViewChild } from "@angular/core";
import { GameService } from "src/app/services/game.service";
import {
  IGame,
  PlayerColor,
  Action,
  IGameSetupRequirements,
} from "src/app/shared/dtos/game";
import { ActivatedRoute } from "@angular/router";
import { Observable, of, Subject } from "rxjs";
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
  userObservable: Observable<IUser> = of(null);
  board: BaseBoard;
  resizeObservable = new Subject<boolean>();

  @ViewChild("boardContainer") boardContainer: ElementRef;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly gameService: GameService,
    private readonly authenticationService: AuthenticationService,
    private readonly variantService: VariantService
  ) {
    this.resizeObservable
      .pipe(debounceTime(250))
      .subscribe(() => this.updateBoard());
  }

  ngOnInit(): void {
    this.loading = true;
    this.gameService.get(this.getGameId()).subscribe((game) => {
      this.game = game;
      this.variantService.get(game.variantId).subscribe((variant) => {
        this.variant = variant;
        if (this.game.action === Action.SETUP) {
          this.gameService
            .getSetupRequirements(this.getGameId())
            .subscribe((gameSetupRequirements) => {
              this.gameSetupRequirements = gameSetupRequirements;
              this.loading = false;
              this.drawBoard();
            });
        } else {
          this.loading = false;
          this.drawBoard();
        }
      });
    });
    this.userObservable = this.authenticationService.getUserSubject();
    this.authenticationService
      .getUserSubject()
      .subscribe((u) => {
        this.user = u
        this.updateBoard()
      });
  }

  ngAfterViewInit(): void {
    this.drawBoard();
  }

  drawBoard(): void {
    if (doesNotHaveValue(this.variant)) {
      return;
    }
    this.board = buildBoard(this.boardContainer.nativeElement, this.getPlayerColor(), {
      boardType: this.variant.boardType,
      boardSize: this.variant.boardSize,
      boardColumns: this.variant.boardColumns,
      boardRows: this.variant.boardRows,
      pieceRanks: this.variant.pieceRanks,
    }, this.gameSetupRequirements);
    this.board.addSpaces(false);
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
    return color
  }

  updateBoard(): void {
    if (this.board) {
      this.board.update({
        color: this.getPlayerColor(),
        inSetup: this.game.action === Action.SETUP,
        setupRequirements: this.gameSetupRequirements
      });
    }
  }

  getGameId(): number {
    return parseInt(this.route.snapshot.params.gameId);
  }

  onResize(): void {
    this.resizeObservable.next(true);
  }
}
