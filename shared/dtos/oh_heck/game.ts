import { IPaginationRequest } from "../search";
import { ICard } from "../card";

export interface IPlayerState {
  userId: number;
  displayName: string;
  numberOfCards: number;
  cards: ICard[];
  bet: null | number;
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

export interface IGameOptions {
  halfGame: boolean;
}

export enum GameState {
  PLAYERS_JOINING = "players_joining",
  BETTING = "betting",
  TRICK_ACTIVE = "trick_active",
  TRICK_COMPLETE = "trick_complete",
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
  options: IGameOptions;
  state: GameState;
  playerStates: IPlayerState[];
  currentTrick: ITrickPlayerCard[];
  roundScores: IRoundScore[];
  actionToUserId: number;
  createdAt: string;
  updatedAt: string;
}

export interface IPlayerJoinedEvent {
  playerStates: IPlayerState[];
}

export interface IBetPlaced {
  userId: number;
  bet: number;
}

export interface IBetEvent {
  betPlaced: IBetPlaced;
  updatedGameState: GameState;
  actionToUserId: number;
}

export interface ICardPlayed {
  userId: number;
  card: ICard;
}

export interface ITrickEvent {
  cardPlayed: ICardPlayed;
  trickTakenByUserId?:  number;
  roundScore?: IRoundScore;
  updatedGameState: GameState;
  actionToUserId: number;
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
