import { ICard } from "../../../shared/dtos/card";
import {
  doesHaveValue,
  doesNotHaveValue,
} from "../../../shared/utilities/value_checker";
import {
  YanivGame,
  ISerializedYanivGame,
  IYanivPlayer,
  IYanivRoundPlayerScore,
} from "../../../database/models/yaniv_game";
import {
  GameState,
  IGameOptions,
  ISearchGamesRequest,
} from "../../../shared/dtos/yaniv/game";
import { serializeCard } from "../../shared/card_helpers";
import { IPaginatedResponse } from "../../../shared/dtos/search";
import { gameNotFoundError, ValidationError } from "../../shared/exceptions";
import { FindAndCountOptions, Op } from "sequelize";

export interface IYanivGameCreateOptions {
  hostUserId: number;
  options: IGameOptions;
}

export interface IYanivGameUpdateOptions {
  options?: IGameOptions;
  state?: GameState;
  actionToUserId?: number;
  cardsInDeck?: ICard[];
  cardsBuriedInDiscardPile?: ICard[];
  cardsOnTopOfDiscardPile?: ICard[];
  players?: IYanivPlayer[];
  completedRounds?: IYanivRoundPlayerScore[][];
}

export interface IYanivGameDataService {
  create: (options: IYanivGameCreateOptions) => Promise<ISerializedYanivGame>;
  get: (gameId: number) => Promise<ISerializedYanivGame>;
  update: (
    gameId: number,
    version: number,
    options: IYanivGameUpdateOptions
  ) => Promise<ISerializedYanivGame>;
  search: (
    request: ISearchGamesRequest
  ) => Promise<IPaginatedResponse<ISerializedYanivGame>>;
  abortUnfinishedGames: (ageInHoursThreshold: number) => Promise<any>;
}

export class YanivGameDataService implements IYanivGameDataService {
  async create(
    options: IYanivGameCreateOptions
  ): Promise<ISerializedYanivGame> {
    const game = YanivGame.build({
      hostUserId: options.hostUserId,
      actionToUserId: options.hostUserId,
      options: options.options,
      state: GameState.PLAYERS_JOINING,
      cardsInDeck: [],
      cardsBuriedInDiscardPile: [],
      cardsOnTopOfDiscardPile: [],
      players: [{ userId: options.hostUserId, cardsInHand: [] }],
      completedRounds: [],
      version: 1,
    });
    await game.save();
    return game.serialize();
  }

  async abortUnfinishedGames(ageInHoursThreshold: number): Promise<number> {
    const result = await YanivGame.update(
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

  async get(gameId: number): Promise<ISerializedYanivGame> {
    const game = await YanivGame.findByPk(gameId);
    if (game == null) {
      throw gameNotFoundError(gameId);
    }
    return game.serialize();
  }

  async search(
    request: ISearchGamesRequest
  ): Promise<IPaginatedResponse<ISerializedYanivGame>> {
    if (doesNotHaveValue(request.pagination)) {
      request.pagination = { pageIndex: 0, pageSize: 100 };
    }
    const options: FindAndCountOptions<YanivGame> = {
      offset: request.pagination.pageIndex * request.pagination.pageSize,
      order: [["createdAt", "DESC"]],
      limit: request.pagination.pageSize,
    };
    if (request.filter == null || !request.filter.includeCompleted) {
      options.where = {
        state: { [Op.notIn]: [GameState.COMPLETE, GameState.ABORTED] },
      };
    }
    const result = await YanivGame.findAndCountAll(options);
    return {
      data: result.rows.map((r: YanivGame) => r.serialize()),
      total: result.count,
    };
  }

  async update(
    gameId: number,
    version: number,
    options: IYanivGameUpdateOptions
  ): Promise<ISerializedYanivGame> {
    const updates: any = {};
    for (const pair of Object.entries(options)) {
      const key = pair[0]
      let value = pair[1]
      if (
        [
          "cardsInDeck",
          "cardsBuriedInDiscardPile",
          "cardsOnTopOfDiscardPile",
        ].includes(key) &&
        doesHaveValue(value)
      ) {
        value = (value as ICard[]).map(serializeCard);
      }
      updates[key] = value;
    }
    updates.version = version + 1;
    const result = await YanivGame.update(updates, {
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
