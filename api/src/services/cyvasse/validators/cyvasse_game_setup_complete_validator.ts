import { doesHaveValue } from "../../../shared/utilities/value_checker";
import { CyvasseCoordinateMap } from "../game/storage/cyvasse_coordinate_map";
import { PieceType, IPieceRule } from "../../../shared/dtos/piece_rule";
import { TerrainType, ITerrainRule } from "../../../shared/dtos/terrain_rule";

export interface IValidateGameSetupCompleteOptions {
  coordinateMap: CyvasseCoordinateMap;
  pieceRuleMap: Map<PieceType, IPieceRule>;
  terrainRuleMap: Map<TerrainType, ITerrainRule>;
}

export function validateGameSetupComplete(
  options: IValidateGameSetupCompleteOptions
): string {
  const currentPieceTypeCounts = getEmptyMap(options.pieceRuleMap);
  const currentTerrainTypeCounts = getEmptyMap(options.terrainRuleMap);
  options.coordinateMap.serialize().forEach(({ value: { piece, terrain } }) => {
    if (doesHaveValue(piece)) {
      const { pieceTypeId } = piece;
      currentPieceTypeCounts.set(
        pieceTypeId,
        currentPieceTypeCounts.get(pieceTypeId) + 1
      );
    }
    if (doesHaveValue(terrain)) {
      const { terrainTypeId } = terrain;
      currentTerrainTypeCounts.set(
        terrainTypeId,
        currentTerrainTypeCounts.get(terrainTypeId) + 1
      );
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

function getCountDifferences<T>(
  expectedMap: Map<T, IRuleWithCount>,
  actualMap: Map<T, number>
): string[] {
  const errors = [];
  Array.from(expectedMap.entries()).forEach(([key, rule]) => {
    const actualCount = actualMap.get(key);
    const expectedCount = rule.count;
    if (actualCount !== expectedCount) {
      const suffix = expectedCount === 1 ? "" : "s";
      errors.push(
        `Should have ${expectedCount} ${key.toString()}${suffix} (has ${actualCount})` // eslint-disable-line @typescript-eslint/no-base-to-string
      );
    }
  });
  return errors;
}
