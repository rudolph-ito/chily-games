import { IPaginationRequest } from "../search";
import { ICard } from "../card";

export interface IMeld {
  id: number;
  cards: ICard[];
}

export interface IPlayerState {
  userId: number;
  displayName: string;
  numberOfCards: number;
  cardsInHand: ICard[];
  melds: IMeld[];
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
  DISCARD = "discard",
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

export interface IMeldInput {
  id?: number;
  cards: ICard[];
}

export interface IPickupInput {
  pickup?: ICard;
  meld?: IMeldInput;
}

export interface IPlayerPickup {
  userId: number;
  pickup?: ICard;
  meld?: IMeld;
}

export interface IPickupEvent {
  pickup: IPlayerPickup;
  updatedGameState: GameState;
  actionToUserId: number;
}

export interface IDiscard {
  A?: ICard;
  B?: ICard;
}

export interface IDiscardInput {
  melds: IMeldInput[];
  discard: IDiscard;
}

export interface IPlayerDiscard {
  userId: number;
  melds: IMeld[];
  discard: IDiscard;
}

export interface IDiscardEvent {
  discard: IPlayerDiscard;
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
