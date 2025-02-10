import { IPaginationRequest } from "../search";
import { ITile } from "./tile";

// null used to mark end of row
export type ISets = (ITile[] | null)[];
export type IPlayerTiles = (ITile | null)[];

export interface IPlayerState {
  userId: number;
  displayName: string;
  hasPlayedInitialMeld: boolean;
  passedLastTurn: boolean;
  numberOfTiles: number;
  tiles: IPlayerTiles;
}

export interface IRoundScore {
  [userId: number]: number;
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
  playerStates: IPlayerState[];
  sets: ISets;
  tilePoolCount: number;
  roundScores: IRoundScore[];
  createdAt: string;
  updatedAt: string;
}

export interface IUpdateSets {
  tilesAdded: ITile[];
  sets: ISets;
}

export interface IGameActionRequest {
  updateSets?: IUpdateSets;
  pickUpTileOrPass?: boolean;
}

export interface IGameActionResponse {
  tilePickedUp?: ITile;
  actionToNextPlayerEvent?: IActionToNextPlayerEvent;
  roundFinishedEvent?: IRoundFinishedEvent;
}

export interface IPlayerJoinedEvent {
  playerStates: IPlayerState[];
}

export interface ILastAction {
  userId: number;
  action: IGameActionRequest;
}

export interface IActionToNextPlayerEvent {
  lastAction: ILastAction;
  actionToUserId: number;
}

export interface IRoundFinishedEvent {
  lastAction: ILastAction;
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
