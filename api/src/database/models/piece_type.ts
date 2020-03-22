import { Model, DataTypes } from "sequelize";
import { sequelize } from "./connection";

export class PieceType extends Model {
  public name!: string;
  public alabasterImageUrl!: string;
  public onyxImageUrl!: string;
}
PieceType.init(
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true
    },
    alabasterImageUrl: {
      type: DataTypes.STRING,
      allowNull: false
    },
    onyxImageUrl: {
      type: DataTypes.STRING,
      allowNull: false
    }
  },
  { sequelize }
);
