import { Model, DataTypes } from "sequelize";
import { sequelize } from "./connection";
import { GameState, IGameOptions } from "../../shared/dtos/yaniv/game";
import { ICard } from "../../shared/dtos/yaniv/card";
import { deserializeCard } from "../../services/yaniv/card_helpers";
import { User } from "./user";

export interface ISerializedYanivGame {
  gameId: number;
  hostUserId: number;
  state: GameState;
  options: IGameOptions;
  actionToUserId: number;
  cardsInDeck: ICard[];
  cardsBuriedInDiscardPile: ICard[];
  cardsOnTopOfDiscardPile: ICard[];
  createdAt: Date;
  updatedAt: Date;
}

const STATE_ENUM = DataTypes.ENUM(
  GameState.PLAYERS_JOINING,
  GameState.ROUND_ACTIVE,
  GameState.ROUND_COMPLETE,
  GameState.COMPLETE
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
