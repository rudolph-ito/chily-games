import { ICard } from "../../../shared/dtos/yaniv/card";
import {
  doesHaveValue,
  doesNotHaveValue,
} from "../../../shared/utilities/value_checker";
import {
  YanivGame,
  ISerializedYanivGame,
  IYanivPlayer,
  IYanivCompletedRound,
} from "../../../database/models/yaniv_game";
import {
  GameState,
  IGameOptions,
  ISearchGamesRequest,
} from "../../../shared/dtos/yaniv/game";
import { serializeCard } from "../card_helpers";
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
  completedRounds?: IYanivCompletedRound[][];
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
      players: [{ userId: options.hostUserId, position: 0, cardsInHand: [] }],
      completedRounds: [],
      version: 1,
    });
    await game.save();
    return game.serialize();
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
      options.where = { state: { [Op.ne]: GameState.COMPLETE } };
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
    for (let [key, value] of Object.entries(options)) {
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
