import { IPaginationRequest } from "../search";
import { ICard } from "../card";

export interface IMeldElement {
  card: ICard;
  userId: number;
}

export interface IMeld {
  id: number;
  elements: IMeldElement[];
}

export interface IPlayerState {
  userId: number;
  displayName: string;
  numberOfCards: number;
  cardsInHand: ICard[];
}

export interface IRoundPlayerScore {
  score: number;
}

export interface IRoundScore {
  [userId: number]: IRoundPlayerScore;
}

export interface IGameOptions {
  game_point_threshold: boolean;
}

export enum GameState {
  PLAYERS_JOINING = "players_joining",
  PICKUP = "pickup",
  MELD_OR_DISCARD = "meld_or_discard",
  ROUND_COMPLETE = "round_complete",
  COMPLETE = "complete",
  ABORTED = "aborted",
}

export enum DiscardRestriction {
  NONE = "none",
  MUST_DISCARD_TO_A = "must_discard_to_a",
  MUST_DISCARD_TO_B = "must_discard_to_b",
}

export interface IDiscardPile {
  A: ICard[];
  B: ICard[];
  restriction: DiscardRestriction;
}

export interface IGame {
  gameId: number;
  hostUserId: number;
  options: IGameOptions;
  state: GameState;
  playerStates: IPlayerState[];
  cardsInDeck: ICard[];
  discardPile: IDiscardPile;
  roundScores: IRoundScore[];
  actionToUserId: number;
  createdAt: string;
  updatedAt: string;
}

export interface IPlayerJoinedEvent {
  playerStates: IPlayerState[];
}

export interface IPickupInput {
  pickup?: ICard;
  deepPickupMeld?: IMeldInput;
}

export interface IPickupEvent {
  userId: number;
  pickup: IPickupInput;
  updatedGameState: GameState;
  actionToUserId: number;
}

export interface IMeldInput {
  id?: number;
  cards: ICard[];
}

export interface IMeldEvent {
  userId: number;
  meld: IMeldInput;
  updatedGameState: GameState;
  actionToUserId: number;
  roundScore?: IRoundScore;
}

export interface IDiscardInput {
  A?: ICard;
  B?: ICard;
}

export interface IDiscardEvent {
  userId: number;
  discard: IDiscardInput;
  updatedGameState: GameState;
  actionToUserId: number;
  roundScore?: IRoundScore;
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
