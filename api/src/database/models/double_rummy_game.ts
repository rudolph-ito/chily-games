import { Model, DataTypes } from "sequelize";
import { sequelize } from "./connection";
import { ICard } from "../../shared/dtos/card";
import { User } from "./user";
import {
  GameState,
  IDiscardPile,
  IGameOptions,
  IMeld,
} from "../../shared/dtos/double_rummy/game";

export interface IDoubleRummyPlayer {
  userId: number;
  cardsInHand: ICard[];
  melds: IMeld[];
}

export interface IDoubleRummyPlayerScore {
  userId: number;
  score: number;
}

export interface ISerializedDoubleRummyGame {
  gameId: number;
  hostUserId: number;
  options: IGameOptions;
  state: GameState;
  actionToUserId: number;
  players: IDoubleRummyPlayer[];
  cardsInDeck: ICard[];
  discardPile: IDiscardPile;
  completedRounds: IDoubleRummyPlayerScore[][];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const STATE_ENUM = DataTypes.ENUM(
  GameState.PLAYERS_JOINING,
  GameState.PICKUP,
  GameState.DISCARD,
  GameState.ROUND_COMPLETE,
  GameState.COMPLETE,
  GameState.ABORTED
);

export class DoubleRummyGame extends Model {
  public gameId!: number;
  public hostUserId!: number;
  public options!: IGameOptions;
  public state!: GameState;
  public actionToUserId!: number;
  public players!: IDoubleRummyPlayer[];
  public cardsInDeck!: ICard[];
  public discardPile!: IDiscardPile;
  public completedRounds!: IDoubleRummyPlayerScore[][];
  public version!: number;
  public createdAt!: Date;
  public updatedAt!: Date;

  serialize(): ISerializedDoubleRummyGame {
    return {
      gameId: this.gameId,
      hostUserId: this.hostUserId,
      options: this.options,
      state: this.state,
      actionToUserId: this.actionToUserId,
      players: this.players,
      cardsInDeck: this.cardsInDeck,
      discardPile: this.discardPile,
      completedRounds: this.completedRounds,
      version: this.version,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
DoubleRummyGame.init(
  {
    gameId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    hostUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "userId",
      },
    },
    options: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    state: {
      type: STATE_ENUM,
      allowNull: false,
    },
    actionToUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "userId",
      },
    },
    players: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    cardsInDeck: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    discardPile: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    completedRounds: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  { sequelize }
);

// gameId
// hostUserId

// actionToUserId
