import { Model, DataTypes } from "sequelize";
import { sequelize } from "./connection";
import { ChallengePlayAs, IChallenge } from "../../shared/dtos/challenge";

const PLAY_AS_ENUM = DataTypes.ENUM(
  ChallengePlayAs.ALABASTER,
  ChallengePlayAs.ONYX,
  ChallengePlayAs.RANDOM
);

export class CyvasseChallenge extends Model {
  public challengeId!: number;
  public variantId!: number;
  public creatorPlayAs!: ChallengePlayAs;
  public creatorUserId!: number;
  public opponentUserId!: number;

  serialize(): IChallenge {
    return {
      challengeId: this.challengeId,
      variantId: this.variantId,
      creatorPlayAs: this.creatorPlayAs,
      creatorUserId: this.creatorUserId,
      opponentUserId: this.opponentUserId,
    };
  }
}
CyvasseChallenge.init(
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
