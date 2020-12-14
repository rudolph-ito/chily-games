import { BoardType, IVariantOptions } from "../../shared/dtos/cyvasse/variant";
import { HexagonalBoard } from "./hexagonal_board";
import { SquareBoard } from "./square_board";
import { BaseBoard, IGameCallbacks } from "./base_board";
import { PlayerColor, IGame, IGameRules } from "../../shared/dtos/cyvasse/game";

export interface IBuildBoardOptions {
  element: HTMLDivElement;
  color: PlayerColor | null;
  variant: IVariantOptions;
  game?: IGame;
  gameCallbacks?: IGameCallbacks;
  gameRules?: IGameRules;
}

export function buildBoard(options: IBuildBoardOptions): BaseBoard {
  if (options.variant.boardType === BoardType.HEXAGONAL) {
    if (options.variant.boardSize == null) {
      throw new Error("Expected boardSize to be defined for hexagonal boards");
    }
    return new HexagonalBoard(options, {
      boardSize: options.variant.boardSize,
    });
  }
  if (options.variant.boardType === BoardType.SQUARE) {
    if (
      options.variant.boardColumns == null ||
      options.variant.boardRows == null
    ) {
      throw new Error(
        "Expected boardColumns and boardRows to be defined for square boards"
      );
    }
    return new SquareBoard(options, {
      boardColumns: options.variant.boardColumns,
      boardRows: options.variant.boardRows,
    });
  }
  throw new Error("Unexpected board type");
}
