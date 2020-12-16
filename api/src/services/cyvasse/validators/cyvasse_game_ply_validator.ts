import { CyvasseCoordinateMap } from "../game/storage/cyvasse_coordinate_map";
import {
  IPieceRule,
  CaptureType,
  PieceType,
} from "../../../shared/dtos/cyvasse/piece_rule";
import {
  ITerrainRule,
  TerrainType,
} from "../../../shared/dtos/cyvasse/terrain_rule";
import {
  IGamePly,
  ICoordinate,
  IPiece,
  PlayerColor,
} from "../../../shared/dtos/cyvasse/game";
import { IVariant } from "../../../shared/dtos/cyvasse/variant";
import { CyvassePlyCalculator } from "../game/ply_calculator/cyvasse_ply_calculator";

export interface IValidateGamePlyOptions {
  coordinateMap: CyvasseCoordinateMap;
  pieceRuleMap: Map<PieceType, IPieceRule>;
  playerColor: PlayerColor;
  ply: IGamePly;
  terrainRuleMap: Map<TerrainType, ITerrainRule>;
  variant: IVariant;
}

export function validateGamePly(
  options: IValidateGamePlyOptions
): string | null {
  const plyCalculator = new CyvassePlyCalculator({
    coordinateMap: options.coordinateMap,
    pieceRuleMap: options.pieceRuleMap,
    terrainRuleMap: options.terrainRuleMap,
    variant: options.variant,
  });
  // Top level validation
  if (options.ply.piece == null) {
    return "Piece is required";
  }
  if (options.ply.piece.playerColor !== options.playerColor) {
    return "Piece must belong to player";
  }
  if (options.ply.from == null) {
    return "From is required";
  }
  const existingPiece = options.coordinateMap.getPiece(options.ply.from);
  if (
    existingPiece == null ||
    !arePiecesEqual(existingPiece, options.ply.piece)
  ) {
    return "Piece is not at from coordinate";
  }
  if (options.ply.movement == null && options.ply.rangeCapture == null) {
    return "Movement or range capture is required";
  }
  // Movement validation
  if (options.ply.movement != null) {
    const movementValidPlies = plyCalculator.getValidPlies({
      coordinate: options.ply.from,
      evaluationType: CaptureType.MOVEMENT,
    });
    const to = options.ply.movement.to;
    if (options.ply.movement.capturedPiece != null) {
      const pieceRule = options.pieceRuleMap.get(options.ply.piece.pieceTypeId);
      if (pieceRule == null) {
        throw new Error(
          `Piece rule not found for piece type: ${options.ply.piece.pieceTypeId}`
        );
      }
      if (pieceRule.captureType !== CaptureType.MOVEMENT) {
        return "Movement - piece cannot capture by movement";
      }
      const existingPiece = options.coordinateMap.getPiece(
        options.ply.movement.to
      );
      if (
        existingPiece == null ||
        !arePiecesEqual(existingPiece, options.ply.movement.capturedPiece)
      ) {
        return "Movement - captured piece is not at to coordinate";
      }
      const isValid = movementValidPlies.capturable.some((c) =>
        areCoordinatesEqual(c, to)
      );
      if (!isValid) {
        return "Movement - invalid (cannot capture)";
      }
    } else {
      const isValid = movementValidPlies.free.some((c) =>
        areCoordinatesEqual(c, to)
      );
      if (!isValid) {
        return "Movement - invalid (not free)";
      }
    }
  }
  // Movement and range capture
  let rangeCaptureFrom = options.ply.from;
  if (options.ply.movement != null && options.ply.rangeCapture != null) {
    const pieceRule = options.pieceRuleMap.get(options.ply.piece.pieceTypeId);
    if (pieceRule == null) {
      throw new Error(
        `Piece rule not found for piece type: ${options.ply.piece.pieceTypeId}`
      );
    }
    if (
      pieceRule.moveAndRangeCapture == null ||
      !pieceRule.moveAndRangeCapture
    ) {
      return "Piece cannot move and range capture in the same turn";
    }
    rangeCaptureFrom = options.ply.movement.to;
  }
  // Range capture
  if (options.ply.rangeCapture != null) {
    const rangeValidPlies = plyCalculator.getValidPlies({
      coordinate: rangeCaptureFrom,
      evaluationType: CaptureType.RANGE,
    });
    const existingPiece = options.coordinateMap.getPiece(
      options.ply.rangeCapture.to
    );
    if (
      existingPiece == null ||
      !arePiecesEqual(existingPiece, options.ply.rangeCapture.capturedPiece)
    ) {
      return "Range capture - captured piece is not at to coordinate";
    }
    const to = options.ply.rangeCapture.to;
    const isValid = rangeValidPlies.capturable.some((c) =>
      areCoordinatesEqual(c, to)
    );
    if (!isValid) {
      return "Range capture - invalid (cannot capture)";
    }
  }
  return null;
}

function areCoordinatesEqual(a: ICoordinate, b: ICoordinate): boolean {
  return a.x === b.x && a.y === b.y;
}

function arePiecesEqual(a: IPiece, b: IPiece): boolean {
  return a.pieceTypeId === b.pieceTypeId && a.playerColor === b.playerColor;
}
