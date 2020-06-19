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
import { getBoardForVariant } from "./game/board/builder";
import {
  IVariantDataService,
  VariantDataService,
} from "./data/variant_data_service";
import { validateGameSetupChange } from "./validators/game_setup_change_validator";
import {
  IPieceRuleDataService,
  PieceRuleDataService,
} from "./data/piece_rule_data_service";
import {
  ITerrainRuleDataService,
  TerrainRuleDataService,
} from "./data/terrain_rule_data_service";
import { PieceType } from "src/shared/dtos/piece_rule";
import { TerrainType } from "src/shared/dtos/terrain_rule";

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
    private readonly gameDataService: IGameDataService = new GameDataService(),
    private readonly variantDataService: IVariantDataService = new VariantDataService(),
    private readonly pieceRuleDataService: IPieceRuleDataService = new PieceRuleDataService(),
    private readonly terrainRuleDataService: ITerrainRuleDataService = new TerrainRuleDataService()
  ) {}

  async getGame(userId: number, gameId: number): Promise<IGame> {
    const game = await this.gameDataService.getGame(gameId);
    if (doesNotHaveValue(game)) {
      this.throwGameNotFoundError(gameId);
    }
    if (game.action === Action.SETUP) {
      if (userId !== game.alabasterUserId) {
        game.alabasterSetupCoordinateMap = [];
      }
      if (userId !== game.onyxUserId) {
        game.onyxSetupCoordinateMap = [];
      }
    }
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
    await this.validateUserCanTakeSetupAction(game, userId);
    const playerColor =
      game.alabasterUserId === userId
        ? PlayerColor.ALABASTER
        : PlayerColor.ONYX;
    const setupCoordinateMap =
      playerColor === PlayerColor.ALABASTER
        ? game.alabasterSetupCoordinateMap
        : game.onyxSetupCoordinateMap;
    const variant = await this.variantDataService.getVariant(game.variantId);
    const board = getBoardForVariant(variant);
    const coordinateMap = new CoordinateMap(board.getAllCoordinates());
    coordinateMap.deserialize(setupCoordinateMap);
    const error = validateGameSetupChange({
      board,
      change,
      coordinateMap,
      pieceTypeCountMap: await this.getPieceTypeCountMap(game.variantId),
      playerColor,
      terrainTypeCountMap: await this.getTerrainTypeCountMap(game.variantId),
    });
    if (doesHaveValue(error)) {
      throw new ValidationError({ general: error });
    }
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
    await this.validateUserCanTakeSetupAction(game, userId);
    // validate all pieces / terrain setup
    if (doesNotHaveValue(game.actionToUserId)) {
      const opponentId =
        game.alabasterUserId === userId
          ? game.onyxUserId
          : game.alabasterUserId;
      await this.gameDataService.updateGame(gameId, {
        actionToUserId: opponentId,
      });
    } else {
      await this.gameDataService.updateGame(gameId, {
        action: Action.PLAY,
        actionToUserId: game.alabasterUserId,
      });
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

  private async getPieceTypeCountMap(
    variantId: number
  ): Promise<Map<PieceType, number>> {
    const result = new Map<PieceType, number>();
    const pieceRules = await this.pieceRuleDataService.getPieceRules(variantId);
    pieceRules.forEach((pr) => result.set(pr.pieceTypeId, pr.count));
    return result;
  }

  private async getTerrainTypeCountMap(
    variantId: number
  ): Promise<Map<TerrainType, number>> {
    const result = new Map<TerrainType, number>();
    const pieceRules = await this.terrainRuleDataService.getTerrainRules(
      variantId
    );
    pieceRules.forEach((tr) => result.set(tr.terrainTypeId, tr.count));
    return result;
  }

  private async validateUserCanTakeSetupAction(
    game: IGame,
    userId: number
  ): Promise<void> {
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
  }
}
