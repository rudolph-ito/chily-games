import { expect } from "chai";
import { isValidSet } from "./set_helpers";
import { ITile, TileColor } from "../../shared/dtos/rummikub/tile";

interface IIsValidSetExample {
  tiles: ITile[];
  description: string;
  expectedResult: boolean;
}

const isValidSetExamples: IIsValidSetExample[] = [
  {
    tiles: [
      { rank: 1, color: TileColor.BLACK },
      { rank: 2, color: TileColor.BLACK },
      { rank: 3, color: TileColor.BLACK },
    ],
    description: "same color, run of 3",
    expectedResult: true,
  },
  {
    tiles: [
      { rank: 1, color: TileColor.BLACK },
      { rank: 2, color: TileColor.RED },
      { rank: 3, color: TileColor.YELLOW },
    ],
    description: "different color, run of 3",
    expectedResult: false,
  },
  {
    tiles: [
      { rank: 1, color: TileColor.BLACK },
      { rank: 1, color: TileColor.RED },
      { rank: 1, color: TileColor.YELLOW },
    ],
    description: "group, all different colors",
    expectedResult: true,
  },
  {
    tiles: [
      { rank: 1, color: TileColor.BLACK },
      { rank: 1, color: TileColor.RED },
      { rank: 1, color: TileColor.BLACK },
    ],
    description: "group, repeated color",
    expectedResult: false,
  },
];

describe("Rummikub SetHelpers", () => {
  describe("isValidSet", () => {
    isValidSetExamples.forEach((example) => {
      it(`returns ${example.expectedResult.toString()} for ${
        example.description
      }`, () => {
        // arrange

        // act
        const result = isValidSet(example.tiles);

        // assert
        expect(result).to.eql(example.expectedResult);
      });
    });
  });
});
