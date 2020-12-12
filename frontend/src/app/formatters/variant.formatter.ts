import { IVariant, BoardType } from "../shared/dtos/cyvasse/variant";

export function getBoardDescription(variant: IVariant): string {
  if (variant.boardType === BoardType.HEXAGONAL) {
    return `Hexagonal (size: ${variant.boardSize as number})`;
  } else if (variant.boardType === BoardType.SQUARE) {
    return `Square (${variant.boardRows as number}x${
      variant.boardColumns as number
    })`;
  }
  return "Unknown";
}
