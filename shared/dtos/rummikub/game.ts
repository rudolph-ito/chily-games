import { IPaginationRequest } from "../search";
import { ITile } from "./tile";

// null used to mark space
export type INullableTile = ITile | null;

export interface IPlayerState {
  userId: number;
  displayName: string;
  hasPlayedInitialMeld: boolean;
  passedLastTurn: boolean;
  numberOfTiles: number;
  tiles: INullableTile[];
}

export interface IRoundPlayerScore {
  score: number;
}

export interface IRoundScore {
  [userId: number]: IRoundPlayerScore;
}

export interface IGameOptions {
  hideTileCount: boolean;
  playTo: number;
}

export enum GameState {
  PLAYERS_JOINING = "players_joining",
  ROUND_ACTIVE = "round_active",
  ROUND_COMPLETE = "round_complete",
  COMPLETE = "complete",
  ABORTED = "aborted",
}

export interface IGame {
  gameId: number;
  hostUserId: number;
  options: IGameOptions;
  state: GameState;
  actionToUserId: number;
  sets: INullableTile[];
  tilePoolCount: number;
  playerStates: IPlayerState[];
  latestUpdateSets: IUpdateSets | null; // null if no changes from lastValidUpdateSets
  lastValidUpdateSets: IUpdateSets | null; // null if not made any changes
  roundScores: IRoundScore[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface IUpdateSets {
  tilesAdded: ITile[];
  sets: INullableTile[];
  remainingTiles: INullableTile[];
}

export interface IPickedUpTileData {
  tile: ITile;
  playerTileIndex: number;
  tilePoolCount: number;
}

export interface IDoneWithTurnResponse {
  pickedUpTileData?: IPickedUpTileData;
  actionToNextPlayerEvent?: IActionToNextPlayerEvent;
  roundFinishedEvent?: IRoundFinishedEvent;
}

export interface IPlayerJoinedEvent {
  playerStates: IPlayerState[];
}

export interface ILastAction {
  userId: number;
  pickUpTile: boolean;
  pass: boolean;
  tilePoolCount?: number;
}

export interface IPlayerUpdatedSetsEvent {
  version: number;
  updateSets: IUpdateSets;
}

export interface IActionToNextPlayerEvent {
  version: number;
  lastAction: ILastAction;
  actionToUserId: number;
}

export interface IRoundFinishedEvent {
  version: number;
  lastAction: ILastAction;
  winnerUserId: number;
  playerStates: IPlayerState[];
  roundScore: IRoundScore;
  updatedGameState: GameState;
}

export interface INewGameStartedEvent {
  userId: number;
  gameId: number;
}

export interface ISearchedGameUser {
  userId: number;
  displayName: string;
}

export interface ISearchedGame {
  gameId: number;
  hostUserId: number;
  state: GameState;
  players: ISearchedGameUser[];
  createdAt: string;
  updatedAt: string;
}

export interface ISearchGamesFilterRequest {
  includeCompleted: boolean;
}

export interface ISearchGamesRequest {
  filter: ISearchGamesFilterRequest;
  pagination: IPaginationRequest;
}
