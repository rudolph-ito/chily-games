import { PieceType, CaptureType, IPieceRuleOptions } from "./piece_rule";
import { TerrainType } from "./terrain_rule";

export enum Action {
  SETUP = "setup",
  PLAY = "play",
  COMPLETE = "complete",
}

export interface ICoordinate {
  x: number;
  y: number;
}

export interface ICoordinateData {
  piece?: IPiece;
  terrain?: ITerrain;
}

export interface ICoordinateMapData {
  key: ICoordinate;
  value: ICoordinateData;
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
  origin: ICoordinate;
  validPlies: ValidPlies;
}

export interface IGamePlyMovement {
  from: ICoordinate;
  to: ICoordinate;
}

export interface IGamePly {
  piece: IPiece;
  capturedPiece?: IPiece;
  movement: IGamePlyMovement;
  isRangeCapture: boolean;
}

export interface IGame {
  variantId: number;
  action: Action;
  actionToUserId: number;
  alabasterUserId: number;
  onyxUserId: number;
  initialSetup: ICoordinateMapData[];
  currentSetup: ICoordinateMapData[];
  plies: IGamePly[];
}
