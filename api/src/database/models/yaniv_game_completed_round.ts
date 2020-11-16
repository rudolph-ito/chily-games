import { Model, DataTypes } from "sequelize";
import { sequelize } from "./connection";
import { RoundScoreType } from "../../shared/dtos/yaniv/game";

export interface ISerializedYanivGameCompletedRound {
  gameId: number;
  userId: number;
  roundNumber: number;
  score: number;
  scoreType: RoundScoreType;
}

const SCORE_TYPE_ENUM = DataTypes.ENUM(
  RoundScoreType.DEFAULT,
  RoundScoreType.YANIV,
  RoundScoreType.ASAF
);

export class YanivGameCompletedRound extends Model {
  public gameId!: number;
  public userId!: number;
  public roundNumber!: number;
  public score!: number;
  public scoreType!: RoundScoreType;

  serialize(): ISerializedYanivGameCompletedRound {
    return {
      gameId: this.gameId,
      userId: this.userId,
      roundNumber: this.roundNumber,
      score: this.score,
      scoreType: this.scoreType,
    };
  }
}
YanivGameCompletedRound.init(
  {
    roundNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    scoreType: {
      type: SCORE_TYPE_ENUM,
      allowNull: false,
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
