import { BoardType, IVariantOptions } from "../../shared/dtos/variant";
import { HexagonalBoard } from "./hexagonal_board";
import { SquareBoard } from "./square_board";
import { BaseBoard } from "./base_board";
import { PlayerColor, IGameSetupRequirements } from "../../shared/dtos/game";

export function buildBoard(
  element: HTMLDivElement,
  color: PlayerColor,
  variant: IVariantOptions,
  setupRequirements: IGameSetupRequirements = null
): BaseBoard {
  if (variant.boardType === BoardType.HEXAGONAL) {
    return new HexagonalBoard(element, {
      layout: {
        boardSize: variant.boardSize,
      },
      color,
      setupRequirements,
    });
  }
  if (variant.boardType === BoardType.SQUARE) {
    return new SquareBoard(element, {
      layout: {
        boardColumns: variant.boardColumns,
        boardRows: variant.boardRows,
      },
      color,
      setupRequirements,
    });
  }
  throw new Error("Unexpected board type");
}
