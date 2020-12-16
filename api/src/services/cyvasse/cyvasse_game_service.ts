import { IPaginatedResponse } from "../../shared/dtos/search";
import {
  IGame,
  IGameSetupChange,
  IGamePly,
  ISearchGamesRequest,
  Action,
  PlayerColor,
  IGameSetupTerritories,
  IGamePlyEvent,
  ValidPlies,
  IGetGameValidPliesRequest,
  IGameRules,
} from "../../shared/dtos/cyvasse/game";
import {
  ICyvasseGameDataService,
  CyvasseGameDataService,
  IGameUpdateOptions,
} from "./data/cyvasse_game_data_service";
import { AuthorizationError, ValidationError } from "../shared/exceptions";
import { CyvasseCoordinateMap } from "./game/storage/cyvasse_coordinate_map";
import { getBoardForVariant } from "./game/board/cyvasse_board_builder";
import {
  ICyvasseVariantDataService,
  CyvasseVariantDataService,
} from "./data/cyvasse_variant_data_service";
import { validateGameSetupChange } from "./validators/cyvasse_game_setup_change_validator";
import {
  ICyvassePieceRuleDataService,
  CyvassePieceRuleDataService,
} from "./data/cyvasse_piece_rule_data_service";
import {
  ICyvasseTerrainRuleDataService,
  CyvasseTerrainRuleDataService,
} from "./data/cyvasse_terrain_rule_data_service";
import { PieceType, IPieceRule } from "../../shared/dtos/cyvasse/piece_rule";
import {
  TerrainType,
  ITerrainRule,
} from "../../shared/dtos/cyvasse/terrain_rule";
import { validateGameSetupComplete } from "./validators/cyvasse_game_setup_complete_validator";
import { validateGamePly } from "./validators/cyvasse_game_ply_validator";
import { CyvassePlyCalculator } from "./game/ply_calculator/cyvasse_ply_calculator";

export interface ICyvasseGameService {
  abortGame: (userId: number, gameId: number) => Promise<void>;
  getGame: (userId: number | null, gameId: number) => Promise<IGame>;
  getGameRules: (gameId: number) => Promise<IGameRules>;
  getValidPlies: (
    gameId: number,
    request: IGetGameValidPliesRequest
  ) => Promise<ValidPlies>;
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
  ) => Promise<IGamePlyEvent>;
  resignGame: (userId: number, gameId: number) => Promise<void>;
  searchGames: (
    request: ISearchGamesRequest
  ) => Promise<IPaginatedResponse<IGame>>;
}

export class CyvasseGameService implements ICyvasseGameService {
  constructor(
    private readonly gameDataService: ICyvasseGameDataService = new CyvasseGameDataService(),
    private readonly variantDataService: ICyvasseVariantDataService = new CyvasseVariantDataService(),
    private readonly pieceRuleDataService: ICyvassePieceRuleDataService = new CyvassePieceRuleDataService(),
    private readonly terrainRuleDataService: ICyvasseTerrainRuleDataService = new CyvasseTerrainRuleDataService()
  ) {}

