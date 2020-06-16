import { PieceType, CaptureType, IPieceRuleOptions } from "./piece_rule";
import { TerrainType } from "./terrain_rule";
import { IPaginationRequest } from "./search";

export enum Action {
  SETUP = "setup",
  PLAY = "play",
  COMPLETE = "complete",
  ABORTED = "aborted",
  RESIGNED = "resigned",
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
  capturedPiece?: IPiece;
}

export interface IGamePlyRangeCapture {
  from: ICoordinate;
  to: ICoordinate;
  capturedPice?: IPiece;
}

export interface IGamePly {
  piece: IPiece;
  movement?: IGamePlyMovement;
  rangeCapture?: IGamePlyRangeCapture;
}

export interface IGame {
  gameId: number;
  variantId: number;
  action: Action;
  actionToUserId: number;
  alabasterUserId: number;
  onyxUserId: number;
  initialSetup: ICoordinateMapData[];
  currentSetup: ICoordinateMapData[];
  plies: IGamePly[];
}

export interface ISearchGamesRequest {
  pagination: IPaginationRequest;
}

export interface IGameSetupPieceChange {
  pieceTypeId: PieceType;
  from?: ICoordinate;
  to?: ICoordinate;
}

export interface IGameSetupTerrainChange {
  terrainTypeId: TerrainType;
  from?: ICoordinate;
  to?: ICoordinate;
}

export interface IGameSetupChange {
  pieceChange?: IGameSetupPieceChange;
  terrainChange?: IGameSetupTerrainChange;
}
