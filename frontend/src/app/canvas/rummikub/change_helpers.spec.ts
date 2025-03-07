import { IUpdateSets } from "src/app/shared/dtos/rummikub/game";
import { computeUpdateSetsChanges, IUpdateSetsChanges } from "./change_helpers";
import { ITile, TileColor } from "src/app/shared/dtos/rummikub/tile";

interface Example {
  description: string;
  input: {
    setsA: IUpdateSets;
    setsB: IUpdateSets;
  };
  output: IUpdateSetsChanges;
}

const red1: ITile = { color: TileColor.RED, rank: 1 };

const examples: Example[] = [
  {
    description: "empty no changes",
    input: {
      setsA: { sets: [], tilesAdded: [], remainingTiles: [] },
      setsB: { sets: [], tilesAdded: [], remainingTiles: [] },
    },
    output: {
      withinBoard: [],
      fromBoardToHand: [],
      fromHandToBoard: [],
    },
  },
  {
    description: "from hand to board",
    input: {
      setsA: { sets: [null, null], tilesAdded: [], remainingTiles: [] },
      setsB: { sets: [null, [red1]], tilesAdded: [red1], remainingTiles: [] },
    },
    output: {
      withinBoard: [],
      fromBoardToHand: [],
      fromHandToBoard: [{ tile: red1, to: 1 }],
    },
  },
  {
    description: "within board",
    input: {
      setsA: { sets: [[red1], null], tilesAdded: [], remainingTiles: [] },
      setsB: { sets: [null, [red1]], tilesAdded: [], remainingTiles: [] },
    },
    output: {
      withinBoard: [{ from: 0, to: 1 }],
      fromBoardToHand: [],
      fromHandToBoard: [],
    },
  },
  {
    description: "from board to hand",
    input: {
      setsA: { sets: [[red1], null], tilesAdded: [red1], remainingTiles: [] },
      setsB: { sets: [null, null], tilesAdded: [], remainingTiles: [] },
    },
    output: {
      withinBoard: [],
      fromBoardToHand: [{ from: 0 }],
      fromHandToBoard: [],
    },
  },
];

describe("computeUpdateSetsChanges", () => {
  for (const example of examples) {
    it(example.description, () => {
      // arrange

      // act
      const result = computeUpdateSetsChanges(
        example.input.setsA,
        example.input.setsB
      );

      // assert
      expect(result).toEqual(example.output);
    });
  }
});
