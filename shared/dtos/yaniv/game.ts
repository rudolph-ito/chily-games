import { ICard } from "./card";

export interface IPlayerState {
  userId: number;
  numberOfCards: number;
}

export enum RoundScoreType {
  default = "default",
  yaniv = "yaniv",
  asaf = "asaf",
}

export interface IRoundPlayerScore {
  userId: number;
  score: number;
  scoreType: RoundScoreType;
}

export interface IRoundPlayerScoreWithCards extends IRoundPlayerScore {
  cards: ICard[];
}

export interface IRoundHistory {
  playerScores: IRoundPlayerScore[];
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

export interface IGameState {
  options: IGameOptions;
  roundStarted: boolean;
  actionTo: number;
  playerStates: IPlayerState[];
  roundHistory: IRoundHistory[];
  cardsOnTopOfDiscardPile: ICard[];
}

export interface IGamePlayRequest {
  callYaniv: boolean;
  cardsDiscarded: ICard[];
  cardPickedUp: ICard;
}

export interface IPlayerJoinedEvent {
  playerStates: IPlayerState[];
}

export interface IRoundStartedEvent {
  actionTo: number;
  playerStates: IPlayerState[];
}

export interface IActionToNextPlayerEvent {
  actionTo: number;
  playerStates: IPlayerState[];
  cardsDiscarded: ICard[];
  cardPickedUp: ICard; // null implies pickup from discard file
}

export interface IRoundFinishedEvent {
  players: IRoundPlayerScoreWithCards[];
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
