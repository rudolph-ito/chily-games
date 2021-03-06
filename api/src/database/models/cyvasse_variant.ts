import { Model, DataTypes } from "sequelize";
import { sequelize } from "./connection";
import {
  IVariant,
  BoardType,
  SupportType,
} from "../../shared/dtos/cyvasse/variant";
import { doesNotHaveValue } from "../../shared/utilities/value_checker";

export class CyvasseVariant extends Model {
  public variantId!: number;
  public boardType!: BoardType;
  public boardRows!: number | null;
  public boardColumns!: number | null;
  public boardSize!: number | null;
  public pieceRanks!: boolean;
  public supportType!: SupportType | null;
  public userId!: number;

  requiredForBoards(
    boardType: BoardType,
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
      userId: this.userId,
    };
  }
}
CyvasseVariant.init(
  {
    variantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    boardType: {
      type: DataTypes.ENUM(BoardType.SQUARE, BoardType.HEXAGONAL),
      allowNull: false,
    },
    boardRows: {
      type: DataTypes.INTEGER,
      validate: {
        custom(this: CyvasseVariant, value: number) {
          this.requiredForBoards(BoardType.SQUARE, "board_rows", value);
        },
      },
    },
    boardColumns: {
      type: DataTypes.INTEGER,
      validate: {
        custom(this: CyvasseVariant, value: number) {
          this.requiredForBoards(BoardType.SQUARE, "board_columns", value);
        },
      },
    },
    boardSize: {
      type: DataTypes.INTEGER,
      validate: {
        custom(this: CyvasseVariant, value: number) {
          this.requiredForBoards(BoardType.HEXAGONAL, "board_size", value);
        },
      },
    },
    pieceRanks: { type: DataTypes.BOOLEAN, allowNull: false },
    supportType: {
      type: DataTypes.ENUM(
        SupportType.NONE,
        SupportType.BINARY,
        SupportType.SUM
      ),
      validate: {
        custom(this: CyvasseVariant, value: SupportType) {
          if (doesNotHaveValue(value) && this.pieceRanks) {
            throw new Error(`supportType is required`);
          }
        },
      },
    },
  },
  { sequelize }
);
