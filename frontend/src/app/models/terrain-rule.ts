import { ISelectOption } from "./form";
import { TerrainType, PiecesEffectedType } from "../shared/dtos/cyvasse/terrain_rule";

export const TERRAIN_TYPE_OPTIONS: ISelectOption[] = [
  { label: "Forest", value: TerrainType.FOREST },
  { label: "Mountain", value: TerrainType.MOUNTAIN },
  { label: "Water", value: TerrainType.WATER },
];

export const PIECES_EFFECTED_TYPE_OPTIONS: ISelectOption[] = [
  { label: "All", value: PiecesEffectedType.ALL },
  { label: "All except", value: PiecesEffectedType.ALL_EXCEPT },
  { label: "Only", value: PiecesEffectedType.ONLY },
  { label: "None", value: PiecesEffectedType.NONE },
];
