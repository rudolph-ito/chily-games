import { Component, OnInit, ElementRef, ViewChild } from "@angular/core";
import { GameService } from "src/app/services/game.service";
import { IGame, PlayerColor } from "src/app/shared/dtos/game";
import { ActivatedRoute } from "@angular/router";
import { Observable, of } from "rxjs";
import { IUser } from "src/app/shared/dtos/authentication";
import { AuthenticationService } from "src/app/services/authentication.service";
import { IVariant } from "src/app/shared/dtos/variant";
import { VariantService } from "src/app/services/variant.service";
import { BaseBoard } from "src/app/game/board/base_board";
import {
  doesHaveValue,
  doesNotHaveValue,
} from "src/app/shared/utilities/value_checker";
import { buildBoard } from "src/app/game/board/board_builder";
import { tap } from "rxjs/operators";

@Component({
  selector: "app-game-show",
  templateUrl: "./game-show.component.html",
  styleUrls: ["./game-show.component.styl"],
})
export class GameShowComponent implements OnInit {
  loading = false;
  game: IGame;
  variant: IVariant;
  user: IUser;
  userObservable: Observable<IUser> = of(null);
  board: BaseBoard;

  @ViewChild("boardContainer") boardContainer: ElementRef;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly gameService: GameService,
    private readonly authenticationService: AuthenticationService,
    private readonly variantService: VariantService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.gameService.get(this.getGameId()).subscribe((game) => {
      this.game = game;
      this.variantService.get(game.variantId).subscribe((variant) => {
        this.variant = variant;
        this.loading = false;
        this.drawBoard();
      });
    });
    this.userObservable = this.authenticationService
      .getUserSubject()
      .pipe(tap((u) => (this.user = u)));
  }

  ngAfterViewInit(): void {
    this.drawBoard();
  }

  drawBoard(): void {
    if (doesNotHaveValue(this.variant)) {
      return;
    }
    const color =
      doesNotHaveValue(this.user) ||
      this.user.userId == this.game.alabasterUserId
        ? PlayerColor.ALABASTER
        : PlayerColor.ONYX;
    this.board = buildBoard(this.boardContainer.nativeElement, color, {
      boardType: this.variant.boardType,
      boardSize: this.variant.boardSize,
      boardColumns: this.variant.boardColumns,
      boardRows: this.variant.boardRows,
      pieceRanks: this.variant.pieceRanks,
    });
    this.board.draw(false);
  }

  getGameId(): number {
    return parseInt(this.route.snapshot.params.gameId);
  }
}
