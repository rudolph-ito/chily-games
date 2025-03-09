import { ITile } from "src/app/shared/dtos/rummikub/tile";

export function areTilesEqual(a: ITile, b: ITile): boolean {
  return (
    a.rank == b.rank &&
    a.color == b.color &&
    a.isJoker == b.isJoker &&
    a.jokerNumber == b.jokerNumber
  );
}
