import { PieceType, CaptureType, IPieceRuleOptions } from "./piece_rule";
import { TerrainType } from "./terrain_rule";

export interface ICoordinate {
  x: number;
  y: number;
}

export interface ICoordinateData {
  piece?: IPiece;
  terrain?: ITerrain;
}

export type ISerializedCoordinateMap = Array<{
  key: ICoordinate;
  value: ICoordinateData;
}>;

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

export enum PlyEvaluationFlag {
  FREE = "free",
  CAPTURABLE = "capturable",
  REACHABLE = "reachable",
}

export const PLY_EVALUATION_FLAGS = [
  PlyEvaluationFlag.FREE,
  PlyEvaluationFlag.CAPTURABLE,
  PlyEvaluationFlag.REACHABLE,
];

export type ValidPlies = Record<PlyEvaluationFlag, ICoordinate[]>;

export interface IPreviewPieceRuleRequest {
  evaluationType: CaptureType;
  pieceRule: IPieceRuleOptions;
}

export interface IPreviewPieceRuleResponse {
  serializedCoordinateMap: ISerializedCoordinateMap;
  validPlies: ValidPlies;
}
