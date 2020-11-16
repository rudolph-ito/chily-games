import { Model, DataTypes } from "sequelize";
import { sequelize } from "./connection";
import { ICard } from "../../shared/dtos/yaniv/card";
import { deserializeCard } from "../../services/yaniv/card_helpers";
import { doesHaveValue } from "../../shared/utilities/value_checker";

export interface ISerializedYanivGamePlayer {
  gameId: number;
  userId: number;
  position: number;
  cardsInHand?: ICard[];
}

export class YanivGamePlayer extends Model {
  public gameId!: number;
  public userId!: number;
  public position!: number;
  public cardsInHand!: number[];

  serialize(): ISerializedYanivGamePlayer {
    const out: ISerializedYanivGamePlayer = {
      gameId: this.gameId,
      userId: this.userId,
      position: this.position,
    };
    if (doesHaveValue(this.cardsInHand)) {
      out.cardsInHand = this.cardsInHand.map(deserializeCard);
    }
    return out;
  }
}
YanivGamePlayer.init(
  {
    position: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cardsInHand: {
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
