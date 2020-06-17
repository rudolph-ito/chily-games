import { IPaginatedResponse } from "../shared/dtos/search";
import {
  IGame,
  IGameSetupChange,
  IGamePly,
  ISearchGamesRequest,
  Action,
  PlayerColor,
} from "../shared/dtos/game";
import {
  IGameDataService,
  GameDataService,
  IGameUpdateOptions,
} from "./data/game_data_service";
import {
  doesNotHaveValue,
  doesHaveValue,
} from "../shared/utilities/value_checker";
import {
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "./exceptions";
import { CoordinateMap } from "./game/storage/coordinate_map";

export interface IGameService {
  abortGame: (userId: number, gameId: number) => Promise<void>;
  getGame: (userId: number, gameId: number) => Promise<IGame>;
  updateGameSetup: (
    userId: number,
    gameId: number,
    change: IGameSetupChange
  ) => Promise<void>;
  completeGameSetup: (userId: number, gameId: number) => Promise<void>;
  createGamePly: (
    userId: number,
    gameId: number,
    ply: IGamePly
  ) => Promise<void>;
  resignGame: (userId: number, gameId: number) => Promise<void>;
  searchGames: (
    request: ISearchGamesRequest
  ) => Promise<IPaginatedResponse<IGame>>;
}

export class GameService implements IGameService {
  constructor(
    private readonly gameDataService: IGameDataService = new GameDataService()
  ) {}

  async getGame(userId: number, gameId: number): Promise<IGame> {
    const game = await this.gameDataService.getGame(gameId);
    if (doesNotHaveValue(game)) {
      this.throwGameNotFoundError(gameId);
    }
    // TODO during setup, for players, return just their view, for spectators return nothing
    return game;
  }

  async abortGame(userId: number, gameId: number): Promise<void> {
    const game = await this.gameDataService.getGame(gameId);
    if (doesNotHaveValue(game)) {
      this.throwGameNotFoundError(gameId);
    }
    if (userId !== game.alabasterUserId && userId !== game.onyxUserId) {
      throw new AuthorizationError("Only players may abort");
    }
    if (game.action !== Action.SETUP) {
      throw new ValidationError({ general: "Can only abort during setup" });
    }
    // TODO abort game
  }

  async updateGameSetup(
    userId: number,
    gameId: number,
    change: IGameSetupChange
  ): Promise<void> {
    const game = await this.gameDataService.getGame(gameId);
    if (doesNotHaveValue(game)) {
      this.throwGameNotFoundError(gameId);
    }
    if (userId !== game.alabasterUserId && userId !== game.onyxUserId) {
      throw new AuthorizationError("Only players may update setup");
    }
    if (game.action !== Action.SETUP) {
      throw new ValidationError({
        general: "Can only update setup during setup",
      });
    }
    if (doesHaveValue(game.actionToUserId) && game.actionToUserId !== userId) {
      throw new ValidationError({ general: "Already completed setup" });
    }
    const playerColor =
      game.alabasterUserId === userId
        ? PlayerColor.ALABASTER
        : PlayerColor.ONYX;
    const setupCoordinateMap =
      playerColor === PlayerColor.ALABASTER
        ? game.alabasterSetupCoordinateMap
        : game.onyxSetupCoordinateMap;
    const coordinateMap = CoordinateMap.deserialize(setupCoordinateMap);
    // validate
    if (doesHaveValue(change.pieceChange)) {
      if (doesHaveValue(change.pieceChange.from)) {
        if (doesHaveValue(change.pieceChange.to)) {
          coordinateMap.movePiece(
            change.pieceChange.from,
            change.pieceChange.to
          );
        } else {
          coordinateMap.deletePiece(change.pieceChange.from);
        }
      } else {
        coordinateMap.addPiece(change.pieceChange.to, {
          pieceTypeId: change.pieceChange.pieceTypeId,
          playerColor,
        });
      }
    } else {
      if (doesHaveValue(change.terrainChange)) {
        if (doesHaveValue(change.terrainChange.from)) {
          if (doesHaveValue(change.terrainChange.to)) {
            coordinateMap.moveTerrain(
              change.terrainChange.from,
              change.terrainChange.to
            );
          } else {
            coordinateMap.deleteTerrain(change.terrainChange.from);
          }
        } else {
          coordinateMap.addTerrain(change.terrainChange.to, {
            terrainTypeId: change.terrainChange.terrainTypeId,
            playerColor,
          });
        }
      }
    }
    const updates: IGameUpdateOptions =
      playerColor === PlayerColor.ALABASTER
        ? { alabasterSetupCoordinateMap: coordinateMap.serialize() }
        : { onyxSetupCoordinateMap: coordinateMap.serialize() };
    await this.gameDataService.updateGame(gameId, updates);
  }

  async completeGameSetup(userId: number, gameId: number): Promise<void> {
    const game = await this.gameDataService.getGame(gameId);
    if (doesNotHaveValue(game)) {
      this.throwGameNotFoundError(gameId);
    }
    if (userId !== game.alabasterUserId && userId !== game.onyxUserId) {
      throw new AuthorizationError("Only players may complete setup");
    }
    if (game.action !== Action.SETUP) {
      throw new ValidationError({
        general: "Can only update game setup during setup",
      });
    }
    if (doesHaveValue(game.actionToUserId) && game.actionToUserId !== userId) {
      throw new ValidationError({ general: "Already completed setup" });
    }
    if (doesNotHaveValue(game.actionToUserId)) {
      // update action to user id to other player
    } else {
      // update action to play and action to user id to alabaster
    }
  }

  async createGamePly(
    userId: number,
    gameId: number,
    ply: IGamePly
  ): Promise<void> {
    const game = await this.gameDataService.getGame(gameId);
    if (doesNotHaveValue(game)) {
      this.throwGameNotFoundError(gameId);
    }
    if (userId !== game.alabasterUserId && userId !== game.onyxUserId) {
      throw new AuthorizationError("Only players may create plies");
    }
    if (game.action !== Action.PLAY) {
      throw new ValidationError({
        general: "Can only create plies while playing",
      });
    }
    if (game.actionToUserId !== userId) {
      throw new ValidationError({ general: "Not your turn" });
    }
    // validate and record ply
  }

  async resignGame(userId: number, gameId: number): Promise<void> {}

  async searchGames(
    request: ISearchGamesRequest
  ): Promise<IPaginatedResponse<IGame>> {
    return await this.gameDataService.searchGames(request);
  }

  private throwGameNotFoundError(gameId: number): void {
    throw new NotFoundError(`Game does not exist with id: ${gameId}`);
  }
}
