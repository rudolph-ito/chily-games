import { IVariant, BoardType } from "../shared/dtos/cyvasse/variant";

export function getBoardDescription(variant: IVariant): string {
  if (variant.boardType === BoardType.HEXAGONAL) {
    if (variant.boardSize == null) {
      throw new Error("Expected boardSize to be defined for hexagonal boards");
    }
    return `Hexagonal (size: ${variant.boardSize})`;
  } else if (variant.boardType === BoardType.SQUARE) {
    if (variant.boardColumns == null || variant.boardRows == null) {
      throw new Error(
        "Expected boardColumns and boardRows to be defined for square boards"
      );
    }
    return `Square (${variant.boardRows}x${variant.boardColumns})`;
  }
  return "Unknown";
}
