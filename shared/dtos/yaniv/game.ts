import { IPaginationRequest } from "../search";
import { ICard } from "./card";

export interface IPlayerState {
  userId: number;
  username: string;
  numberOfCards: number;
  cards: ICard[];
}

export enum RoundScoreType {
  DEFAULT = "default",
  YANIV = "yaniv",
  ASAF = "asaf",

  // Frontend only
  TOTAL = "total",
}

export interface IRoundScore {
  [userId: number]: IRoundPlayerScore;
}

export interface IRoundPlayerScore {
  score: number;
  scoreType: RoundScoreType;
}

export interface IRoundPlayerScoreWithCards extends IRoundPlayerScore {
  cards: ICard[];
}

export interface IGameOptions {
  playTo: number;
}

export enum GameState {
  PLAYERS_JOINING = "players_joining",
  ROUND_ACTIVE = "round_active",
  ROUND_COMPLETE = "round_complete",
  COMPLETE = "complete",
}

export interface IGame {
  gameId: number;
  hostUserId: number;
  options: IGameOptions;
  state: GameState;
  playerStates: IPlayerState[];
  roundScores: IRoundScore[];

  // Fields populated with state == ROUND_ACTIVE
  actionToUserId: number;
  cardsOnTopOfDiscardPile: ICard[];
}

export interface IGameActionRequest {
  callYaniv?: boolean;
  cardsDiscarded?: ICard[];
  cardPickedUp?: ICard;
}

export interface IGameActionResponse {
  cardPickedUpFromDeck?: ICard;
  actionToNextPlayerEvent?: IActionToNextPlayerEvent;
  roundFinishedEvent?: IRoundFinishedEvent;
}

export interface IPlayerJoinedEvent {
  playerStates: IPlayerState[];
}

export interface ILastAction {
  userId: number;
  cardsDiscarded: ICard[];
  cardPickedUp?: ICard;
}

export interface IActionToNextPlayerEvent {
  lastAction: ILastAction;
  actionToUserId: number;
}

export interface IRoundFinishedEvent {
  playerStates: IPlayerState[];
  roundScore: IRoundScore;
  updatedGameState: GameState;
}

export interface ISearchedGame {
  gameId: number;
  hostUserId: number;
  state: GameState;
}

export interface ISearchGamesRequest {
  pagination: IPaginationRequest;
}

// endpoints
//   create game with options
//   games/<game_id>/start-round
//   games/<game_id>/play (request)
// events
//   player joined
//   round started
//   action to next player
//   round completed
// storage
//   game
//     game id, host id, options, state, actionTo, cardsInDeck, cardsBuriedInDiscardPile, cardsOnTopOfDiscardPile
//   gamePlayer
//     game id, player id, position, cardsInHand
//   gameCompletedRound
//     game id, player id, round number, score, score type
