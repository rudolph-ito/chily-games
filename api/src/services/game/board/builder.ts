import { IVariant, BoardType } from "../../..//shared/dtos/variant";
import { IBoard } from ".";
import { HexagonalBoard } from "./hexagonal_board";
import { SquareBoard } from "./square_board";

export function getBoardForVariant(variant: IVariant): IBoard {
  if (variant.boardType === BoardType.HEXAGONAL) {
    return new HexagonalBoard(variant.boardSize);
  }
  if (variant.boardType === BoardType.SQUARE) {
    return new SquareBoard(variant.boardColumns, variant.boardRows);
  }
  throw new Error("Unexpected board type");
}
