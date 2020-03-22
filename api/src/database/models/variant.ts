import { Model, DataTypes } from "sequelize";
import { sequelize } from "./connection";

export enum BOARD_TYPE {
  SQUARE = "square",
  HEXAGONAL = "hexagonal"
}

export enum SUPPORT_TYPE {
  NONE = "none",
  BINARY = "binary",
  SUM = "sum"
}

export class Variant extends Model {
  public variantId!: number;
  public boardType!: BOARD_TYPE;
  public boardRows!: number;
  public boardColumns!: number;
  public boardSize!: number;
  public pieceRanks!: boolean;
  public supportType!: SUPPORT_TYPE;

  requiredForBoards(
    boardType: BOARD_TYPE,
    fieldName: string,
    value: number
  ): void {
    if (value == null && this.boardType === boardType) {
      throw new Error(`${fieldName} is required`);
    }
  }
}
Variant.init(
  {
    variantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    boardType: {
      type: DataTypes.ENUM(BOARD_TYPE.SQUARE, BOARD_TYPE.HEXAGONAL),
      allowNull: false
    },
    boardRows: {
      type: DataTypes.INTEGER,
      validate: {
        custom(this: Variant, v: number) {
          this.requiredForBoards(BOARD_TYPE.SQUARE, "board_rows", v);
        }
      }
    },
    boardColumns: {
      type: DataTypes.INTEGER,
      validate: {
        custom(this: Variant, v: number) {
          this.requiredForBoards(BOARD_TYPE.SQUARE, "board_columns", v);
        }
      }
    },
    boardSize: {
      type: DataTypes.INTEGER,
      validate: {
        custom(this: Variant, v: number) {
          this.requiredForBoards(BOARD_TYPE.HEXAGONAL, "board_size", v);
        }
      }
    },
    pieceRanks: { type: DataTypes.BOOLEAN, allowNull: false },
    supportType: {
      type: DataTypes.ENUM(
        SUPPORT_TYPE.NONE,
        SUPPORT_TYPE.BINARY,
        SUPPORT_TYPE.SUM
      ),
      allowNull: false
    }
  },
  { sequelize }
);
