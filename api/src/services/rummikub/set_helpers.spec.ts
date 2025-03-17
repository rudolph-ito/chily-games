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
    description: "run, 3 tiles, same color (no jokers)",
    expectedResult: true,
  },
  {
    tiles: [
      { rank: 1, color: TileColor.BLACK },
      { isJoker: true },
      { rank: 3, color: TileColor.BLACK },
    ],
    description: "run, 3 tiles, same color (one joker in middle)",
    expectedResult: true,
  },
  {
    tiles: [
      { isJoker: true },
      { rank: 2, color: TileColor.BLACK },
      { rank: 3, color: TileColor.BLACK },
    ],
    description: "run, 3 tiles, same color (one joker on end)",
    expectedResult: true,
  },
  {
    tiles: [
      { rank: 1, color: TileColor.BLACK },
      { rank: 2, color: TileColor.RED },
      { rank: 3, color: TileColor.YELLOW },
    ],
    description: "run, 3 tiles, different colors",
    expectedResult: false,
  },
  {
    tiles: [
      { rank: 1, color: TileColor.BLACK },
      { isJoker: true },
      { isJoker: true },
      { rank: 4, color: TileColor.BLACK },
    ],
    description: "run, 4 tiles, same color (multiple jokers in middle)",
    expectedResult: true,
  },
  {
    tiles: [
      { rank: 1, color: TileColor.BLACK },
      { rank: 1, color: TileColor.RED },
    ],
    description: "group, 2 tiles",
    expectedResult: false,
  },
  {
    tiles: [
      { rank: 1, color: TileColor.BLACK },
      { rank: 1, color: TileColor.RED },
      { rank: 1, color: TileColor.YELLOW },
    ],
    description: "group, 3 tiles, all different colors (no jokers)",
    expectedResult: true,
  },
  {
    tiles: [
      { rank: 1, color: TileColor.BLACK },
      { rank: 1, color: TileColor.RED },
      { isJoker: true },
    ],
    description: "group, 3 tiles, all different colors (one joker)",
    expectedResult: true,
  },
  {
    tiles: [
      { rank: 1, color: TileColor.BLACK },
      { rank: 1, color: TileColor.RED },
      { rank: 1, color: TileColor.YELLOW },
      { rank: 1, color: TileColor.BLUE },
    ],
    description: "group, 4 tiles, all different colors (no jokers)",
    expectedResult: true,
  },
  {
    tiles: [
      { rank: 1, color: TileColor.BLACK },
      { rank: 1, color: TileColor.RED },
      { rank: 1, color: TileColor.YELLOW },
      { rank: 1, color: TileColor.BLUE },
      { isJoker: true },
    ],
    description: "group, 5 tiles, all different colors (one joker)",
    expectedResult: false,
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
      it(`${
        example.description
      } returns ${example.expectedResult.toString()}`, () => {
        // arrange

        // act
        const result = isValidSet(example.tiles);

        // assert
        expect(result).toEqual(example.expectedResult);
      });
    });
  });
});
