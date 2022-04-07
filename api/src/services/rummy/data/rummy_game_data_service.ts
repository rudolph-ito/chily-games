import { ICard } from "../../../shared/dtos/card";
import { doesNotHaveValue } from "../../../shared/utilities/value_checker";
import { IPaginatedResponse } from "../../../shared/dtos/search";
import { gameNotFoundError, ValidationError } from "../../shared/exceptions";
import { FindAndCountOptions, Op } from "sequelize";
import {
  GameState,
  IDiscardState,
  IGameOptions,
  IMeld,
  ISearchGamesRequest,
} from "../../../shared/dtos/rummy/game";
import {
  RummyGame,
  IRummyPlayer,
  IRummyPlayerScore,
  ISerializedRummyGame,
} from "../../../database/models/rummy_game";
import { times } from "lodash";

export interface IRummyCreateOptions {
  hostUserId: number;
  options: IGameOptions;
}

export interface IRummyUpdateOptions {
  options?: IGameOptions;
  state?: GameState;
  actionToUserId?: number;
  cardsInDeck?: ICard[];
  discardState?: IDiscardState;
  melds?: IMeld[];
  players?: IRummyPlayer[];
  completedRounds?: IRummyPlayerScore[][];
}

export interface IRummyGameDataService {
  create: (options: IRummyCreateOptions) => Promise<ISerializedRummyGame>;
  get: (gameId: number) => Promise<ISerializedRummyGame>;
  update: (
    gameId: number,
    version: number,
    options: IRummyUpdateOptions
  ) => Promise<ISerializedRummyGame>;
  search: (
    request: ISearchGamesRequest
  ) => Promise<IPaginatedResponse<ISerializedRummyGame>>;
  abortUnfinishedGames: (ageInHoursThreshold: number) => Promise<any>;
}

export class RummyGameDataService implements IRummyGameDataService {
  async create(input: IRummyCreateOptions): Promise<ISerializedRummyGame> {
    const piles: ICard[][] = [];
    times(input.options.numberOfDiscardPiles, () => piles.push([]));
    const game = RummyGame.build({
      hostUserId: input.hostUserId,
      actionToUserId: input.hostUserId,
      options: input.options,
      state: GameState.PLAYERS_JOINING,
      cardsInDeck: [],
      discardState: { piles },
      players: [{ userId: input.hostUserId, cardsInHand: [], meldedCards: [] }],
      completedRounds: [],
      version: 1,
    });
    await game.save();
    return game.serialize();
  }

  async abortUnfinishedGames(ageInHoursThreshold: number): Promise<number> {
    const result = await RummyGame.update(
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

  async get(gameId: number): Promise<ISerializedRummyGame> {
    const game = await RummyGame.findByPk(gameId);
    if (game == null) {
      throw gameNotFoundError(gameId);
    }
    return game.serialize();
  }

  async search(
    request: ISearchGamesRequest
  ): Promise<IPaginatedResponse<ISerializedRummyGame>> {
    if (doesNotHaveValue(request.pagination)) {
      request.pagination = { pageIndex: 0, pageSize: 100 };
    }
    const options: FindAndCountOptions<RummyGame> = {
      offset: request.pagination.pageIndex * request.pagination.pageSize,
      order: [["createdAt", "DESC"]],
      limit: request.pagination.pageSize,
    };
    if (request.filter == null || !request.filter.includeCompleted) {
      options.where = {
        state: { [Op.notIn]: [GameState.COMPLETE, GameState.ABORTED] },
      };
    }
    const result = await RummyGame.findAndCountAll(options);
    return {
      data: result.rows.map((r: RummyGame) => r.serialize()),
      total: result.count,
    };
  }

  async update(
    gameId: number,
    version: number,
    options: IRummyUpdateOptions
  ): Promise<ISerializedRummyGame> {
    const updates: any = {};
    for (const [key, value] of Object.entries(options)) {
      updates[key] = value;
    }
    updates.version = version + 1;
    const result = await RummyGame.update(updates, {
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
