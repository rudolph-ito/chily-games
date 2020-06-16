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
  public alabasterSetupCoordinateMap!: ICoordinateMapData[];
  public onyxSetupCoordinateMap!: ICoordinateMapData[];
  public currentCoordinateMap!: ICoordinateMapData[];
  public plies!: IGamePly[];

  serialize(): IGame {
    return {
      gameId: this.gameId,
      variantId: this.variantId,
      action: this.action,
      actionToUserId: this.actionToUserId,
      alabasterUserId: this.alabasterUserId,
      onyxUserId: this.onyxUserId,
      alabasterSetupCoordinateMap: this.alabasterSetupCoordinateMap,
      onyxSetupCoordinateMap: this.onyxSetupCoordinateMap,
      currentCoordinateMap: this.currentCoordinateMap,
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
    alabasterSetupCoordinateMap: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    onyxSetupCoordinateMap: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    currentCoordinateMap: {
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
