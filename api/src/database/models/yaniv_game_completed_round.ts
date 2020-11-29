import { Model, DataTypes } from "sequelize";
import { sequelize } from "./connection";
import { RoundScoreType } from "../../shared/dtos/yaniv/game";
import { YanivGame } from "./yaniv_game";
import { User } from "./user";

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
    roundNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
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
