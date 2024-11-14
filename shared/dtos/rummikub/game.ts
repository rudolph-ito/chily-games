import { IPaginationRequest } from "../search";
import { ITile } from "./tile";

export interface IPlayerState {
  userId: number;
  displayName: string;
  hasPlayedInitialMeld: boolean;
  numberOfTiles: number;
  tiles: ITile[];
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
  sets: ITile[][];
  tilePoolCount: number;
  roundScores: IRoundScore[];
  createdAt: string;
  updatedAt: string;
}

export interface IUpdateSets {
  tilesAdded: ITile[];
  sets: ITile[][];
}

export interface IGameActionRequest {
  initialMeld?: ITile[][];
  updateSets?: IUpdateSets;
  pickUpTile?: boolean;
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
  initialMeld?: ITile[][];
  updateSets?: IUpdateSets;
  pickedUpTile?: boolean;
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
