import {
  BoardType,
  IVariantOptions,
} from "../../../../shared/dtos/cyvasse/variant";
import { ICyvasseBoard } from "./cyvasse_board";
import { CyvasseHexagonalBoard } from "./cyvasse_hexagonal_board";
import { CyvasseSquareBoard } from "./cyvasse_square_board";

export function getBoardForVariant(variant: IVariantOptions): ICyvasseBoard {
  if (variant.boardType === BoardType.HEXAGONAL) {
    if (variant.boardSize == null) {
      throw new Error("Expected boardSize to be defined for hexagonal boards");
    }
    return new CyvasseHexagonalBoard(variant.boardSize);
  }
  if (variant.boardType === BoardType.SQUARE) {
    if (variant.boardColumns == null || variant.boardRows == null) {
      throw new Error(
        "Expected boardColumns and boardRows to be defined for square boards"
      );
    }
    return new CyvasseSquareBoard(variant.boardColumns, variant.boardRows);
  }
  throw new Error("Unexpected board type");
}
