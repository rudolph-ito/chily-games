import { ITile, TileColor } from "src/app/shared/dtos/rummikub/tile";
import { findTilesIndexes } from "./tiles_helpers";

interface Example {
  description: string;
  input: {
    pool: ITile[];
    list: ITile[];
  };
  output: number[];
  focus?: boolean; // used to more easily test specific examples
}

let examples: Example[] = [
  {
    description: "single tile in list and pool",
    input: {
      pool: [{ rank: 1, color: TileColor.RED }],
      list: [{ rank: 1, color: TileColor.RED }],
    },
    output: [0],
  },
  {
    description: "single tile in list, middle of pool",
    input: {
      pool: [
        { rank: 1, color: TileColor.BLACK },
        { rank: 1, color: TileColor.RED },
        { rank: 1, color: TileColor.BLUE },
      ],
      list: [{ rank: 1, color: TileColor.RED }],
    },
    output: [1],
  },
  {
    description: "multiple tiles in list, middle of pool",
    input: {
      pool: [
        { rank: 1, color: TileColor.BLACK },
        { rank: 1, color: TileColor.RED },
        { rank: 1, color: TileColor.BLUE },
        { rank: 1, color: TileColor.YELLOW },
      ],
      list: [
        { rank: 1, color: TileColor.RED },
        { rank: 1, color: TileColor.YELLOW },
      ],
    },
    output: [1, 3],
  },
  {
    description: "single tile in list, duplicate in pool (returns first)",
    input: {
      pool: [
        { rank: 1, color: TileColor.BLACK },
        { rank: 1, color: TileColor.RED },
        { rank: 1, color: TileColor.RED },
      ],
      list: [{ rank: 1, color: TileColor.RED }],
    },
    output: [1],
  },
  {
    description: "duplicate tile in list, duplicate in pool (returns both)",
    input: {
      pool: [
        { rank: 1, color: TileColor.BLACK },
        { rank: 1, color: TileColor.RED },
        { rank: 1, color: TileColor.RED },
      ],
      list: [
        { rank: 1, color: TileColor.RED },
        { rank: 1, color: TileColor.RED },
      ],
    },
    output: [1, 2],
  },
];

const focused_examples = examples.filter((x) => x.focus);
if (focused_examples.length > 0) {
  if (process.env.CI) {
    throw new Error("Committed example focus. Please remove");
  }
  examples = focused_examples;
}

describe("findTilesIndexes", () => {
  for (const example of examples) {
    it(example.description, () => {
      // arrange

      // act
      const result = findTilesIndexes(example.input.pool, example.input.list);

      // assert
      expect(result).toEqual(example.output);
    });
  }
});
