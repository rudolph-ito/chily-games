import { IVariant, BoardType } from "../shared/dtos/cyvasse/variant";

export function getBoardDescription(variant: IVariant): string {
  if (variant.boardType === BoardType.HEXAGONAL) {
    return `Hexagonal (size: ${variant.boardSize})`;
  } else if (variant.boardType === BoardType.SQUARE) {
    return `Square (${variant.boardRows}x${variant.boardColumns})`;
  }
  return "Unknown";
}
