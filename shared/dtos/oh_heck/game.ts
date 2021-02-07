import { IPaginationRequest } from "../search";
import { ICard } from "../card";

export interface IPlayerState {
  userId: number;
  displayName: string;
  numberOfCards: number;
  cards: ICard[];
  bet: number;
  tricksTaken: number;
}

export interface IRoundPlayerScore {
  bet: number;
  betWasCorrect: boolean;
  score: number;
}

export interface IRoundScore {
  [userId: number]: IRoundPlayerScore;
}

export enum GameState {
  PLAYERS_JOINING = "players_joining",
  ROUND_ACTIVE = "round_active",
  ROUND_COMPLETE = "round_complete",
  COMPLETE = "complete",
  ABORTED = "aborted",
}

export interface ITrickPlayerCard {
  userId: number;
  card: ICard;
}

export interface IGame {
  gameId: number;
  hostUserId: number;
  state: GameState;
  playerStates: IPlayerState[];
  currentTrick: ITrickPlayerCard[];
  roundScores: IRoundScore;
  actionToUserId: number;
  createdAt: string;
  updatedAt: string;
}

export interface IGameActionRequest {
  cardPlayed: ICard;
}

export interface IGameActionResponse {
  actionToNextPlayerEvent?: IActionToNextPlayerEvent;
  roundFinishedEvent?: IRoundFinishedEvent;
}

export interface IPlayerJoinedEvent {
  playerStates: IPlayerState[];
}

export interface ILastAction {
  userId: number;
  cardPlayed: ICard;
}

export interface IActionToNextPlayerEvent {
  lastAction: ILastAction;
  actionToUserId: number;
}

export interface IRoundFinishedEvent {
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
