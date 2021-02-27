import { IPaginatedResponse } from "../../../shared/dtos/search";
import { gameNotFoundError, ValidationError } from "../../shared/exceptions";
import { FindAndCountOptions, Op } from "sequelize";
import {
  IOhHeckPlayer,
  IOhHeckRoundPlayerScore,
  ISerializedOhHeckGame,
  OhHeckGame,
} from "../../../database/models/oh_heck_game";
import {
  GameState,
  IGameOptions,
  ISearchGamesRequest,
  ITrickPlayerCard,
} from "../../../shared/dtos/oh_heck/game";

export interface IOhHeckGameCreateOptions {
  hostUserId: number;
  options: IGameOptions;
}

export interface IOhHeckGameUpdateOptions {
  state?: GameState;
  actionToUserId?: number;
  players?: IOhHeckPlayer[];
  currentTrick?: ITrickPlayerCard[];
  completedRounds?: IOhHeckRoundPlayerScore[][];
}

export interface IOhHeckGameDataService {
  create: (options: IOhHeckGameCreateOptions) => Promise<ISerializedOhHeckGame>;
  get: (gameId: number) => Promise<ISerializedOhHeckGame>;
  update: (
    gameId: number,
    version: number,
    options: IOhHeckGameUpdateOptions
  ) => Promise<ISerializedOhHeckGame>;
  search: (
    request: ISearchGamesRequest
  ) => Promise<IPaginatedResponse<ISerializedOhHeckGame>>;
  abortUnfinishedGames: (ageInHoursThreshold: number) => Promise<any>;
}

export class OhHeckGameDataService implements IOhHeckGameDataService {
  async create(
    options: IOhHeckGameCreateOptions
  ): Promise<ISerializedOhHeckGame> {
    const game = OhHeckGame.build({
      hostUserId: options.hostUserId,
      actionToUserId: options.hostUserId,
      options: options.options,
      state: GameState.PLAYERS_JOINING,
      players: [
        { userId: options.hostUserId, cardsInHand: [], bet: 0, tricksTaken: 0 },
      ],
      currentTrick: [],
      completedRounds: [],
      version: 1,
    });
    await game.save();
    return game.serialize();
  }

  async abortUnfinishedGames(ageInHoursThreshold: number): Promise<number> {
    const result = await OhHeckGame.update(
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

  async get(gameId: number): Promise<ISerializedOhHeckGame> {
    const game = await OhHeckGame.findByPk(gameId);
    if (game == null) {
      throw gameNotFoundError(gameId);
    }
    return game.serialize();
  }

  async search(
    request: ISearchGamesRequest
  ): Promise<IPaginatedResponse<ISerializedOhHeckGame>> {
    if (request.pagination == null) {
      request.pagination = { pageIndex: 0, pageSize: 100 };
    }
    const options: FindAndCountOptions<OhHeckGame> = {
      offset: request.pagination.pageIndex * request.pagination.pageSize,
      order: [["createdAt", "DESC"]],
      limit: request.pagination.pageSize,
    };
    if (request.filter == null || !request.filter.includeCompleted) {
      options.where = {
        state: { [Op.notIn]: [GameState.COMPLETE, GameState.ABORTED] },
      };
    }
    const result = await OhHeckGame.findAndCountAll(options);
    return {
      data: result.rows.map((r: OhHeckGame) => r.serialize()),
      total: result.count,
    };
  }

  async update(
    gameId: number,
    version: number,
    options: IOhHeckGameUpdateOptions
  ): Promise<ISerializedOhHeckGame> {
    const updates: any = {};
    for (const [key, value] of Object.entries(options)) {
      updates[key] = value;
    }
    updates.version = version + 1;
    const result = await OhHeckGame.update(updates, {
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
