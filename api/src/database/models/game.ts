import { Model, DataTypes } from "sequelize";
import { sequelize } from "./connection";
import {
  Action,
  ICoordinateMapData,
  IGamePly,
  PlayerColor,
} from "../../shared/dtos/game";

const ACTION_ENUM = DataTypes.ENUM(
  Action.SETUP,
  Action.PLAY,
  Action.COMPLETE,
  Action.ABORTED,
  Action.RESIGNED
);

const ACTION_TO_ENUM = DataTypes.ENUM(PlayerColor.ALABASTER, PlayerColor.ONYX);

export interface ISerializedGame {
  gameId: number;
  variantId: number;
  action: Action;
  actionTo: PlayerColor;
  alabasterUserId: number;
  onyxUserId: number;
  alabasterSetupCoordinateMap: ICoordinateMapData[];
  onyxSetupCoordinateMap: ICoordinateMapData[];
  currentCoordinateMap: ICoordinateMapData[];
  plies: IGamePly[];
}

export class Game extends Model {
  public gameId!: number;
  public variantId!: number;
  public action!: Action;
  public actionTo!: PlayerColor;
  public alabasterUserId!: number;
  public onyxUserId!: number;
  public alabasterSetupCoordinateMap!: ICoordinateMapData[];
  public onyxSetupCoordinateMap!: ICoordinateMapData[];
  public currentCoordinateMap!: ICoordinateMapData[];
  public plies!: IGamePly[];

  serialize(): ISerializedGame {
    return {
      gameId: this.gameId,
      variantId: this.variantId,
      action: this.action,
      actionTo: this.actionTo,
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
    actionTo: {
      type: ACTION_TO_ENUM,
      allowNull: true,
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
