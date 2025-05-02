import { ITile } from "src/app/shared/dtos/rummikub/tile";

export function areTilesEqual(a: ITile, b: ITile): boolean {
  return (
    a.rank == b.rank &&
    a.color == b.color &&
    a.isJoker == b.isJoker &&
    a.jokerNumber == b.jokerNumber
  );
}

export function findTilesIndexes(pool: ITile[], list: ITile[]): number[] {
  const indexes: number[] = [];
  for (let i = 0; i < list.length; i++) {
    const tile = list[i];
    const index = pool.findIndex(
      (x, j) => areTilesEqual(x, tile) && !indexes.includes(j)
    );
    if (index == -1) {
      throw new Error("Unexpected tile not found");
    }
    indexes.push(index);
  }
  return indexes;
}
