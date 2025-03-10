import {
  RummikubGame,
  ISerializedRummikubGame,
  IRummikubPlayer,
  IRummikubRoundPlayerScore,
} from "../../../database/models/rummikub_game";
import {
  GameState,
  IGameOptions,
  INullableTile,
  ISearchGamesRequest,
  IUpdateSets,
} from "../../../shared/dtos/rummikub/game";
import { IPaginatedResponse } from "../../../shared/dtos/search";
import { gameNotFoundError, ValidationError } from "../../shared/exceptions";
import { FindAndCountOptions, Op } from "sequelize";
import { ITile } from "src/shared/dtos/rummikub/tile";

export interface IRummbikubGameCreateOptions {
  hostPlayer: IRummikubPlayer;
  options: IGameOptions;
}

export interface IRummikubGameUpdateOptions {
  options?: IGameOptions;
  state?: GameState;
  actionToUserId?: number;
  sets?: INullableTile[];
  tilePool?: ITile[];
  players?: IRummikubPlayer[];
  latestUpdateSets?: IUpdateSets | null;
  lastValidUpdateSets?: IUpdateSets | null;
  completedRounds?: IRummikubRoundPlayerScore[][];
}

export interface IRummikubGameDataService {
  create: (
    options: IRummbikubGameCreateOptions
  ) => Promise<ISerializedRummikubGame>;
  get: (gameId: number) => Promise<ISerializedRummikubGame>;
  update: (
    gameId: number,
    version: number,
    options: IRummikubGameUpdateOptions
  ) => Promise<ISerializedRummikubGame>;
  search: (
    request: ISearchGamesRequest
  ) => Promise<IPaginatedResponse<ISerializedRummikubGame>>;
  deleteByHourThreshold: (hours: number) => Promise<any>;
}

export class RummikubGameDataService implements IRummikubGameDataService {
  async create(
    createOptions: IRummbikubGameCreateOptions
  ): Promise<ISerializedRummikubGame> {
    const game = RummikubGame.build({
      hostUserId: createOptions.hostPlayer.userId,
      actionToUserId: createOptions.hostPlayer.userId,
      options: createOptions.options,
      state: GameState.PLAYERS_JOINING,
      sets: [],
      tilePool: [],
      players: [createOptions.hostPlayer],
      completedRounds: [],
      version: 1,
    });
    await game.save();
    return game.serialize();
  }

  async deleteByHourThreshold(hours: number): Promise<number> {
    const result = await RummikubGame.destroy({
      where: {
        updatedAt: {
          [Op.lt]: new Date(new Date().valueOf() - hours * 60 * 60 * 1000),
        },
      },
    });
    return result[0];
  }

  async get(gameId: number): Promise<ISerializedRummikubGame> {
    const game = await RummikubGame.findByPk(gameId);
    if (game == null) {
      throw gameNotFoundError(gameId);
    }
    return game.serialize();
  }

  async search(
    request: ISearchGamesRequest
  ): Promise<IPaginatedResponse<ISerializedRummikubGame>> {
    if (request.pagination == null) {
      request.pagination = { pageIndex: 0, pageSize: 100 };
    }
    const options: FindAndCountOptions<RummikubGame> = {
      offset: request.pagination.pageIndex * request.pagination.pageSize,
      order: [["createdAt", "DESC"]],
      limit: request.pagination.pageSize,
    };
    if (request.filter == null || !request.filter.includeCompleted) {
      options.where = {
        state: { [Op.notIn]: [GameState.COMPLETE, GameState.ABORTED] },
      };
    }
    const result = await RummikubGame.findAndCountAll(options);
    return {
      data: result.rows.map((r: RummikubGame) => r.serialize()),
      total: result.count,
    };
  }

  async update(
    gameId: number,
    version: number,
    options: IRummikubGameUpdateOptions
  ): Promise<ISerializedRummikubGame> {
    const updates: any = Object.assign({}, options);
    updates.version = version + 1;
    const result = await RummikubGame.update(options, {
      where: {
        gameId,
        version,
      },
      returning: true,
    });
    if (result[0] !== 1) {
      throw new ValidationError("Game version out of date.");
    }
    return result[1][0].serialize();
  }
}
