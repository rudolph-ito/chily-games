import { ICard } from "../../../shared/dtos/card";
import { doesNotHaveValue } from "../../../shared/utilities/value_checker";
import { IPaginatedResponse } from "../../../shared/dtos/search";
import { gameNotFoundError, ValidationError } from "../../shared/exceptions";
import { FindAndCountOptions, Op } from "sequelize";
import {
  GameState,
  IDiscardPile,
  IGameOptions,
  IMeld,
  ISearchGamesRequest,
} from "../../../shared/dtos/double_rummy/game";
import {
  DoubleRummyGame,
  IDoubleRummyPlayer,
  IDoubleRummyPlayerScore,
  ISerializedDoubleRummyGame,
} from "../../../database/models/double_rummy_game";

export interface IDoubleRummyCreateOptions {
  hostUserId: number;
  options: IGameOptions;
}

export interface IDoubleRummyUpdateOptions {
  options?: IGameOptions;
  state?: GameState;
  actionToUserId?: number;
  cardsInDeck?: ICard[];
  discardPile?: IDiscardPile;
  melds?: IMeld[];
  players?: IDoubleRummyPlayer[];
  completedRounds?: IDoubleRummyPlayerScore[][];
}

export interface IDoubleRummyGameDataService {
  create: (
    options: IDoubleRummyCreateOptions
  ) => Promise<ISerializedDoubleRummyGame>;
  get: (gameId: number) => Promise<ISerializedDoubleRummyGame>;
  update: (
    gameId: number,
    version: number,
    options: IDoubleRummyUpdateOptions
  ) => Promise<ISerializedDoubleRummyGame>;
  search: (
    request: ISearchGamesRequest
  ) => Promise<IPaginatedResponse<ISerializedDoubleRummyGame>>;
  abortUnfinishedGames: (ageInHoursThreshold: number) => Promise<any>;
}

export class DoubleRummyGameDataService implements IDoubleRummyGameDataService {
  async create(
    options: IDoubleRummyCreateOptions
  ): Promise<ISerializedDoubleRummyGame> {
    const game = DoubleRummyGame.build({
      hostUserId: options.hostUserId,
      actionToUserId: options.hostUserId,
      options: options.options,
      state: GameState.PLAYERS_JOINING,
      cardsInDeck: [],
      discardPile: {
        A: [],
        B: [],
      },
      players: [
        { userId: options.hostUserId, cardsInHand: [], meldedCards: [] },
      ],
      completedRounds: [],
      version: 1,
    });
    await game.save();
    return game.serialize();
  }

  async abortUnfinishedGames(ageInHoursThreshold: number): Promise<number> {
    const result = await DoubleRummyGame.update(
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

  async get(gameId: number): Promise<ISerializedDoubleRummyGame> {
    const game = await DoubleRummyGame.findByPk(gameId);
    if (game == null) {
      throw gameNotFoundError(gameId);
    }
    return game.serialize();
  }

  async search(
    request: ISearchGamesRequest
  ): Promise<IPaginatedResponse<ISerializedDoubleRummyGame>> {
    if (doesNotHaveValue(request.pagination)) {
      request.pagination = { pageIndex: 0, pageSize: 100 };
    }
    const options: FindAndCountOptions<DoubleRummyGame> = {
      offset: request.pagination.pageIndex * request.pagination.pageSize,
      order: [["createdAt", "DESC"]],
      limit: request.pagination.pageSize,
    };
    if (request.filter == null || !request.filter.includeCompleted) {
      options.where = {
        state: { [Op.notIn]: [GameState.COMPLETE, GameState.ABORTED] },
      };
    }
    const result = await DoubleRummyGame.findAndCountAll(options);
    return {
      data: result.rows.map((r: DoubleRummyGame) => r.serialize()),
      total: result.count,
    };
  }

  async update(
    gameId: number,
    version: number,
    options: IDoubleRummyUpdateOptions
  ): Promise<ISerializedDoubleRummyGame> {
    const updates: any = {};
    for (const [key, value] of Object.entries(options)) {
      updates[key] = value;
    }
    updates.version = version + 1;
    const result = await DoubleRummyGame.update(updates, {
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
