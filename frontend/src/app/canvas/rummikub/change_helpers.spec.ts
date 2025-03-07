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
    description: "empty no changes",
    input: {
      setsA: { sets: [], tilesAdded: [], remainingTiles: [] },
      setsB: { sets: [], tilesAdded: [], remainingTiles: [] },
    },
    output: {
      withinBoard: [],
      fromBoardToHandOtherPlayer: [],
      fromHandToBoardCurrentPlayer: [],
      fromHandToBoard: [],
      withinHand: []
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
      fromBoardToHandOtherPlayer: [],
      fromHandToBoardCurrentPlayer: [],
      fromHandToBoard: [{ tile: red1, to: 1 }],
      withinHand: []
    },
  },
  {
    description: "from hand to board (2nd tile)",
    input: {
      setsA: { sets: [null, [red1], null, null], tilesAdded: [red1], remainingTiles: [] },
      setsB: { sets: [null, [red1], null, [red2]], tilesAdded: [red1, red2], remainingTiles: [] },
    },
    output: {
      withinBoard: [],
      fromBoardToHandOtherPlayer: [],
      fromHandToBoardCurrentPlayer: [],
      fromHandToBoard: [{ tile: red2, to: 3 }],
      withinHand: [],
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
      fromBoardToHandOtherPlayer: [],
      fromHandToBoardCurrentPlayer: [],
      fromHandToBoard: [],
      withinHand: []
    },
  },
  {
    description: "from board to hand (other player)",
    input: {
      setsA: { sets: [[red1], null], tilesAdded: [red1], remainingTiles: [] },
      setsB: { sets: [null, null], tilesAdded: [], remainingTiles: [] },
    },
    output: {
      withinBoard: [],
      fromBoardToHandOtherPlayer: [{ from: 0 }],
      fromHandToBoardCurrentPlayer: [],
      fromHandToBoard: [],
      withinHand: [],
    },
  },
  {
    description: "from board to hand (current player)",
    input: {
      setsA: { sets: [[red1], null], tilesAdded: [red1], remainingTiles: [null, null] },
      setsB: { sets: [null, null], tilesAdded: [], remainingTiles: [null, red1] },
    },
    output: {
      withinBoard: [],
      fromBoardToHandOtherPlayer: [],
      fromHandToBoardCurrentPlayer: [{ fromBoardIndex: 0, toHandIndex: 1}],
      fromHandToBoard: [],
      withinHand: [],
    },
  },
  {
    description: "within board, within hand",
    input: {
      setsA: { sets: [[red1], null, [red2]], tilesAdded: [], remainingTiles: [null, red3] },
      setsB: { sets: [[red1, red2], null], tilesAdded: [], remainingTiles: [red3, null] },
    },
    output: {
      withinBoard: [{from: 2, to: 1}],
      fromBoardToHandOtherPlayer: [],
      fromHandToBoardCurrentPlayer: [],
      fromHandToBoard: [],
      withinHand: [{from: 1, to: 0}]
    }
  }
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
