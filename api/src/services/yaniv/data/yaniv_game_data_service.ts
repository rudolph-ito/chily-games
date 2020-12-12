import { ICard } from "../../../shared/dtos/yaniv/card";
import {
  doesHaveValue,
  doesNotHaveValue,
} from "../../../shared/utilities/value_checker";
import {
  YanivGame,
  ISerializedYanivGame,
} from "../../../database/models/yaniv_game";
import {
  GameState,
  IGameOptions,
  ISearchGamesRequest,
} from "../../../shared/dtos/yaniv/game";
import { serializeCard } from "../card_helpers";
import { IPaginatedResponse } from "src/shared/dtos/search";

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
}

export interface IYanivGameDataService {
  create: (options: IYanivGameCreateOptions) => Promise<ISerializedYanivGame>;
  get: (gameId: number) => Promise<ISerializedYanivGame>;
  has: (gameId: number) => Promise<boolean>;
  update: (
    gameId: number,
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
    });
    await game.save();
    return game.serialize();
  }

  async get(gameId: number): Promise<ISerializedYanivGame> {
    const game = (await YanivGame.findByPk(gameId)) as YanivGame;
    return game.serialize();
  }

  async has(gameId: number): Promise<boolean> {
    const count = await YanivGame.count({
      where: { gameId },
    });
    return count === 1;
  }

  async search(
    request: ISearchGamesRequest
  ): Promise<IPaginatedResponse<ISerializedYanivGame>> {
    if (doesNotHaveValue(request.pagination)) {
      request.pagination = { pageIndex: 0, pageSize: 100 };
    }
    const result = await YanivGame.findAndCountAll({
      offset: request.pagination.pageIndex * request.pagination.pageSize,
      limit: request.pagination.pageSize,
    });
    return {
      data: result.rows.map((r: YanivGame) => r.serialize()),
      total: result.count,
    };
  }

  async update(
    gameId: number,
    options: IYanivGameUpdateOptions
  ): Promise<ISerializedYanivGame> {
    const game = (await YanivGame.findByPk(gameId)) as YanivGame;
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
      game[key] = value;
    }
    await game.save();
    return game.serialize();
  }
}
