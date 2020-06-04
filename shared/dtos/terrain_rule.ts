import { PieceType } from "./piece_rule";

export enum TerrainType {
  FOREST = "forest",
  MOUNTAIN = "mountain",
  WATER = "water",
}

export enum PiecesEffectedType {
  ALL = "all",
  ALL_EXCEPT = "all_except",
  NONE = "none",
  ONLY = "only",
}

export interface IPiecesEffected {
  for: PiecesEffectedType;
  pieceTypeIds: PieceType[];
}

export interface ISlowsMovement extends IPiecesEffected {
  slowsMovementBy: number;
}

export interface ITerrainRuleOptions {
  terrainTypeId: TerrainType;
  count: number;
  passableMovement: IPiecesEffected;
  passableRange: IPiecesEffected;
  slowsMovement: ISlowsMovement;
  stopsMovement: IPiecesEffected;
}

export interface ITerrainRule extends ITerrainRuleOptions {
  terrainRuleId: number;
  variantId: number;
}
