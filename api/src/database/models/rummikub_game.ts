import { Model, DataTypes } from "sequelize";
import { sequelize } from "./connection";
import {
  GameState,
  IGameOptions,
  INullableTile,
  IUpdateSets,
} from "../../shared/dtos/rummikub/game";
import { ITile } from "../../shared/dtos/rummikub/tile";
import { User } from "./user";

export interface IRummikubPlayer {
  userId: number;
  tiles: INullableTile[];
  hasPlayedInitialMeld: boolean;
  passedLastTurn: boolean;
}

export interface IRummikubRoundPlayerScore {
  userId: number;
  score: number;
}

export interface ISerializedRummikubGame {
  gameId: number;
  hostUserId: number;
  state: GameState;
  options: IGameOptions;
  actionToUserId: number;
  sets: INullableTile[];
  tilePool: ITile[];
  players: IRummikubPlayer[];
  latestUpdateSets: IUpdateSets | null;
  lastValidUpdateSets: IUpdateSets | null;
  completedRounds: IRummikubRoundPlayerScore[][];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const STATE_ENUM = DataTypes.ENUM(
  GameState.PLAYERS_JOINING,
  GameState.ROUND_ACTIVE,
  GameState.ROUND_COMPLETE,
  GameState.COMPLETE,
  GameState.ABORTED
);

export class RummikubGame extends Model {
  public gameId!: number;
  public hostUserId!: number;
  public state!: GameState;
  public options!: IGameOptions;
  public actionToUserId!: number;
  public sets!: INullableTile[];
  public tilePool!: ITile[];
  public players!: IRummikubPlayer[];
  public latestUpdateSets!: IUpdateSets;
  public lastValidUpdateSets!: IUpdateSets;
  public completedRounds!: IRummikubRoundPlayerScore[][];
  public version!: number;
  public createdAt!: Date;
  public updatedAt!: Date;

  serialize(): ISerializedRummikubGame {
    return {
      gameId: this.gameId,
      hostUserId: this.hostUserId,
      state: this.state,
      options: this.options,
      actionToUserId: this.actionToUserId,
      sets: this.sets,
      tilePool: this.tilePool,
      players: this.players,
      latestUpdateSets: this.latestUpdateSets,
      lastValidUpdateSets: this.lastValidUpdateSets,
      completedRounds: this.completedRounds,
      version: this.version,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
RummikubGame.init(
  {
    gameId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    hostUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "userId",
      },
    },
    state: {
      type: STATE_ENUM,
      allowNull: false,
    },
    options: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    actionToUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "userId",
      },
    },
    sets: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    tilePool: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    players: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    latestUpdateSets: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    lastValidUpdateSets: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    completedRounds: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  { sequelize }
);
