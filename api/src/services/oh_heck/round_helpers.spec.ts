import { getNumberOfCardsToDeal } from "./round_helpers";

interface ICardsToDealExample {
  roundNumber: number;
  expectedResult: number;
}

describe("RoundHelpers", () => {
  describe("getNumberOfCardsToDeal", () => {
    const examples: ICardsToDealExample[] = [
      { roundNumber: 1, expectedResult: 7 },
      { roundNumber: 2, expectedResult: 6 },
      { roundNumber: 3, expectedResult: 5 },
      { roundNumber: 4, expectedResult: 4 },
      { roundNumber: 5, expectedResult: 3 },
      { roundNumber: 6, expectedResult: 2 },
      { roundNumber: 7, expectedResult: 1 },
      { roundNumber: 8, expectedResult: 1 },
      { roundNumber: 9, expectedResult: 2 },
      { roundNumber: 10, expectedResult: 3 },
      { roundNumber: 11, expectedResult: 4 },
      { roundNumber: 12, expectedResult: 5 },
      { roundNumber: 13, expectedResult: 6 },
      { roundNumber: 14, expectedResult: 7 },
    ];

    examples.forEach((example) => {
      it(`returns ${example.expectedResult} for round ${example.roundNumber}`, () => {
        // Arrange

        // Act
        const result = getNumberOfCardsToDeal(example.roundNumber);

        // Assert
        expect(result).toEqual(example.expectedResult);
      });
    });

    it(`throws if round is less than 1`, () => {
      // Arrange
      let error: null | Error = null;

      // Act
      try {
        getNumberOfCardsToDeal(0);
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeDefined();
      expect(error?.message).toEqual(`Unexpected round number: 0`);
    });

    it(`throws if round is greater than 14`, () => {
      // Arrange
      let error: null | Error = null;

      // Act
      try {
        getNumberOfCardsToDeal(15);
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeDefined();
      expect(error?.message).toEqual(`Unexpected round number: 15`);
    });
  });
});
