import {
  PieceType,
  IPieceRule,
  CaptureType,
  PathType,
} from "../src/shared/dtos/piece_rule";
import {
  ITerrainRule,
  TerrainType,
  PiecesEffectedType,
} from "../src/shared/dtos/terrain_rule";

// Create objects without saving them to the database

export function mockPieceRule(options: Partial<IPieceRule>): IPieceRule {
  return {
    pieceRuleId: 0,
    variantId: 0,
    pieceTypeId: PieceType.KING,
    count: 1,
    movement: {
      type: PathType.ORTHOGONAL_LINE,
      minimum: 1,
      maximum: null,
    },
    captureType: CaptureType.MOVEMENT,
    ...options,
  };
}

export function mockTerrainRule(options: Partial<ITerrainRule>): ITerrainRule {
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
