import { TileColor, ITile } from "../../shared/dtos/rummikub/tile";
import shuffle from "knuth-shuffle-seeded";
import { valueOrDefault } from "../../shared/utilities/value_checker";
import { setSymmetricDifference } from "../shared/set_helpers";

const NUMBER_OF_COLORS = 4;
const NUMBER_OF_TILES_PER_COLOR = 13;
const NUMBER_OF_NON_JOKER_TILES = NUMBER_OF_COLORS * NUMBER_OF_TILES_PER_COLOR;
const MAX_JOKER_COUNT = 3;

export function getTileRankNumber(tile: ITile): number {
  if (tile.rank == null) {
    throw new Error("Expected tile rank to be defined");
  }
  return tile.rank;
}

const colorToNumber = {
  [TileColor.BLACK]: 0,
  [TileColor.RED]: 1,
  [TileColor.YELLOW]: 2,
  [TileColor.BLUE]: 3,
};

export function getTileColorNumber(tile: ITile): number {
  if (tile.color == null) {
    throw new Error("Expected card suit to be defined");
  }
  return colorToNumber[tile.color];
}

const numberToColor = {};
Object.keys(colorToNumber).forEach(
  (key) => (numberToColor[colorToNumber[key]] = key)
);

export function serializeTile(tile: ITile): number {
  if (valueOrDefault(tile.isJoker, false)) {
    if (tile.jokerNumber == null) {
      throw new Error("Card missing joker number");
    }
    return NUMBER_OF_NON_JOKER_TILES + tile.jokerNumber - 1;
  }
  return (
    getTileRankNumber(tile) -
    1 +
    NUMBER_OF_TILES_PER_COLOR * getTileColorNumber(tile)
  );
}

export function deserializeTile(tileNumber: number): ITile {
  if (tileNumber >= NUMBER_OF_NON_JOKER_TILES) {
    return {
      isJoker: true,
      jokerNumber: tileNumber - NUMBER_OF_NON_JOKER_TILES + 1,
    };
  }
  const rankNumber = (tileNumber % NUMBER_OF_TILES_PER_COLOR) + 1;
  const colorNumber = Math.floor(tileNumber / NUMBER_OF_TILES_PER_COLOR);
  return { rank: rankNumber, color: numberToColor[colorNumber] };
}

export function areTilesEqual(a: ITile, b: ITile): boolean {
  if (valueOrDefault(a.isJoker, false)) {
    return valueOrDefault(b.isJoker, false) && a.jokerNumber === b.jokerNumber;
  }
  return a.rank === b.rank && a.color === b.color;
}

export interface StandardTileOptions {
  useExpansion: boolean;
}

export function standardTiles(options: StandardTileOptions): ITile[] {
  const deck: ITile[] = [];
  // colored numbers
  const coloredNumberCount = options.useExpansion ? 3 : 2;
  for (let i = 0; i < coloredNumberCount; i++) {
    for (let i = 0; i < NUMBER_OF_NON_JOKER_TILES; i++) {
      deck.push(deserializeTile(i));
    }
  }
  // jokers
  const jokerCount = options.useExpansion ? 4 : 2;
  for (let i = 0; i < jokerCount; i++) {
    deck.push(deserializeTile(NUMBER_OF_NON_JOKER_TILES + i));
  }
  shuffle(deck);
  return deck;
}

export function areTileSetsEquivalent(
  tilesA: ITile[],
  tilesB: ITile[]
): boolean {
  const countsA = getSerializedTileCounts(tilesA);
  const countsB = getSerializedTileCounts(tilesB);
  const uniqueTilesA = new Set(Object.keys(countsA));
  const uniqueTilesB = new Set(Object.keys(countsB));
  if (setSymmetricDifference(uniqueTilesA, uniqueTilesB).size !== 0) {
    return false;
  }
  return Array.from(uniqueTilesA).every((x) => countsA[x] == countsB[x]);
}

export function getSerializedTileCounts(
  tiles: ITile[]
): Record<number, number> {
  const counts: Record<number, number> = {};
  for (let i = 0; i < NUMBER_OF_NON_JOKER_TILES + MAX_JOKER_COUNT; i++) {
    counts[i] = 0;
  }
  tiles.forEach((tile) => {
    const serialzed = serializeTile(tile);
    counts[serialzed] += 1;
  });
  return counts;
}
