import {
  BoardType,
  IVariantOptions,
} from "../../../../shared/dtos/cyvasse/variant";
import { ICyvasseBoard } from "./cyvasse_board";
import { CyvasseHexagonalBoard } from "./cyvasse_hexagonal_board";
import { CyvasseSquareBoard } from "./cyvasse_square_board";

export function getBoardForVariant(variant: IVariantOptions): ICyvasseBoard {
  if (variant.boardType === BoardType.HEXAGONAL) {
    return new CyvasseHexagonalBoard(variant.boardSize as number);
  }
  if (variant.boardType === BoardType.SQUARE) {
    return new CyvasseSquareBoard(
      variant.boardColumns as number,
      variant.boardRows as number
    );
  }
  throw new Error("Unexpected board type");
}
