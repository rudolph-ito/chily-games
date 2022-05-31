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

export interface IRoundScore {
  [userId: number]: number;
}

export interface IGameOptions {
  pointThreshold: number;
  numberOfDiscardPiles: number;
}

export enum GameState {
  PLAYERS_JOINING = "players_joining",
  PICKUP = "pickup",
  MELD_OR_DISCARD = "meld_or_discard",
  ROUND_COMPLETE = "round_complete",
  COMPLETE = "complete",
  ABORTED = "aborted",
}

export interface IDiscardState {
  piles: ICard[][];
  mustDiscardToPileIndex?: number;
}

export interface IGame {
  gameId: number;
  hostUserId: number;
  options: IGameOptions;
  state: GameState;
  playerStates: IPlayerState[];
  cardsInDeck: ICard[];
  discardState: IDiscardState;
  melds: IMeld[];
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
  input: IPickupInput;
  updatedGameState: GameState;
  actionToUserId: number;
}

export interface IPickupOutput {
  event: IPickupEvent;
  cardPickedUpFromDeck?: ICard;
}

export interface IMeldInput {
  id?: number;
  cards: ICard[];
}

export interface IMeldEvent {
  userId: number;
  input: IMeldInput;
  updatedGameState: GameState;
  roundScore?: IRoundScore;
}

export interface IDiscardInput {
  card: ICard;
  pileIndex: number;
}

export interface IDiscardEvent {
  userId: number;
  input: IDiscardInput;
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
