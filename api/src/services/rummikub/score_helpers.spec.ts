import { getTilesScore } from "./score_helpers";
import { ITile, TileColor } from "../../shared/dtos/rummikub/tile";

interface IGetTileScoreExample {
  tiles: ITile[];
  description: string;
  expectedResult: number;
}

const getTilesScoreExamples: IGetTileScoreExample[] = [
  {
    tiles: [],
    description: "no tiles",
    expectedResult: 0,
  },
  {
    tiles: [
      { rank: 3, color: TileColor.BLACK },
      { rank: 6, color: TileColor.RED },
      { rank: 11, color: TileColor.BLUE },
    ],
    description: "various tiles (without joker)",
    expectedResult: 20,
  },
  {
    tiles: [
      { isJoker: true },
      { rank: 5, color: TileColor.BLACK },
      { rank: 8, color: TileColor.YELLOW },
    ],
    description: "various tiles (without joker)",
    expectedResult: 43,
  },
];

describe("Rummikub ScoreHelpers", () => {
  describe("getTileScores", () => {
    getTilesScoreExamples.forEach((example) => {
      it(`${
        example.description
      } returns ${example.expectedResult.toString()}`, () => {
        // arrange

        // act
        const result = getTilesScore(example.tiles);

        // assert
        expect(result).toEqual(example.expectedResult);
      });
    });
  });
});
