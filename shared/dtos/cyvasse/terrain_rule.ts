import { PieceType } from "./piece_rule";

// Enums

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

// Primary interfaces

export interface IPiecesEffected {
  for: PiecesEffectedType;
  pieceTypeIds: PieceType[];
}

export interface ISlowsMovement extends IPiecesEffected {
  by: number | null;
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

// Validation error interfaces

export interface IPiecesEffectedValidationErrors {
  for?: string;
  pieceTypeIds?: string;
}

export interface ISlowsMovementValidationErrors
  extends IPiecesEffectedValidationErrors {
  by?: string;
}

export interface ITerrainRuleValidationErrors {
  terrainTypeId?: string;
  count?: string;
  passableMovement?: IPiecesEffectedValidationErrors;
  passableRange?: IPiecesEffectedValidationErrors;
  slowsMovement?: ISlowsMovementValidationErrors;
  stopsMovement?: IPiecesEffectedValidationErrors;
}
