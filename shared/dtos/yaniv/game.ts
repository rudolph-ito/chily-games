import { ICard } from "./card";

export interface IPlayerState {
  userId: number;
  numberOfCards?: number;
  cards?: ICard[];
}

export enum RoundScoreType {
  DEFAULT = "default",
  YANIV = "yaniv",
  ASAF = "asaf",
}

export interface IRoundScore {
  [userId: number]: IRoundPlayerScore;
}

export interface IRoundScoreWithCards {
  [userId: number]: IRoundPlayerScoreWithCards;
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
  actionToUserId?: number;
  cardsOnTopOfDiscardPile?: ICard[];
}

export interface IGameActionRequest {
  callYaniv?: boolean;
  cardsDiscarded?: ICard[];
  cardPickedUp?: ICard;
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
  roundScore: IRoundScoreWithCards;
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
