import { IUpdateSets } from "src/app/shared/dtos/rummikub/game";
import { ITile } from "src/app/shared/dtos/rummikub/tile";
import { areTilesEqual } from "./tiles_helpers";

export interface IMoveChange {
  from: number;
  to: number;
}

export interface IMoveToOtherPlayerChange {
  from: number;
}

export interface IMoveFromOtherPlayerChange {
  tile: ITile;
  to: number;
}

export interface IUpdateSetsChanges {
  currentPlayerHandToSets: IMoveChange[];
  otherPlayerHandToSets: IMoveFromOtherPlayerChange[];
  setsToCurrentPlayerHand: IMoveChange[];
  setsToOtherPlayerHand: IMoveToOtherPlayerChange[];
  withinSets: IMoveChange[];
  withinCurrentPlayerHand: IMoveChange[];
  setIndexesToClear: number[];
  currentPlayerHandIndexesToClear: number[];
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
    currentPlayerHandToSets: [],
    otherPlayerHandToSets: [],
    setsToCurrentPlayerHand: [],
    setsToOtherPlayerHand: [],
    withinSets: [],
    withinCurrentPlayerHand: [],
    setIndexesToClear: [],
    currentPlayerHandIndexesToClear: [],
  };
  const tilesAddedChanges = getTilesAddedDifference(
    before.tilesAdded,
    after.tilesAdded
  );
  const boardIndexesWithNewTiles: number[] = [];
  const boardIndexesWithMovedTiles: number[] = [];
  for (let i = 0; i < before.sets.length; i++) {
    const beforeTile = before.sets[i];
    const afterTile = after.sets[i];
    if (beforeTile == null && afterTile != null) {
      boardIndexesWithNewTiles.push(i);
    }
    if (beforeTile != null && afterTile == null) {
      boardIndexesWithMovedTiles.push(i);
      result.setIndexesToClear.push(i);
    }
    if (
      beforeTile != null &&
      afterTile != null &&
      !areTilesEqual(beforeTile, afterTile)
    ) {
      boardIndexesWithNewTiles.push(i);
      boardIndexesWithMovedTiles.push(i);
    }
  }
  const handIndexesWithNewTiles: number[] = [];
  const handIndexesWithMovedTiles: number[] = [];
  for (let i = 0; i < before.remainingTiles.length; i++) {
    const beforeTile = before.remainingTiles[i];
    const afterTile = after.remainingTiles[i];
    if (beforeTile == null && afterTile != null) {
      handIndexesWithNewTiles.push(i);
    }
    if (beforeTile != null && afterTile == null) {
      handIndexesWithMovedTiles.push(i);
      result.currentPlayerHandIndexesToClear.push(i);
    }
    if (
      beforeTile != null &&
      afterTile != null &&
      !areTilesEqual(beforeTile, afterTile)
    ) {
      handIndexesWithNewTiles.push(i);
      handIndexesWithMovedTiles.push(i);
    }
  }

  for (let i = 0; i < boardIndexesWithNewTiles.length; i++) {
    const newTileIndex = boardIndexesWithNewTiles[i];
    const newTile = after.sets[newTileIndex];
    if (newTile == null) {
      throw Error("Unexpected null");
    }
    const remainingBoardIndexesWithMovedTiles =
      boardIndexesWithMovedTiles.slice();

    let withinBoard = false;
    let fromHand = false;
    for (let j = 0; j < remainingBoardIndexesWithMovedTiles.length; j++) {
      const movedTileIndex = remainingBoardIndexesWithMovedTiles[j];
      const movedTile = before.sets[movedTileIndex];
      if (movedTile == null) {
        throw Error("Unexpected null");
      }
      if (areTilesEqual(movedTile, newTile)) {
        result.withinSets.push({ from: movedTileIndex, to: newTileIndex });
        boardIndexesWithMovedTiles.splice(j, 1);
        withinBoard = true;
        break;
      }
    }

    if (!withinBoard) {
      if (
        before.remainingTiles.length == 0 &&
        after.remainingTiles.length == 0
      ) {
        const addedItem = tilesAddedChanges.added.find((x) =>
          areTilesEqual(x.tile, newTile)
        );
        if (addedItem != null && addedItem.count > 0) {
          addedItem.count -= 1;
          result.otherPlayerHandToSets.push({
            to: newTileIndex,
            tile: newTile,
          });
          fromHand = true;
        }
      } else {
        const remainingHandIndexesWithMovedTiles =
          handIndexesWithMovedTiles.slice();
        for (let j = 0; j < remainingHandIndexesWithMovedTiles.length; j++) {
          const movedTileIndex = remainingHandIndexesWithMovedTiles[j];
          const movedTile = before.remainingTiles[movedTileIndex];
          if (movedTile == null) {
            throw Error("Unexpected null");
          }
          if (areTilesEqual(movedTile, newTile)) {
            result.currentPlayerHandToSets.push({
              from: movedTileIndex,
              to: newTileIndex,
            });
            handIndexesWithMovedTiles.splice(j, 1);
            fromHand = true;
            break;
          }
        }
      }
    }

    if (!withinBoard && !fromHand) {
      throw new Error("Unexpected move");
    }
  }

  if (before.remainingTiles.length == 0 && after.remainingTiles.length == 0) {
    for (let i = 0; i < boardIndexesWithMovedTiles.length; i++) {
      const movedTileIndex = boardIndexesWithMovedTiles[i];
      const movedTile = before.sets[movedTileIndex];
      if (movedTile == null) {
        throw Error("Unexpected null");
      }

      const removedItem = tilesAddedChanges.removed.find((x) =>
        areTilesEqual(x.tile, movedTile)
      );
      if (removedItem != null && removedItem.count > 0) {
        removedItem.count -= 1;
        result.setsToOtherPlayerHand.push({ from: movedTileIndex });
      } else {
        throw new Error("Unexpected move");
      }
    }

    boardIndexesWithMovedTiles.splice(0, boardIndexesWithMovedTiles.length);
  }

  for (let i = 0; i < handIndexesWithNewTiles.length; i++) {
    const newTileIndex = handIndexesWithNewTiles[i];
    const newTile = after.remainingTiles[newTileIndex];
    if (newTile == null) {
      throw Error("Unexpected null");
    }
    let withinHand = false;
    let fromBoard = false;

    const remainingHandIndexesWithMovedTiles =
      handIndexesWithMovedTiles.slice();
    for (let j = 0; j < remainingHandIndexesWithMovedTiles.length; j++) {
      const movedTileIndex = remainingHandIndexesWithMovedTiles[j];
      const movedTile = before.remainingTiles[movedTileIndex];
      if (movedTile == null) {
        throw Error("Unexpected null");
      }
      if (areTilesEqual(movedTile, newTile)) {
        result.withinCurrentPlayerHand.push({
          from: movedTileIndex,
          to: newTileIndex,
        });
        handIndexesWithMovedTiles.splice(j, 1);
        withinHand = true;
        break;
      }
    }

    const remainingBoardIndexesWithMovedTiles =
      boardIndexesWithMovedTiles.slice();
    for (let j = 0; j < remainingBoardIndexesWithMovedTiles.length; j++) {
      const movedTileIndex = remainingBoardIndexesWithMovedTiles[j];
      const movedTile = before.sets[movedTileIndex];
      if (movedTile == null) {
        throw Error("Unexpected null");
      }

      if (areTilesEqual(movedTile, newTile)) {
        result.setsToCurrentPlayerHand.push({
          from: movedTileIndex,
          to: newTileIndex,
        });
        boardIndexesWithMovedTiles.splice(j, 1);
        fromBoard = true;
        break;
      }
    }

    if (!withinHand && !fromBoard) {
      throw new Error("Unexpected move");
    }
  }

  if (boardIndexesWithMovedTiles.length > 0) {
    throw new Error("Unaccounted for board index with moved tile");
  }
  if (handIndexesWithMovedTiles.length > 0) {
    throw new Error("Unaccounted for hand index with moved tile");
  }

  return result;
}
