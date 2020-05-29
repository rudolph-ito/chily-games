import { PieceType } from "./piece_rule";
import { TerrainType } from "./terrain_rule";

export interface ICoordinate {
  x: number;
  y: number;
}

export interface IPiece {
  pieceTypeId: PieceType;
  userId: number;
}

export interface ITerrain {
  terrainTypeId: TerrainType;
  userId: number;
}

export enum PlayerColor {
  alabaster = "alabaster",
  onyx = "onyx",
}
