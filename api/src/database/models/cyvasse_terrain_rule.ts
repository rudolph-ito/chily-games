import {
  ITerrainRule,
  TerrainType,
  PiecesEffectedType,
} from "../../shared/dtos/cyvasse/terrain_rule";
import { Model, DataTypes } from "sequelize";
import { PieceType } from "../../shared/dtos/cyvasse/piece_rule";
import { sequelize } from "./connection";

const PIECES_EFFECTED_TYPE_ENUM = DataTypes.ENUM(
  PiecesEffectedType.ALL,
  PiecesEffectedType.ALL_EXCEPT,
  PiecesEffectedType.NONE,
  PiecesEffectedType.ONLY
);

const PIECE_TYPE_ENUM = DataTypes.ENUM(
  PieceType.CATAPULT,
  PieceType.CROSSBOW,
  PieceType.DRAGON,
  PieceType.ELEPHANT,
  PieceType.HEAVY_HORSE,
  PieceType.LIGHT_HORSE,
  PieceType.KING,
  PieceType.RABBLE,
  PieceType.SPEAR,
  PieceType.TREBUCHET
);

export class CyvasseTerrainRule extends Model {
  public terrainRuleId!: number;
  public variantId!: number;
  public terrainTypeId!: TerrainType;
  public count!: number;
  public passableMovementFor!: PiecesEffectedType;
  public passableMovementPieceTypeIds!: PieceType[];
  public passableRangeFor!: PiecesEffectedType;
  public passableRangePieceTypeIds!: PieceType[];
  public slowsMovementBy!: number | null;
  public slowsMovementFor!: PiecesEffectedType;
  public slowsMovementPieceTypeIds!: PieceType[];
  public stopsMovementFor!: PiecesEffectedType;
  public stopsMovementPieceTypeIds!: PieceType[];

  serialize(): ITerrainRule {
    return {
      terrainRuleId: this.terrainRuleId,
      variantId: this.variantId,
      terrainTypeId: this.terrainTypeId,
      count: this.count,
      passableMovement: {
        for: this.passableMovementFor,
        pieceTypeIds: this.passableMovementPieceTypeIds,
      },
      passableRange: {
        for: this.passableRangeFor,
        pieceTypeIds: this.passableRangePieceTypeIds,
      },
      slowsMovement: {
        by: this.slowsMovementBy,
        for: this.slowsMovementFor,
        pieceTypeIds: this.slowsMovementPieceTypeIds,
      },
      stopsMovement: {
        for: this.stopsMovementFor,
        pieceTypeIds: this.stopsMovementPieceTypeIds,
      },
    };
  }
}
CyvasseTerrainRule.init(
  {
    terrainRuleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    terrainTypeId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    count: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    passableMovementFor: {
      type: PIECES_EFFECTED_TYPE_ENUM,
      allowNull: false,
    },
    passableMovementPieceTypeIds: {
      type: DataTypes.ARRAY(PIECE_TYPE_ENUM),
      allowNull: false,
    },
    passableRangeFor: {
      type: PIECES_EFFECTED_TYPE_ENUM,
      allowNull: false,
    },
    passableRangePieceTypeIds: {
      type: DataTypes.ARRAY(PIECE_TYPE_ENUM),
      allowNull: false,
    },
    slowsMovementBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    slowsMovementFor: {
      type: PIECES_EFFECTED_TYPE_ENUM,
      allowNull: false,
    },
    slowsMovementPieceTypeIds: {
      type: DataTypes.ARRAY(PIECE_TYPE_ENUM),
      allowNull: false,
    },
    stopsMovementFor: {
      type: PIECES_EFFECTED_TYPE_ENUM,
      allowNull: false,
    },
    stopsMovementPieceTypeIds: {
      type: DataTypes.ARRAY(PIECE_TYPE_ENUM),
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
  {
    indexes: [
      {
        unique: true,
        fields: ["variantId", "terrainTypeId"],
      },
    ],
    sequelize,
  }
);
