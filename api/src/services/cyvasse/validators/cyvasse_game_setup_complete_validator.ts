import { CyvasseCoordinateMap } from "../game/storage/cyvasse_coordinate_map";
import { PieceType, IPieceRule } from "../../../shared/dtos/cyvasse/piece_rule";
import {
  TerrainType,
  ITerrainRule,
} from "../../../shared/dtos/cyvasse/terrain_rule";

export interface IValidateGameSetupCompleteOptions {
  coordinateMap: CyvasseCoordinateMap;
  pieceRuleMap: Map<PieceType, IPieceRule>;
  terrainRuleMap: Map<TerrainType, ITerrainRule>;
}

export function validateGameSetupComplete(
  options: IValidateGameSetupCompleteOptions
): string | null {
  const currentPieceTypeCounts = getEmptyMap(options.pieceRuleMap);
  const currentTerrainTypeCounts = getEmptyMap(options.terrainRuleMap);
  options.coordinateMap.serialize().forEach(({ value: { piece, terrain } }) => {
    if (piece != null) {
      incrementValue(currentPieceTypeCounts, piece.pieceTypeId);
    }
    if (terrain != null) {
      incrementValue(currentTerrainTypeCounts, terrain.terrainTypeId);
    }
  });
  const errors = getCountDifferences(
    options.pieceRuleMap,
    currentPieceTypeCounts
  ).concat(
    getCountDifferences(options.terrainRuleMap, currentTerrainTypeCounts)
  );
  if (errors.length > 0) {
    return errors.join(", ");
  }
  return null;
}

interface IRuleWithCount {
  count: number;
}

function getEmptyMap<T>(referenceMap: Map<T, IRuleWithCount>): Map<T, number> {
  return new Map<T, number>(
    Array.from(referenceMap.entries()).map(([key]) => [key, 0])
  );
}

function incrementValue<T extends PieceType | TerrainType>(
  numberMap: Map<T, number>,
  key: T
): void {
  const oldValue = numberMap.get(key) ?? 0;
  numberMap.set(key, oldValue + 1);
}

function getCountDifferences<T extends PieceType | TerrainType>(
  expectedMap: Map<T, IRuleWithCount>,
  actualMap: Map<T, number>
): string[] {
  const errors: string[] = [];
  Array.from(expectedMap.entries()).forEach(([key, rule]) => {
    const actualCount = actualMap.get(key) ?? 0;
    const expectedCount = rule.count;
    if (actualCount !== expectedCount) {
      const suffix = expectedCount === 1 ? "" : "s";
      errors.push(
        `Should have ${expectedCount} ${key}${suffix} (has ${actualCount})`
      );
    }
  });
  return errors;
}
