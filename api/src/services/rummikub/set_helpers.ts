import { valueOrDefault } from "../../shared/utilities/value_checker";
import { ITile } from "src/shared/dtos/rummikub/tile";
import { getTileRankNumber } from "./tile_helpers";

export function isValidSet(tiles: ITile[]): boolean {
  return isGroup(tiles) || isRun(tiles);
}

function isGroup(tiles: ITile[]): boolean {
  if (tiles.length < 3) {
    return false;
  }
  const nonJokers = tiles.filter((c) => !valueOrDefault(c.isJoker, false));
  const firstTile = nonJokers[0];
  return nonJokers.every((c) => c.rank === firstTile.rank);
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
        return false
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
