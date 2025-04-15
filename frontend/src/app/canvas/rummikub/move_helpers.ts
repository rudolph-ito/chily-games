export interface AttemptMoveGroupInput<T> {
  list: (T | null)[];
  rowSize: number;
  firstItemOldIndex: number;
  firstItemNewIndex: number;
  groupSize: number;
}

export interface AttemptMoveGroupOutput<T> {
  list: (T | null)[];
  success: boolean;
}

export function attemptMoveGroup<T>({
  list,
  rowSize,
  firstItemOldIndex,
  firstItemNewIndex,
  groupSize,
}: AttemptMoveGroupInput<T>): AttemptMoveGroupOutput<T> {
  let spaceWithinRow = true;
  const addEmptyBeforeDisplaced = list[firstItemNewIndex] == null;
  let currentDisplacedGroupIndexes: number[] = [];
  const displacedGroups: number[][] = [];
  for (let i = 0; i < groupSize; i++) {
    const index = firstItemNewIndex + i;
    if (i != 0 && index % rowSize == 0) {
      spaceWithinRow = false;
      break;
    }
    if (index < firstItemOldIndex || index >= firstItemOldIndex + groupSize) {
      if (list[index] != null) {
        currentDisplacedGroupIndexes.push(index);
      } else {
        if (currentDisplacedGroupIndexes.length > 0) {
          displacedGroups.push(currentDisplacedGroupIndexes);
          currentDisplacedGroupIndexes = [];
        }
      }
    }
  }
  if (!spaceWithinRow) {
    return { list: [], success: false };
  }
  // If any displacement, continue calculating until reach end of row or have sufficient room
  if (displacedGroups.length > 0 || currentDisplacedGroupIndexes.length > 0) {
    for (
      let index = firstItemNewIndex + groupSize;
      index % rowSize != 0;
      index++
    ) {
      if (list[index] != null) {
        if (
          index < firstItemOldIndex ||
          index >= firstItemOldIndex + groupSize
        ) {
          currentDisplacedGroupIndexes.push(index);
        }
      } else {
        if (currentDisplacedGroupIndexes.length > 0) {
          displacedGroups.push(currentDisplacedGroupIndexes);
          currentDisplacedGroupIndexes = [];
        }
        const displacedItemLength =
          (displacedGroups.length > 0 && addEmptyBeforeDisplaced ? 1 : 0) +
          displacedGroups.reduce((sum, x) => sum + x.length + 1, 0);
        if (
          firstItemNewIndex + (groupSize - 1) + displacedItemLength ==
          index
        ) {
          // Have sufficient empty space to account for displacemnt
          break;
        }
      }
    }
    if (currentDisplacedGroupIndexes.length > 0) {
      displacedGroups.push(currentDisplacedGroupIndexes);
    }
  }
  const displacedItemLength =
    (displacedGroups.length > 0 && addEmptyBeforeDisplaced ? 1 : 0) +
    displacedGroups.reduce((sum, x) => sum + x.length + 1, 0) -
    1; // don't need trailing space
  if (
    (firstItemNewIndex % rowSize) + (groupSize - 1) + displacedItemLength >=
    rowSize
  ) {
    return { list: [], success: false };
  }
  const outputList = list.slice();
  for (let i = 0; i < groupSize; i++) {
    outputList[firstItemNewIndex + i] = list[firstItemOldIndex + i];
  }
  let nextDisplacedItemIndex = firstItemNewIndex + groupSize;
  for (let i = 0; i < displacedGroups.length; i++) {
    if (i != 0 || addEmptyBeforeDisplaced) {
      outputList[nextDisplacedItemIndex] = null;
      nextDisplacedItemIndex += 1;
    }
    for (let j = 0; j < displacedGroups[i].length; j++) {
      outputList[nextDisplacedItemIndex] = list[displacedGroups[i][j]];
      nextDisplacedItemIndex += 1;
    }
  }
  for (let i = 0; i < groupSize; i++) {
    const indexToClear = firstItemOldIndex + i;
    if (
      indexToClear < firstItemNewIndex ||
      indexToClear >= nextDisplacedItemIndex
    ) {
      outputList[indexToClear] = null;
    }
  }
  return { list: outputList, success: true };
}
