import { Model, DataTypes } from "sequelize";
import { sequelize } from "./connection";
import {
  Action,
  ICoordinateMapData,
  IGame,
  IGamePly,
} from "../../shared/dtos/game";

const ACTION_ENUM = DataTypes.ENUM(Action.SETUP, Action.PLAY, Action.COMPLETE);

export class Game extends Model {
  public gameId!: number;
  public variantId!: number;
  public action!: Action;
  public actionToUserId!: number;
  public alabasterUserId!: number;
  public onyxUserId!: number;
  public initialSetup!: ICoordinateMapData[];
  public currentSetup!: ICoordinateMapData[];
  public plies!: IGamePly[];

  serialize(): IGame {
    return {
      variantId: this.variantId,
      action: this.action,
      actionToUserId: this.actionToUserId,
      alabasterUserId: this.alabasterUserId,
      onyxUserId: this.onyxUserId,
      initialSetup: this.initialSetup,
      currentSetup: this.currentSetup,
      plies: this.plies,
    };
  }
}
Game.init(
  {
    gameId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    action: {
      type: ACTION_ENUM,
      allowNull: false,
    },
    initialSetup: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    currentSetup: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    plies: {
      type: DataTypes.JSONB,
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
