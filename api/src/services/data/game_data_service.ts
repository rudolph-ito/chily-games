import { Game } from "../../database/models";
import { IPaginatedResponse } from "../../shared/dtos/search";
import {
  doesNotHaveValue,
  doesHaveValue,
} from "../../shared/utilities/value_checker";
import {
  IGame,
  Action,
  ISearchGamesRequest,
  ICoordinateMapData,
  IGamePly,
  PlayerColor,
} from "../../shared/dtos/game";

export interface IGameOptions {
  variantId: number;
  alabasterUserId: number;
  onyxUserId: number;
}

export interface IGameUpdateOptions {
  action?: Action;
  actionTo?: PlayerColor;
  alabasterSetupCoordinateMap?: ICoordinateMapData[];
  onyxSetupCoordinateMap?: ICoordinateMapData[];
  currentCoordinateMap?: ICoordinateMapData[];
  plies?: IGamePly[];
}

export interface IGameDataService {
  createGame: (options: IGameOptions) => Promise<IGame>;
  getGame: (gameId: number) => Promise<IGame>;
  searchGames: (
    request: ISearchGamesRequest
  ) => Promise<IPaginatedResponse<IGame>>;
  updateGame: (gameId: number, options: IGameUpdateOptions) => Promise<void>;
}

export class GameDataService implements IGameDataService {
  async createGame(options: IGameOptions): Promise<IGame> {
    const game = Game.build({
      variantId: options.variantId,
      action: Action.SETUP,
      actionTo: null,
      alabasterUserId: options.alabasterUserId,
      onyxUserId: options.onyxUserId,
      alabasterSetupCoordinateMap: [],
      onyxSetupCoordinateMap: [],
      currentCoordinateMap: [],
      plies: [],
    });
    await game.save();
    return game.serialize();
  }

  async getGame(gameId: number): Promise<IGame> {
    const game = await Game.findByPk(gameId);
    if (doesHaveValue(game)) {
      return game.serialize();
    }
    return null;
  }

  async searchGames(
    request: ISearchGamesRequest
  ): Promise<IPaginatedResponse<IGame>> {
    if (doesNotHaveValue(request.pagination)) {
      request.pagination = { pageIndex: 0, pageSize: 100 };
    }
    const result = await Game.findAndCountAll({
      offset: request.pagination.pageIndex * request.pagination.pageSize,
      limit: request.pagination.pageSize,
    });
    return {
      data: result.rows.map((r: Game) => r.serialize()),
      total: result.count,
    };
  }

  async updateGame(gameId: number, options: IGameUpdateOptions): Promise<void> {
    const game = await Game.findByPk(gameId);
    for (const [key, value] of Object.entries(options)) {
      game[key] = value;
    }
    await game.save();
  }
}
