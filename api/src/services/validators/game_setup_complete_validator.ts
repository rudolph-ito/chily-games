import { doesHaveValue } from "../../shared/utilities/value_checker";
import { CoordinateMap } from "../game/storage/coordinate_map";
import { PieceType } from "../../shared/dtos/piece_rule";
import { TerrainType } from "../../shared/dtos/terrain_rule";

export interface IValidateGameSetupCompleteOptions {
  coordinateMap: CoordinateMap;
  pieceTypeCountMap: Map<PieceType, number>;
  terrainTypeCountMap: Map<TerrainType, number>;
}

export function validateGameSetupComplete(
  options: IValidateGameSetupCompleteOptions
): string {
  const currentPieceTypeCounts = getEmptyMap(options.pieceTypeCountMap);
  const currentTerrainTypeCounts = getEmptyMap(options.terrainTypeCountMap);
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
    options.pieceTypeCountMap,
    currentPieceTypeCounts
  ).concat(
    getCountDifferences(options.terrainTypeCountMap, currentTerrainTypeCounts)
  );
  if (errors.length > 0) {
    return errors.join(", ");
  }
  return null;
}

function getEmptyMap<T>(referenceMap: Map<T, number>): Map<T, number> {
  return new Map<T, number>(
    Array.from(referenceMap.entries()).map(([key]) => [key, 0])
  );
}

function getCountDifferences<T>(
  expectedMap: Map<T, number>,
  actualMap: Map<T, number>
): string[] {
  const errors = [];
  Array.from(expectedMap.entries()).forEach(([key, expectedCount]) => {
    const actualCount = actualMap.get(key);
    if (actualCount !== expectedCount) {
      const suffix = expectedCount === 1 ? "" : "s";
      errors.push(
        `Should have ${expectedCount} ${key.toString()}${suffix} (has ${actualCount})` // eslint-disable-line @typescript-eslint/no-base-to-string
      );
    }
  });
  return errors;
}
