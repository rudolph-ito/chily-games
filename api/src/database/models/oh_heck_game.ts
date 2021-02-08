import { Model, DataTypes } from "sequelize";
import { sequelize } from "./connection";
import { ICard } from "../../shared/dtos/card";
import { User } from "./user";
import {
  GameState,
  ITrickPlayerCard,
  IGameOptions,
} from "../../shared/dtos/oh_heck/game";

export interface IOhHeckPlayer {
  userId: number;
  cardsInHand: ICard[];
  bet: null | number;
  tricksTaken: number;
}

export interface IOhHeckRoundPlayerScore {
  userId: number;
  bet: number;
  betWasCorrect: boolean;
  score: number;
}

export interface ISerializedOhHeckGame {
  gameId: number;
  hostUserId: number;
  options: IGameOptions;
  state: GameState;
  actionToUserId: number;
  players: IOhHeckPlayer[];
  currentTrick: ITrickPlayerCard[];
  completedRounds: IOhHeckRoundPlayerScore[][];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const STATE_ENUM = DataTypes.ENUM(
  GameState.PLAYERS_JOINING,
  GameState.BETTING,
  GameState.TRICK_ACTIVE,
  GameState.TRICK_COMPLETE,
  GameState.ROUND_COMPLETE,
  GameState.COMPLETE,
  GameState.ABORTED
);

export class OhHeckGame extends Model {
  public gameId!: number;
  public hostUserId!: number;
  public options!: IGameOptions;
  public state!: GameState;
  public actionToUserId!: number;
  public players!: IOhHeckPlayer[];
  public currentTrick!: ITrickPlayerCard[];
  public completedRounds!: IOhHeckRoundPlayerScore[][];
  public version!: number;
  public createdAt!: Date;
  public updatedAt!: Date;

  serialize(): ISerializedOhHeckGame {
    return {
      gameId: this.gameId,
      hostUserId: this.hostUserId,
      options: this.options,
      state: this.state,
      actionToUserId: this.actionToUserId,
      players: this.players,
      currentTrick: this.currentTrick,
      completedRounds: this.completedRounds,
      version: this.version,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
OhHeckGame.init(
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
    currentTrick: {
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
