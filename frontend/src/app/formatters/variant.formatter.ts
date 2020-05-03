import { IVariant, BOARD_TYPE } from "../shared/dtos/variant";

export function getBoardDescription(variant: IVariant): string {
  if (variant.boardType === BOARD_TYPE.HEXAGONAL) {
    return `Hexagonal (size: ${variant.boardSize})`;
  } else if (variant.boardType === BOARD_TYPE.SQUARE) {
    return `Square (${variant.boardRows}x${variant.boardColumns})`;
  }
  return "Unknown";
}
