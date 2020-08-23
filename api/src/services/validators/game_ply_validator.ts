import {
  doesHaveValue,
  doesNotHaveValue,
} from "../../shared/utilities/value_checker";
import { CoordinateMap } from "../game/storage/coordinate_map";
import {
  IPieceRule,
  CaptureType,
  PieceType,
} from "../../shared/dtos/piece_rule";
import { ITerrainRule, TerrainType } from "../../shared/dtos/terrain_rule";
import {
  IGamePly,
  ICoordinate,
  IPiece,
  PlayerColor,
} from "../../shared/dtos/game";
import { IVariant } from "../../shared/dtos/variant";
import { PlyCalculator } from "../game/ply_calculator";

export interface IValidateGamePlyOptions {
  coordinateMap: CoordinateMap;
  pieceRuleMap: Map<PieceType, IPieceRule>;
  playerColor: PlayerColor;
  ply: IGamePly;
  terrainRuleMap: Map<TerrainType, ITerrainRule>;
  variant: IVariant;
}

export function validateGamePly(options: IValidateGamePlyOptions): string {
  const plyCalculator = new PlyCalculator({
    coordinateMap: options.coordinateMap,
    pieceRuleMap: options.pieceRuleMap,
    terrainRuleMap: options.terrainRuleMap,
    variant: options.variant,
  });
  // Top level validation
  if (doesNotHaveValue(options.ply.piece)) {
    return "Piece is required";
  }
  if (options.ply.piece.playerColor !== options.playerColor) {
    return "Piece must belong to player";
  }
  if (doesNotHaveValue(options.ply.from)) {
    return "From is required";
  }
  const existingPiece = options.coordinateMap.getPiece(options.ply.from);
  if (
    doesNotHaveValue(existingPiece) ||
    !arePiecesEqual(existingPiece, options.ply.piece)
  ) {
    return "Piece is not at from coordinate";
  }
  if (
    doesNotHaveValue(options.ply.movement) &&
    doesNotHaveValue(options.ply.rangeCapture)
  ) {
    return "Movement or range capture is required";
  }
  // Movement validation
  if (doesHaveValue(options.ply.movement)) {
    const movementValidPlies = plyCalculator.getValidPlies({
      coordinate: options.ply.from,
      evaluationType: CaptureType.MOVEMENT,
    });
    if (doesHaveValue(options.ply.movement.capturedPiece)) {
      const pieceRule = options.pieceRuleMap.get(options.ply.piece.pieceTypeId);
      if (pieceRule.captureType !== CaptureType.MOVEMENT) {
        return "Movement - piece cannot capture by movement";
      }
      const existingPiece = options.coordinateMap.getPiece(
        options.ply.movement.to
      );
      if (
        doesNotHaveValue(existingPiece) ||
        !arePiecesEqual(existingPiece, options.ply.movement.capturedPiece)
      ) {
        return "Movement - captured piece is not at to coordinate";
      }
      const isValid = movementValidPlies.capturable.some((c) =>
        areCoordinatesEqual(c, options.ply.movement.to)
      );
      if (!isValid) {
        return "Movement - invalid (cannot capture)";
      }
    } else {
      const isValid = movementValidPlies.free.some((c) =>
        areCoordinatesEqual(c, options.ply.movement.to)
      );
      if (!isValid) {
        return "Movement - invalid (not free)";
      }
    }
  }
  // Movement and range capture
  let rangeCaptureFrom = options.ply.from;
  if (
    doesHaveValue(options.ply.movement) &&
    doesHaveValue(options.ply.rangeCapture)
  ) {
    const pieceRule = options.pieceRuleMap.get(options.ply.piece.pieceTypeId);
    if (
      !doesNotHaveValue(pieceRule.moveAndRangeCapture) ||
      !pieceRule.moveAndRangeCapture
    ) {
      return "Piece cannot move and range capture in the same turn";
    }
    rangeCaptureFrom = options.ply.movement.to;
  }
  // Range capture
  if (doesHaveValue(options.ply.rangeCapture)) {
    const rangeValidPlies = plyCalculator.getValidPlies({
      coordinate: rangeCaptureFrom,
      evaluationType: CaptureType.RANGE,
    });
    const existingPiece = options.coordinateMap.getPiece(
      options.ply.rangeCapture.to
    );
    if (
      doesNotHaveValue(existingPiece) ||
      !arePiecesEqual(existingPiece, options.ply.rangeCapture.capturedPiece)
    ) {
      return "Range capture - captured piece is not at to coordinate";
    }
    const isValid = rangeValidPlies.capturable.some((c) =>
      areCoordinatesEqual(c, options.ply.rangeCapture.to)
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
