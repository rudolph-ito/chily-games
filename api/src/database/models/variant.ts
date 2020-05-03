import { Model, DataTypes } from "sequelize";
import { sequelize } from "./connection";
import { IVariant } from "../../shared/dtos/variant";
import { doesNotHaveValue } from "../../shared/utilities/value_checker";

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
  public userId!: number;

  requiredForBoards(
    boardType: BOARD_TYPE,
    fieldName: string,
    value: number
  ): void {
    if (doesNotHaveValue(value) && this.boardType === boardType) {
      throw new Error(`${fieldName} is required`);
    }
  }

  serialize(): IVariant {
    return {
      variantId: this.variantId,
      boardType: this.boardType,
      boardRows: this.boardRows,
      boardColumns: this.boardColumns,
      boardSize: this.boardSize,
      pieceRanks: this.pieceRanks,
      supportType: this.supportType,
      userId: this.userId
    };
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
        custom(this: Variant, value: number) {
          this.requiredForBoards(BOARD_TYPE.SQUARE, "board_rows", value);
        }
      }
    },
    boardColumns: {
      type: DataTypes.INTEGER,
      validate: {
        custom(this: Variant, value: number) {
          this.requiredForBoards(BOARD_TYPE.SQUARE, "board_columns", value);
        }
      }
    },
    boardSize: {
      type: DataTypes.INTEGER,
      validate: {
        custom(this: Variant, value: number) {
          this.requiredForBoards(BOARD_TYPE.HEXAGONAL, "board_size", value);
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
      validate: {
        custom(this: Variant, value: SUPPORT_TYPE) {
          if (doesNotHaveValue(value) && this.pieceRanks) {
            throw new Error(`supportType is required`);
          }
        }
      }
    }
  },
  { sequelize }
);
