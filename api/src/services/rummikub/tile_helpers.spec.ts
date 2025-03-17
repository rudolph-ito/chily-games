import { deserializeTile, serializeTile } from "./tile_helpers";
import { ITile, TileColor } from "../../shared/dtos/rummikub/tile";

interface ISerializationExample {
  description: string;
  input: number;
  output: ITile;
}

const serializationExamples: ISerializationExample[] = [
  {
    description: "black 1",
    input: 0,
    output: { rank: 1, color: TileColor.BLACK },
  },
  {
    description: "black 13",
    input: 12,
    output: { rank: 13, color: TileColor.BLACK },
  },
  {
    description: "red 1",
    input: 13,
    output: { rank: 1, color: TileColor.RED },
  },
  {
    description: "red 13",
    input: 25,
    output: { rank: 13, color: TileColor.RED },
  },
  {
    description: "yellow 1",
    input: 26,
    output: { rank: 1, color: TileColor.YELLOW },
  },
  {
    description: "yellow 13",
    input: 38,
    output: { rank: 13, color: TileColor.YELLOW },
  },
  {
    description: "blue 1",
    input: 39,
    output: { rank: 1, color: TileColor.BLUE },
  },
  {
    description: "blue 13",
    input: 51,
    output: { rank: 13, color: TileColor.BLUE },
  },
  {
    description: "joker 1",
    input: 52,
    output: { isJoker: true, jokerNumber: 1 },
  },
  {
    description: "joker 2",
    input: 53,
    output: { isJoker: true, jokerNumber: 2 },
  },
];

describe("Rummikub TileHelpers", () => {
  describe("deserializeTile / serializeTile", () => {
    serializationExamples.forEach((example) => {
      it(`returns expected value for ${example.description}`, () => {
        // arrange

        // act
        const deserialized = deserializeTile(example.input);
        const reserialized = serializeTile(deserialized);

        // assert
        expect(deserialized).toEqual(example.output);
        expect(reserialized).toEqual(example.input);
      });
    });
  });
});
