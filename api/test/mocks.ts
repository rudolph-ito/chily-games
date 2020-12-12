import {
  PieceType,
  IPieceRule,
  CaptureType,
  PathType,
  IPieceRuleOptions,
} from "../src/shared/dtos/cyvasse/piece_rule";
import {
  ITerrainRule,
  TerrainType,
  PiecesEffectedType,
  ITerrainRuleOptions,
} from "../src/shared/dtos/cyvasse/terrain_rule";
import {
  IVariant,
  IVariantOptions,
  BoardType,
} from "../src/shared/dtos/cyvasse/variant";

// Create objects without saving them to the database

export function mockPieceRule(options: Partial<IPieceRuleOptions>): IPieceRule {
  return {
    pieceRuleId: 0,
    variantId: 0,
    pieceTypeId: PieceType.KING,
    count: 1,
    movement: {
      type: PathType.ORTHOGONAL_LINE,
      minimum: 1,
    },
    captureType: CaptureType.MOVEMENT,
    ...options,
  };
}

export function mockTerrainRule(
  options: Partial<ITerrainRuleOptions>
): ITerrainRule {
  return {
    terrainRuleId: 0,
    variantId: 0,
    terrainTypeId: TerrainType.FOREST,
    count: 1,
    passableMovement: {
      for: PiecesEffectedType.ALL,
      pieceTypeIds: [],
    },
    passableRange: {
      for: PiecesEffectedType.ALL,
      pieceTypeIds: [],
    },
    slowsMovement: {
      for: PiecesEffectedType.NONE,
      pieceTypeIds: [],
    },
    stopsMovement: {
      for: PiecesEffectedType.NONE,
      pieceTypeIds: [],
    },
    ...options,
  };
}

export function mockVariant(options: Partial<IVariantOptions> = {}): IVariant {
  return {
    variantId: 0,
    userId: 0,
    boardType: BoardType.HEXAGONAL,
    boardSize: 6,
    pieceRanks: false,
    ...options,
  };
}
