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
const red2: ITile = { color: TileColor.RED, rank: 2 };
const red3: ITile = { color: TileColor.RED, rank: 3 };

const examples: Example[] = [
  {
    description: "no changes",
    input: {
      setsA: { sets: [red1, null], tilesAdded: [], remainingTiles: [] },
      setsB: { sets: [red1, null], tilesAdded: [], remainingTiles: [] },
    },
    output: {
      currentPlayerHandToSets: [],
      otherPlayerHandToSets: [],
      setsToCurrentPlayerHand: [],
      setsToOtherPlayerHand: [],
      withinSets: [],
      withinCurrentPlayerHand: [],
      setIndexesToClear: [],
      currentPlayerHandIndexesToClear: [],
    },
  },
  {
    description: "sets to current player hand",
    input: {
      setsA: {
        sets: [red1, null],
        tilesAdded: [red1],
        remainingTiles: [null, null],
      },
      setsB: {
        sets: [null, null],
        tilesAdded: [],
        remainingTiles: [null, red1],
      },
    },
    output: {
      currentPlayerHandToSets: [],
      otherPlayerHandToSets: [],
      setsToCurrentPlayerHand: [{ from: 0, to: 1 }],
      setsToOtherPlayerHand: [],
      withinSets: [],
      withinCurrentPlayerHand: [],
      setIndexesToClear: [0],
      currentPlayerHandIndexesToClear: [],
    },
  },
  {
    description: "sets to other player hand",
    input: {
      setsA: { sets: [red1, null], tilesAdded: [red1], remainingTiles: [] },
      setsB: { sets: [null, null], tilesAdded: [], remainingTiles: [] },
    },
    output: {
      currentPlayerHandToSets: [],
      otherPlayerHandToSets: [],
      setsToCurrentPlayerHand: [],
      setsToOtherPlayerHand: [{ from: 0 }],
      withinSets: [],
      withinCurrentPlayerHand: [],
      setIndexesToClear: [0],
      currentPlayerHandIndexesToClear: [],
    },
  },
  {
    description: "current player hand to sets",
    input: {
      setsA: {
        sets: [null, null],
        tilesAdded: [],
        remainingTiles: [red1, null],
      },
      setsB: {
        sets: [null, red1],
        tilesAdded: [red1],
        remainingTiles: [null, null],
      },
    },
    output: {
      currentPlayerHandToSets: [{ from: 0, to: 1 }],
      otherPlayerHandToSets: [],
      setsToCurrentPlayerHand: [],
      setsToOtherPlayerHand: [],
      withinSets: [],
      withinCurrentPlayerHand: [],
      setIndexesToClear: [],
      currentPlayerHandIndexesToClear: [0],
    },
  },
  {
    description: "other player hand to sets",
    input: {
      setsA: { sets: [null, null], tilesAdded: [], remainingTiles: [] },
      setsB: { sets: [null, red1], tilesAdded: [red1], remainingTiles: [] },
    },
    output: {
      currentPlayerHandToSets: [],
      otherPlayerHandToSets: [{ tile: red1, to: 1 }],
      setsToCurrentPlayerHand: [],
      setsToOtherPlayerHand: [],
      withinSets: [],
      withinCurrentPlayerHand: [],
      setIndexesToClear: [],
      currentPlayerHandIndexesToClear: [],
    },
  },
  {
    description: "other player hand to sets (2nd tile)",
    input: {
      setsA: {
        sets: [null, red1, null, null],
        tilesAdded: [red1],
        remainingTiles: [],
      },
      setsB: {
        sets: [null, red1, null, red2],
        tilesAdded: [red1, red2],
        remainingTiles: [],
      },
    },
    output: {
      currentPlayerHandToSets: [],
      otherPlayerHandToSets: [{ tile: red2, to: 3 }],
      setsToCurrentPlayerHand: [],
      setsToOtherPlayerHand: [],
      withinSets: [],
      withinCurrentPlayerHand: [],
      setIndexesToClear: [],
      currentPlayerHandIndexesToClear: [],
    },
  },
  {
    description: "within sets",
    input: {
      setsA: { sets: [red1, null], tilesAdded: [], remainingTiles: [] },
      setsB: { sets: [null, red1], tilesAdded: [], remainingTiles: [] },
    },
    output: {
      currentPlayerHandToSets: [],
      otherPlayerHandToSets: [],
      setsToCurrentPlayerHand: [],
      setsToOtherPlayerHand: [],
      withinSets: [{ from: 0, to: 1 }],
      withinCurrentPlayerHand: [],
      setIndexesToClear: [0],
      currentPlayerHandIndexesToClear: [],
    },
  },
  {
    description: "within sets (overlapping moves)",
    input: {
      setsA: { sets: [red1, red2, null], tilesAdded: [], remainingTiles: [] },
      setsB: { sets: [null, red1, red2], tilesAdded: [], remainingTiles: [] },
    },
    output: {
      currentPlayerHandToSets: [],
      otherPlayerHandToSets: [],
      setsToCurrentPlayerHand: [],
      setsToOtherPlayerHand: [],
      withinSets: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
      ],
      withinCurrentPlayerHand: [],
      setIndexesToClear: [0],
      currentPlayerHandIndexesToClear: [],
    },
  },
  {
    description: "within sets and within hand",
    input: {
      setsA: {
        sets: [red1, null, red2],
        tilesAdded: [],
        remainingTiles: [null, red3],
      },
      setsB: {
        sets: [red1, red2, null],
        tilesAdded: [],
        remainingTiles: [red3, null],
      },
    },
    output: {
      currentPlayerHandToSets: [],
      otherPlayerHandToSets: [],
      setsToCurrentPlayerHand: [],
      setsToOtherPlayerHand: [],
      withinSets: [{ from: 2, to: 1 }],
      withinCurrentPlayerHand: [{ from: 1, to: 0 }],
      setIndexesToClear: [2],
      currentPlayerHandIndexesToClear: [1],
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
