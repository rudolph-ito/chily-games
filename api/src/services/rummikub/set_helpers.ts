import { valueOrDefault } from "../../shared/utilities/value_checker";
import { ITile } from "../../shared/dtos/rummikub/tile";
import {
  getTileColorNumber,
  getTileRankNumber,
  serializeTile,
} from "./tile_helpers";
import { ISets } from "src/shared/dtos/rummikub/game";

export function isValidSet(tiles: ITile[]): boolean {
  return isGroup(tiles) || isRun(tiles);
}

function isGroup(tiles: ITile[]): boolean {
  if (tiles.length != 3 && tiles.length != 4) {
    return false;
  }
  const nonJokers = tiles.filter((c) => !valueOrDefault(c.isJoker, false));
  const colors = new Set<number>();
  const ranks = new Set<number>();
  for (const tile of nonJokers) {
    colors.add(getTileColorNumber(tile));
    ranks.add(getTileRankNumber(tile));
  }
  return ranks.size == 1 && colors.size == nonJokers.length;
}

function isRun(tiles: ITile[]): boolean {
  if (tiles.length < 3) {
    return false;
  }

  const normalizedTiles = removeLeadingAndTrailingJokers(tiles);

  const firstTile = normalizedTiles[0];
  const isSameColor = normalizedTiles.every(
    (c) => valueOrDefault(c.isJoker, false) || c.color === firstTile.color
  );
  if (!isSameColor) {
    return false;
  }

  let lastRankNumber = getTileRankNumber(firstTile);
  let expectedRankDiff = 1;
  for (const tile of normalizedTiles.slice(1)) {
    if (valueOrDefault(tile.isJoker, false)) {
      expectedRankDiff += 1;
    } else {
      const rankNumber = getTileRankNumber(tile);
      if (tile.rank !== lastRankNumber + expectedRankDiff) {
        return false;
      }
      lastRankNumber = rankNumber;
      expectedRankDiff = 1;
    }
  }
  return true;
}

function removeLeadingAndTrailingJokers(tiles: ITile[]): ITile[] {
  const newTiles = tiles.slice();
  while (newTiles.length > 0 && valueOrDefault(newTiles[0].isJoker, false)) {
    newTiles.shift();
  }
  while (
    newTiles.length > 0 &&
    valueOrDefault(newTiles[newTiles.length - 1].isJoker, false)
  ) {
    newTiles.pop();
  }
  return newTiles;
}

export function isOnlyAddingNewSets(
  initialSets: ISets,
  updatedSets: ISets
): boolean {
  const initialSetCounts = getSetCounts(initialSets);
  const updatedSetCounts = getSetCounts(updatedSets);
  const setCountsDiff = getSetCountsDiff(initialSetCounts, updatedSetCounts);
  for (const x in setCountsDiff) {
    if (setCountsDiff[x] < 0) {
      return false;
    }
  }
  return true;
}

function getSetCounts(sets: ISets): Record<string, number> {
  const result: Record<string, number> = {};
  for (let i = 0; i < sets.length; i++) {
    const tiles = sets[i];
    if (tiles != null) {
      const id = tiles.map((x) => serializeTile(x)).join("|");
      if (result[id] == null) {
        result[id] = 0;
      }
      result[id] += 1;
    }
  }
  return result;
}

function getSetCountsDiff(
  count1: Record<string, number>,
  count2: Record<string, number>
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const x in count1) {
    if (count2[x] == null) {
      result[x] = -1 * count1[x];
    } else {
      result[x] = count2[x] - count1[x];
    }
  }
  for (const x in count2) {
    if (count1[x] == null) {
      result[x] = count2[x];
    }
  }
  return result;
}
