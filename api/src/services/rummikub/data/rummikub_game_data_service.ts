import {
  RummikubGame,
  ISerializedRummikubGame,
  IRummikubPlayer,
  IRummikubRoundPlayerScore,
} from "../../../database/models/rummikub_game";
import {
  GameState,
  IGameOptions,
  ISearchGamesRequest,
} from "../../../shared/dtos/rummikub/game";
import { serializeTile } from "../../rummikub/tile_helpers";
import { IPaginatedResponse } from "../../../shared/dtos/search";
import { gameNotFoundError, ValidationError } from "../../shared/exceptions";
import { FindAndCountOptions, Op } from "sequelize";
import { ITile } from "src/shared/dtos/rummikub/tile";

export interface IRummbikubGameCreateOptions {
  hostUserId: number;
  options: IGameOptions;
}

export interface IRummikubGameUpdateOptions {
  options?: IGameOptions;
  state?: GameState;
  actionToUserId?: number;
  sets?: ITile[][];
  tilePool?: ITile[];
  players?: IRummikubPlayer[];
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
  abortUnfinishedGames: (ageInHoursThreshold: number) => Promise<any>;
}

export class RummikubGameDataService implements IRummikubGameDataService {
  async create(
    options: IRummbikubGameCreateOptions
  ): Promise<ISerializedRummikubGame> {
    const initialPlayer: IRummikubPlayer = {
      userId: options.hostUserId,
      tiles: [],
      hasPlayedInitialMeld: false,
    };
    const game = RummikubGame.build({
      hostUserId: options.hostUserId,
      actionToUserId: options.hostUserId,
      options: options.options,
      state: GameState.PLAYERS_JOINING,
      sets: [],
      tilePool: [],
      players: [initialPlayer],
      completedRounds: [],
      version: 1,
    });
    await game.save();
    return game.serialize();
  }

  async abortUnfinishedGames(ageInHoursThreshold: number): Promise<number> {
    const result = await RummikubGame.update(
      {
        state: GameState.ABORTED,
      },
      {
        where: {
          state: {
            [Op.notIn]: [GameState.ABORTED, GameState.COMPLETE],
          },
          updatedAt: {
            [Op.lt]: new Date(
              new Date().valueOf() - ageInHoursThreshold * 60 * 60 * 1000
            ),
          },
        },
      }
    );
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
    const updates: any = {};
    for (const pair of Object.entries(options)) {
      const key = pair[0];
      let value = pair[1];
      if (key == "sets") {
        value = (value as ITile[][]).map((s) => s.map(serializeTile));
      }
      if (key == "tilePool") {
        value = (value as ITile[]).map(serializeTile);
      }
      updates[key] = value;
    }
    updates.version = version + 1;
    const result = await RummikubGame.update(updates, {
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
