import { ITile } from "src/shared/dtos/rummikub/tile";
import { valueOrDefault } from "src/shared/utilities/value_checker";
import { getTileRankNumber } from "./tile_helpers";

const JOKER_SCORE_VALUE = 30;

export function getTilesScore(tiles: ITile[]): number {
  return tiles.reduce((sum: number, tile: ITile) => {
    const tileValue = valueOrDefault(tile.isJoker, false)
      ? JOKER_SCORE_VALUE
      : getTileRankNumber(tile);
    return sum + tileValue;
  }, 0);
}
