import { IUpdateSets } from "src/app/shared/dtos/rummikub/game";
import { ITile } from "src/app/shared/dtos/rummikub/tile";
import { areTilesEqual } from "./tiles_helpers";

export interface IUpdateSetsWithinBoardChange {
  from: number;
  to: number;
}

export interface IUpdateSetsFromBoardToHandChange {
  from: number;
}

export interface IUpdateSetsFromHandToBoardChange {
  tile: ITile;
  to: number;
}

export interface IUpdateSetsChanges {
  withinBoard: IUpdateSetsWithinBoardChange[];
  fromBoardToHand: IUpdateSetsFromBoardToHandChange[];
  fromHandToBoard: IUpdateSetsFromHandToBoardChange[];
}

interface ITileCountData {
  tile: ITile;
  count: number;
}

interface ITilesAddedChanges {
  added: ITileCountData[];
  removed: ITileCountData[];
}

function getTileId(tile: ITile): string {
  if (tile.color != null && tile.rank != null) {
    return `${tile.color} ${tile.rank}`;
  }
  if (tile.jokerNumber != null) {
    return `joker-${tile.jokerNumber}`;
  }
  throw Error(`Tile has unexpected properties: ${JSON.stringify(tile)}`);
}

function getTileCount(tiles: ITile[]): Record<string, ITileCountData> {
  const count: Record<string, ITileCountData> = {};
  for (const tile of tiles) {
    const tileId = getTileId(tile);
    if (count[tileId] == null) {
      count[tileId] = { tile, count: 0 };
    }
    count[tileId].count += 1;
  }
  return count;
}

function getTilesAddedDifference(
  beforeTilesAdded: ITile[],
  afterTilesAdded: ITile[]
): ITilesAddedChanges {
  const beforeCount = getTileCount(beforeTilesAdded);
  const afterCount = getTileCount(afterTilesAdded);
  const result: ITilesAddedChanges = { added: [], removed: [] };
  for (const id in beforeCount) {
    if (afterCount[id] == null) {
      result.removed.push(beforeCount[id]);
    } else if (afterCount[id].count > beforeCount[id].count) {
      result.added.push({
        tile: beforeCount[id].tile,
        count: afterCount[id].count - beforeCount[id].count,
      });
    } else if (afterCount[id].count < beforeCount[id].count) {
      result.removed.push({
        tile: beforeCount[id].tile,
        count: beforeCount[id].count - afterCount[id].count,
      });
    }
  }
  for (const id in afterCount) {
    if (beforeCount[id] == null) {
      result.added.push(afterCount[id]);
    }
  }
  return result;
}

export function computeUpdateSetsChanges(
  before: IUpdateSets,
  after: IUpdateSets
): IUpdateSetsChanges {
  const result: IUpdateSetsChanges = {
    withinBoard: [],
    fromHandToBoard: [],
    fromBoardToHand: [],
  };
  const beforeBoardTiles = before.sets.flatMap((x) => (x == null ? [null] : x));
  const afterBoardTiles = after.sets.flatMap((x) => (x == null ? [null] : x));
  const tilesAddedChanges = getTilesAddedDifference(
    before.tilesAdded,
    after.tilesAdded
  );
  const boardIndexesWithNewTiles: number[] = [];
  const boardIndexesWithMovedTiles: number[] = [];
  for (let i = 0; i < beforeBoardTiles.length; i++) {
    const beforeTile = beforeBoardTiles[i];
    const afterTile = afterBoardTiles[i];
    if (beforeTile == null && afterTile != null) {
      boardIndexesWithNewTiles.push(i);
    }
    if (beforeTile != null && afterTile == null) {
      boardIndexesWithMovedTiles.push(i);
    }
    if (
      beforeTile != null &&
      afterTile != null &&
      !this.areTilesEqual(beforeTile, afterTile)
    ) {
      boardIndexesWithNewTiles.push(i);
      boardIndexesWithMovedTiles.push(i);
    }
  }

  for (let i = 0; i < boardIndexesWithNewTiles.length; i++) {
    const newTileIndex = boardIndexesWithNewTiles[i];
    const newTile = afterBoardTiles[newTileIndex];
    if (newTile == null) {
      throw Error("Unexpected null");
    }
    const remainingBoardIndexesWithMovedTiles =
      boardIndexesWithMovedTiles.slice();

    let withinBoard = false;
    let fromHand = false;
    for (let j = 0; j < remainingBoardIndexesWithMovedTiles.length; j++) {
      const movedTileIndex = remainingBoardIndexesWithMovedTiles[j];
      const movedTile = beforeBoardTiles[movedTileIndex];
      if (movedTile == null) {
        throw Error("Unexpected null");
      }
      if (areTilesEqual(movedTile, newTile)) {
        result.withinBoard.push({ from: movedTileIndex, to: newTileIndex });
        boardIndexesWithMovedTiles.splice(j, 1);
        withinBoard = true;
        break;
      }
    }

    if (!withinBoard) {
      const addedItem = tilesAddedChanges.added.find((x) =>
        areTilesEqual(x.tile, newTile)
      );
      if (addedItem != null && addedItem.count > 0) {
        addedItem.count -= 1;
        result.fromHandToBoard.push({ to: newTileIndex, tile: newTile });
        fromHand = true;
      }
    }

    if (!withinBoard && !fromHand) {
      throw new Error("Unexpected move");
    }
  }

  for (let i = 0; i < boardIndexesWithMovedTiles.length; i++) {
    const movedTileIndex = boardIndexesWithMovedTiles[i];
    const movedTile = beforeBoardTiles[movedTileIndex];
    if (movedTile == null) {
      throw Error("Unexpected null");
    }

    const removedItem = tilesAddedChanges.removed.find((x) =>
      areTilesEqual(x.tile, movedTile)
    );
    if (removedItem != null && removedItem.count > 0) {
      removedItem.count -= 1;
      result.fromBoardToHand.push({ from: movedTileIndex });
    } else {
      throw new Error("Unexpected move");
    }
  }

  return result;
}
