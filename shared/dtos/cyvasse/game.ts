import { PieceType, CaptureType, IPieceRuleOptions } from "./piece_rule";
import { TerrainType } from "./terrain_rule";
import { IPaginationRequest } from "../search";

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

export interface IGetGameValidPliesRequest {
  coordinate: ICoordinate;
  evaluationType: CaptureType;
}

export interface IGamePlyMovement {
  to: ICoordinate;
  capturedPiece?: IPiece;
}

export interface IGamePlyRangeCapture {
  to: ICoordinate;
  capturedPiece: IPiece;
}

export interface IGamePly {
  piece: IPiece;
  from: ICoordinate;
  movement?: IGamePlyMovement;
  rangeCapture?: IGamePlyRangeCapture;
}

export interface IGamePlyEvent {
  nextAction: Action;
  nextActionTo: PlayerColor;
  ply: IGamePly;
  plyIndex: number;
}

export interface IGame {
  gameId: number;
  variantId: number;
  action: Action;
  actionTo: PlayerColor;
  alabasterUserId: number;
  onyxUserId: number;
  alabasterSetupCoordinateMap: ICoordinateMapData[];
  onyxSetupCoordinateMap: ICoordinateMapData[];
  currentCoordinateMap: ICoordinateMapData[];
  plies: IGamePly[];
}

export interface IGamePieceRule {
  pieceTypeId: PieceType;
  count: number;
  captureType: CaptureType;
  moveAndRangeCapture: boolean;
}

export interface IGameTerrainRule {
  terrainTypeId: TerrainType;
  count: number;
}

export interface IGameSetupTerritories {
  alabaster: ICoordinate[];
  neutral: ICoordinate[];
  onyx: ICoordinate[];
}

export interface IGameRules {
  pieces: IGamePieceRule[];
  terrains: IGameTerrainRule[];
  setupTerritories: IGameSetupTerritories;
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