  async getGame(userId: number, gameId: number): Promise<IGame> {
    const game = await this.gameDataService.getGame(gameId);
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

  async getGameRules(gameId: number): Promise<IGameRules> {
    const game = await this.gameDataService.getGame(gameId);
    const variant = await this.variantDataService.getVariant(game.variantId);
    const board = getBoardForVariant(variant);
    const setupTerritories: IGameSetupTerritories = {
      alabaster: [],
      neutral: [],
      onyx: [],
    };
    board.getAllCoordinates().forEach((c) => {
      const territoryOwner = board.getSetupTerritoryOwner(c);
      if (territoryOwner === PlayerColor.ALABASTER) {
        setupTerritories.alabaster.push(c);
      } else if (territoryOwner === PlayerColor.ONYX) {
        setupTerritories.onyx.push(c);
      } else {
        setupTerritories.neutral.push(c);
      }
    });
    const pieceRules = await this.pieceRuleDataService.getPieceRules(
      game.variantId
    );
    const terrainRules = await this.terrainRuleDataService.getTerrainRules(
      game.variantId
    );
    return {
      pieces: pieceRules.map((pr) => ({
        pieceTypeId: pr.pieceTypeId,
        count: pr.count,
        captureType: pr.captureType,
        moveAndRangeCapture: pr.moveAndRangeCapture,
      })),
      terrains: terrainRules.map((tr) => ({
        terrainTypeId: tr.terrainTypeId,
        count: tr.count,
      })),
      setupTerritories,
    };
  }

  async getValidPlies(
    gameId: number,
    request: IGetGameValidPliesRequest
  ): Promise<ValidPlies> {
    const game = await this.gameDataService.getGame(gameId);
    const variant = await this.variantDataService.getVariant(game.variantId);
    const board = getBoardForVariant(variant);
    const coordinateMap = new CyvasseCoordinateMap(board.getAllCoordinates());
    coordinateMap.deserialize(game.currentCoordinateMap);
    const plyCalculator = new CyvassePlyCalculator({
      coordinateMap,
      pieceRuleMap: await this.getPieceRuleMap(game.variantId),
      terrainRuleMap: await this.getTerrainRuleMap(game.variantId),
      variant: variant,
    });
    return plyCalculator.getValidPlies(request);
  }

  async abortGame(userId: number, gameId: number): Promise<void> {
    const game = await this.gameDataService.getGame(gameId);
    if (userId !== game.alabasterUserId && userId !== game.onyxUserId) {
      throw new AuthorizationError("Only players may abort");
    }
    if (game.action !== Action.SETUP) {
      throw new ValidationError({ general: "Can only abort during setup" });
    }
    const actionTo =
      game.alabasterUserId === userId
        ? PlayerColor.ONYX
        : PlayerColor.ALABASTER;
    await this.gameDataService.updateGame(gameId, {
      action: Action.ABORTED,
      actionTo,
    });
  }

  async updateGameSetup(
    userId: number,
    gameId: number,
    change: IGameSetupChange
  ): Promise<void> {
    const game = await this.gameDataService.getGame(gameId);
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
    const coordinateMap = new CyvasseCoordinateMap(board.getAllCoordinates());
    coordinateMap.deserialize(setupCoordinateMap);
    const error = validateGameSetupChange({
      board,
      change,
      coordinateMap,
      pieceRuleMap: await this.getPieceRuleMap(game.variantId),
      playerColor,
      terrainRuleMap: await this.getTerrainRuleMap(game.variantId),
    });
    if (error != null) {
      throw new ValidationError({ general: error });
    }
    if (change.pieceChange != null) {
      if (change.pieceChange.from != null) {
        if (change.pieceChange.to != null) {
          coordinateMap.movePiece(
            change.pieceChange.from,
            change.pieceChange.to
          );
        } else {
          coordinateMap.deletePiece(change.pieceChange.from);
        }
      } else if (change.pieceChange.to != null) {
        coordinateMap.addPiece(change.pieceChange.to, {
          pieceTypeId: change.pieceChange.pieceTypeId,
          playerColor,
        });
      }
    } else {
      if (change.terrainChange != null) {
        if (change.terrainChange.from != null) {
          if (change.terrainChange.to != null) {
            coordinateMap.moveTerrain(
              change.terrainChange.from,
              change.terrainChange.to
            );
          } else {
            coordinateMap.deleteTerrain(change.terrainChange.from);
          }
        } else if (change.terrainChange.to != null) {
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
    await this.validateUserCanTakeSetupAction(game, userId);
    await this.validateUserSetupIsComplete(game, userId);
    if (game.actionTo == null) {
      const actionTo =
        game.alabasterUserId === userId
          ? PlayerColor.ONYX
          : PlayerColor.ALABASTER;
      await this.gameDataService.updateGame(gameId, {
        actionTo,
      });
    } else {
      const variant = await this.variantDataService.getVariant(game.variantId);
      const board = getBoardForVariant(variant);
      const coordinateMap = new CyvasseCoordinateMap(board.getAllCoordinates());
      coordinateMap.deserialize(game.alabasterSetupCoordinateMap);
      coordinateMap.deserialize(game.onyxSetupCoordinateMap);
      await this.gameDataService.updateGame(gameId, {
        action: Action.PLAY,
        actionTo: PlayerColor.ALABASTER,
        currentCoordinateMap: coordinateMap.serialize(),
      });
    }
  }

  async createGamePly(
    userId: number,
    gameId: number,
    ply: IGamePly
  ): Promise<IGamePlyEvent> {
    const game = await this.gameDataService.getGame(gameId);
    await this.validateUserCanCreatePly(game, userId);
    const playerColor =
      game.alabasterUserId === userId
        ? PlayerColor.ALABASTER
        : PlayerColor.ONYX;
    const variant = await this.variantDataService.getVariant(game.variantId);
    const board = getBoardForVariant(variant);
    const coordinateMap = new CyvasseCoordinateMap(board.getAllCoordinates());
    coordinateMap.deserialize(game.currentCoordinateMap);
    const error = validateGamePly({
      coordinateMap,
      pieceRuleMap: await this.getPieceRuleMap(game.variantId),
      playerColor,
      ply,
      terrainRuleMap: await this.getTerrainRuleMap(game.variantId),
      variant,
    });
    if (error != null) {
      throw new ValidationError({ general: error });
    }
    if (ply.movement != null) {
      coordinateMap.movePiece(ply.from, ply.movement.to);
    }
    if (ply.rangeCapture != null) {
      coordinateMap.deletePiece(ply.rangeCapture.to);
    }
    const nextActionTo =
      game.alabasterUserId === userId
        ? PlayerColor.ONYX
        : PlayerColor.ALABASTER;
    const actionToHasKing = coordinateMap
      .serialize()
      .some(
        ({ value }) =>
          value.piece != null &&
          value.piece.pieceTypeId === PieceType.KING &&
          value.piece.playerColor === nextActionTo
      );
    const nextAction = actionToHasKing ? Action.PLAY : Action.COMPLETE;
    await this.gameDataService.updateGame(gameId, {
      action: nextAction,
      actionTo: nextActionTo,
      plies: game.plies.concat([ply]),
      currentCoordinateMap: coordinateMap.serialize(),
    });
    return {
      nextAction,
      nextActionTo,
      plyIndex: game.plies.length,
      ply,
    };
  }

  async resignGame(userId: number, gameId: number): Promise<void> {
    const game = await this.gameDataService.getGame(gameId);
    if (userId !== game.alabasterUserId && userId !== game.onyxUserId) {
      throw new AuthorizationError("Only players may resign");
    }
    if (game.action !== Action.PLAY) {
      throw new ValidationError({
        general: "Can only resign during play",
      });
    }
    const actionTo =
      game.alabasterUserId === userId
        ? PlayerColor.ONYX
        : PlayerColor.ALABASTER;
    await this.gameDataService.updateGame(gameId, {
      action: Action.RESIGNED,
      actionTo,
    });
  }

  async searchGames(
    request: ISearchGamesRequest
  ): Promise<IPaginatedResponse<IGame>> {
    return await this.gameDataService.searchGames(request);
  }

  private async getPieceRuleMap(
    variantId: number
  ): Promise<Map<PieceType, IPieceRule>> {
    const result = new Map<PieceType, IPieceRule>();
    const pieceRules = await this.pieceRuleDataService.getPieceRules(variantId);
    pieceRules.forEach((pr) => result.set(pr.pieceTypeId, pr));
    return result;
  }

  private async getTerrainRuleMap(
    variantId: number
  ): Promise<Map<TerrainType, ITerrainRule>> {
    const result = new Map<TerrainType, ITerrainRule>();
    const terrainRules = await this.terrainRuleDataService.getTerrainRules(
      variantId
    );
    terrainRules.forEach((tr) => result.set(tr.terrainTypeId, tr));
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
    if (game.actionTo != null) {
      const playerColor =
        game.alabasterUserId === userId
          ? PlayerColor.ALABASTER
          : PlayerColor.ONYX;
      if (game.actionTo !== playerColor) {
        throw new ValidationError({ general: "Already completed setup" });
      }
    }
  }

  private async validateUserCanCreatePly(
    game: IGame,
    userId: number
  ): Promise<void> {
    if (userId !== game.alabasterUserId && userId !== game.onyxUserId) {
      throw new AuthorizationError("Only players may create plies");
    }
    if (game.action !== Action.PLAY) {
      throw new ValidationError({
        general: "Can only create plies while playing",
      });
    }
    const playerColor =
      game.alabasterUserId === userId
        ? PlayerColor.ALABASTER
        : PlayerColor.ONYX;
    if (game.actionTo !== playerColor) {
      throw new ValidationError({ general: "Not your turn" });
    }
  }

  private async validateUserSetupIsComplete(
    game: IGame,
    userId: number
  ): Promise<void> {
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
    const coordinateMap = new CyvasseCoordinateMap(board.getAllCoordinates());
    coordinateMap.deserialize(setupCoordinateMap);
    const error = validateGameSetupComplete({
      coordinateMap,
      pieceRuleMap: await this.getPieceRuleMap(game.variantId),
      terrainRuleMap: await this.getTerrainRuleMap(game.variantId),
    });
    if (error != null) {
      throw new ValidationError({ general: error });
    }
  }
}
