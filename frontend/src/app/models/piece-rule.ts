import { ISelectOption } from "./form";
import { PathType, PieceType, CaptureType } from "../shared/dtos/piece_rule";

export const PIECE_TYPE_OPTIONS: ISelectOption[] = [
  { label: "Catapult", value: PieceType.CATAPULT },
  { label: "Crossbow", value: PieceType.CROSSBOW },
  { label: "Dragon", value: PieceType.DRAGON },
  { label: "Elephant", value: PieceType.ELEPHANT },
  { label: "Heavy horse", value: PieceType.HEAVY_HORSE },
  { label: "King", value: PieceType.KING },
  { label: "Light horse", value: PieceType.LIGHT_HORSE },
  { label: "Rabble", value: PieceType.RABBLE },
  { label: "Spear", value: PieceType.SPEAR },
  { label: "Trebuhcet", value: PieceType.TREBUCHET },
];

export const PATH_TYPE_OPTIONS: ISelectOption[] = [
  { label: "Orthogonal line", value: PathType.ORTHOGONAL_LINE },
  { label: "Diagonal line", value: PathType.DIAGONAL_LINE },
  {
    label: "Orthogonal or diagonal line",
    value: PathType.ORTHOGONAL_OR_DIAGONAL_LINE,
  },
  { label: "Orthogonal with turns", value: PathType.ORTHOGONAL_WITH_TURNS },
  { label: "Diagonal with turns", value: PathType.DIAGONAL_WITH_TURNS },
];

export const CAPTURE_TYPE_OPTIONS: ISelectOption[] = [
  { label: "Movement", value: CaptureType.MOVEMENT },
  { label: "Range", value: CaptureType.RANGE },
];
