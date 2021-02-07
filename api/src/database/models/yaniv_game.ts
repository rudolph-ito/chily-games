import { Model, DataTypes } from "sequelize";
import { sequelize } from "./connection";
import {
  GameState,
  IGameOptions,
  RoundScoreType,
} from "../../shared/dtos/yaniv/game";
import { ICard } from "../../shared/dtos/card";
import { deserializeCard } from "../../services/shared/card_helpers";
import { User } from "./user";

export interface IYanivPlayer {
  userId: number;
  cardsInHand: ICard[];
}

export interface IYanivRoundPlayerScore {
  userId: number;
  score: number;
  scoreType: RoundScoreType;
}

export interface ISerializedYanivGame {
  gameId: number;
  hostUserId: number;
  state: GameState;
  options: IGameOptions;
  actionToUserId: number;
  cardsInDeck: ICard[];
  cardsBuriedInDiscardPile: ICard[];
  cardsOnTopOfDiscardPile: ICard[];
  players: IYanivPlayer[];
  completedRounds: IYanivRoundPlayerScore[][];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const STATE_ENUM = DataTypes.ENUM(
  GameState.PLAYERS_JOINING,
  GameState.ROUND_ACTIVE,
  GameState.ROUND_COMPLETE,
  GameState.COMPLETE,
  GameState.ABORTED
);

export class YanivGame extends Model {
  public gameId!: number;
  public hostUserId!: number;
  public state!: GameState;
  public options!: IGameOptions;
  public actionToUserId!: number;
  public cardsInDeck!: number[];
  public cardsBuriedInDiscardPile!: number[];
  public cardsOnTopOfDiscardPile!: number[];
  public players!: IYanivPlayer[];
  public completedRounds!: IYanivRoundPlayerScore[][];
  public version!: number;
  public createdAt!: Date;
  public updatedAt!: Date;

  serialize(): ISerializedYanivGame {
    return {
      gameId: this.gameId,
      hostUserId: this.hostUserId,
      state: this.state,
      options: this.options,
      actionToUserId: this.actionToUserId,
      cardsInDeck: this.cardsInDeck.map(deserializeCard),
      cardsBuriedInDiscardPile: this.cardsBuriedInDiscardPile.map(
        deserializeCard
      ),
      cardsOnTopOfDiscardPile: this.cardsOnTopOfDiscardPile.map(
        deserializeCard
      ),
      players: this.players,
      completedRounds: this.completedRounds,
      version: this.version,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
YanivGame.init(
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
    state: {
      type: STATE_ENUM,
      allowNull: false,
    },
    options: {
      type: DataTypes.JSONB,
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
    cardsInDeck: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: false,
    },
    cardsBuriedInDiscardPile: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: false,
    },
    cardsOnTopOfDiscardPile: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: false,
    },
    players: {
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
