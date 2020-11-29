import { Model, DataTypes } from "sequelize";
import { sequelize } from "./connection";
import {
  CaptureType,
  IPieceRule,
  PathType,
  PieceType,
} from "../../shared/dtos/cyvasse/piece_rule";

const PATH_ENUM = DataTypes.ENUM(
  PathType.ORTHOGONAL_LINE,
  PathType.DIAGONAL_LINE,
  PathType.ORTHOGONAL_OR_DIAGONAL_LINE,
  PathType.ORTHOGONAL_WITH_TURNS,
  PathType.DIAGONAL_WITH_TURNS
);

export class CyvassePieceRule extends Model {
  public pieceRuleId!: number;
  public variantId!: number;
  public pieceTypeId!: PieceType;
  public count!: number;
  public movementType!: PathType;
  public movementMinimum!: number;
  public movementMaximum!: number;
  public captureType!: CaptureType;
  public rangeType!: PathType;
  public rangeMinimum!: number;
  public rangeMaximum!: number;
  public moveAndRangeCapture!: boolean;
  public attackRank!: number;
  public defenseRank!: number;

  serialize(): IPieceRule {
    return {
      pieceRuleId: this.pieceRuleId,
      variantId: this.variantId,
      pieceTypeId: this.pieceTypeId,
      count: this.count,
      movement: {
        type: this.movementType,
        minimum: this.movementMinimum,
        maximum: this.movementMaximum,
      },
      captureType: this.captureType,
      range: {
        type: this.rangeType,
        minimum: this.rangeMinimum,
        maximum: this.rangeMaximum,
      },
      moveAndRangeCapture: this.moveAndRangeCapture,
      ranks: {
        attack: this.attackRank,
        defense: this.defenseRank,
      },
    };
  }
}
CyvassePieceRule.init(
  {
    pieceRuleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    pieceTypeId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    count: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    movementType: {
      type: PATH_ENUM,
      allowNull: false,
    },
    movementMinimum: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    movementMaximum: {
      type: DataTypes.INTEGER,
    },
    captureType: {
      type: DataTypes.ENUM(CaptureType.MOVEMENT, CaptureType.RANGE),
      allowNull: false,
    },
    rangeMinimum: {
      type: DataTypes.INTEGER,
    },
    rangeMaximum: {
      type: DataTypes.INTEGER,
    },
    rangeType: {
      type: PATH_ENUM,
    },
    moveAndRangeCapture: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    attackRank: {
      type: DataTypes.INTEGER,
    },
    defenseRank: {
      type: DataTypes.INTEGER,
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
  {
    indexes: [
      {
        unique: true,
        fields: ["variantId", "pieceTypeId"],
      },
    ],
    sequelize,
  }
);
