import { Model, DataTypes } from "sequelize";
import { sequelize } from "./connection";
import { GameState, IGameOptions } from "../../shared/dtos/yaniv/game";
import { ICard } from "../../shared/dtos/yaniv/card";
import { deserializeCard } from "../../services/yaniv/card_helpers";
import { ISerializedYanivGameCompletedRound } from "./yaniv_game_completed_round";

export interface ISerializedYanivGame {
  gameId: number;
  hostUserId: number;
  state: GameState;
  options: IGameOptions;
  actionToUserId?: number;
  cardsInDeck?: ICard[];
  cardsBuriedInDiscardPile?: ICard[];
  cardsOnTopOfDiscardPile?: ICard[];
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

  serialize(): ISerializedYanivGame {
    const out: ISerializedYanivGame = {
      gameId: this.gameId,
      hostUserId: this.hostUserId,
      state: this.state,
      options: this.options,
    };
    if (this.state === GameState.ROUND_ACTIVE) {
      out.actionToUserId = this.actionToUserId;
      out.cardsInDeck = this.cardsInDeck.map(deserializeCard);
      out.cardsBuriedInDiscardPile = this.cardsBuriedInDiscardPile.map(
        deserializeCard
      );
      out.cardsOnTopOfDiscardPile = this.cardsOnTopOfDiscardPile.map(
        deserializeCard
      );
    }
    return out;
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
    state: {
      type: STATE_ENUM,
      allowNull: false,
    },
    options: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    cardsInDeck: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: true,
    },
    cardsBuriedInDiscardPile: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: true,
    },
    cardsOnTopOfDiscardPile: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: true,
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE,
    },
  },
  { sequelize }
);
