import { Model, DataTypes } from "sequelize";
import { sequelize } from "./connection";
import { ICard } from "../../shared/dtos/yaniv/card";
import { deserializeCard } from "../../services/yaniv/card_helpers";
import { YanivGame } from "./yaniv_game";
import { User } from "./user";

export interface ISerializedYanivGamePlayer {
  gameId: number;
  userId: number;
  position: number;
  cardsInHand: ICard[];
}

export class YanivGamePlayer extends Model {
  public gameId!: number;
  public userId!: number;
  public position!: number;
  public cardsInHand!: number[];

  serialize(): ISerializedYanivGamePlayer {
    return {
      gameId: this.gameId,
      userId: this.userId,
      position: this.position,
      cardsInHand: this.cardsInHand.map(deserializeCard),
    };
  }
}
YanivGamePlayer.init(
  {
    gameId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: YanivGame,
        key: "gameId",
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: User,
        key: "userId",
      },
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cardsInHand: {
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
