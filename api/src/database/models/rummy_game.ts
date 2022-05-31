import { Model, DataTypes } from "sequelize";
import { sequelize } from "./connection";
import { ICard } from "../../shared/dtos/card";
import { User } from "./user";
import {
  GameState,
  IDiscardState,
  IGameOptions,
  IMeld,
} from "../../shared/dtos/rummy/game";

export interface IRummyPlayer {
  userId: number;
  cardsInHand: ICard[];
  melds: IMeld[];
}

export interface IRummyPlayerScore {
  userId: number;
  score: number;
}

export interface ISerializedRummyGame {
  gameId: number;
  hostUserId: number;
  options: IGameOptions;
  state: GameState;
  actionToUserId: number;
  players: IRummyPlayer[];
  cardsInDeck: ICard[];
  melds: IMeld[];
  discardState: IDiscardState;
  completedRounds: IRummyPlayerScore[][];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const STATE_ENUM = DataTypes.ENUM(
  GameState.PLAYERS_JOINING,
  GameState.PICKUP,
  GameState.MELD_OR_DISCARD,
  GameState.ROUND_COMPLETE,
  GameState.COMPLETE,
  GameState.ABORTED
);

export class RummyGame extends Model {
  public gameId!: number;
  public hostUserId!: number;
  public options!: IGameOptions;
  public state!: GameState;
  public actionToUserId!: number;
  public players!: IRummyPlayer[];
  public cardsInDeck!: ICard[];
  public discardState!: IDiscardState;
  public melds!: IMeld[];
  public completedRounds!: IRummyPlayerScore[][];
  public version!: number;
  public createdAt!: Date;
  public updatedAt!: Date;

  serialize(): ISerializedRummyGame {
    return {
      gameId: this.gameId,
      hostUserId: this.hostUserId,
      options: this.options,
      state: this.state,
      actionToUserId: this.actionToUserId,
      players: this.players,
      cardsInDeck: this.cardsInDeck,
      discardState: this.discardState,
      melds: this.melds,
      completedRounds: this.completedRounds,
      version: this.version,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
RummyGame.init(
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
    discardState: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    melds: {
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
