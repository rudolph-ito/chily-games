import { Model, DataTypes } from "sequelize";
import { sequelize } from "./connection";
import { ChallengePlayAs } from "../../shared/dtos/challenge";

const PLAY_AS_ENUM = DataTypes.ENUM(
  ChallengePlayAs.ALABASTER,
  ChallengePlayAs.ONYX,
  ChallengePlayAs.RANDOM
);

export interface ISerializedChallenge {
  challengeId: number;
  variantId: number;
  creatorPlayAs: ChallengePlayAs;
  creatorUserId: number;
  opponentUserId: number;
}

export class Challenge extends Model {
  public challengeId!: number;
  public variantId!: number;
  public creatorPlayAs!: ChallengePlayAs;
  public creatorUserId!: number;
  public opponentUserId!: number;

  serialize(): ISerializedChallenge {
    return {
      challengeId: this.challengeId,
      variantId: this.variantId,
      creatorPlayAs: this.creatorPlayAs,
      creatorUserId: this.creatorUserId,
      opponentUserId: this.opponentUserId,
    };
  }
}
Challenge.init(
  {
    challengeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    creatorPlayAs: {
      type: PLAY_AS_ENUM,
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
