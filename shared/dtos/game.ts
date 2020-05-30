import { PieceType } from "./piece_rule";
import { TerrainType } from "./terrain_rule";

export interface ICoordinate {
  x: number;
  y: number;
}

export interface IPiece {
  pieceTypeId: PieceType;
  playerColor: PlayerColor;
}

export interface ITerrain {
  terrainTypeId: TerrainType;
  playerColor: PlayerColor;
}

export enum PlayerColor {
  ALABASTER = "alabaster",
  ONYX = "onyx",
}
