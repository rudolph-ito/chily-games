import { valueOrDefault } from "../../shared/utilities/value_checker";
import { ITile } from "../../shared/dtos/rummikub/tile";
import { getTileColorNumber, getTileRankNumber } from "./tile_helpers";

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
