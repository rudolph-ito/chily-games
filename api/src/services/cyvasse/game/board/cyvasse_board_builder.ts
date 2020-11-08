import { BoardType, IVariantOptions } from "../../../../shared/dtos/cyvasse/variant";
import { ICyvasseBoard } from "./cyvasse_board";
import { CyvasseHexagonalBoard } from "./cyvasse_hexagonal_board";
import { CyvasseSquareBoard } from "./cyvasse_square_board";

export function getBoardForVariant(variant: IVariantOptions): ICyvasseBoard {
  if (variant.boardType === BoardType.HEXAGONAL) {
    return new CyvasseHexagonalBoard(variant.boardSize);
  }
  if (variant.boardType === BoardType.SQUARE) {
    return new CyvasseSquareBoard(variant.boardColumns, variant.boardRows);
  }
  throw new Error("Unexpected board type");
}
