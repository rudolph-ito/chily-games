import { IOhHeckPlayer } from "../../database/models/oh_heck_game";
import { expect } from "chai";
import { validateBet } from "./bet_validator";

function getMockPlayers(
  numberOfCards: number,
  bets: Array<null | number>
): IOhHeckPlayer[] {
  return bets.map((bet) => {
    return {
      userId: 1,
      cardsInHand: new Array(numberOfCards).fill(null),
      bet,
      tricksTaken: 0,
    };
  });
}
interface IBetExample {
  description: string;
  players: IOhHeckPlayer[];
  bet: number;
  expectedResult: null | string;
}

describe("BetValidator", () => {
  describe("validateBet", () => {
    const examples: IBetExample[] = [
      {
        description: "returns error if bet is less than 0",
        players: getMockPlayers(7, [null, null, null]),
        bet: -1,
        expectedResult: "Bet must be between 0 and 7.",
      },
      {
        description: "returns error if bet is greater than number of cards",
        players: getMockPlayers(7, [null, null, null]),
        bet: 8,
        expectedResult: "Bet must be between 0 and 7.",
      },
      {
        description: "returns no error if bet is between 0 and number of cards",
        players: getMockPlayers(7, [null, null, null]),
        bet: 3,
        expectedResult: null,
      },
      {
        description:
          "returns error if last player is betting and total bets equals number of cards",
        players: getMockPlayers(7, [1, 2, null]),
        bet: 4,
        expectedResult: "Bet cannot be 4 as sum of bets cannot be 7.",
      },
      {
        description:
          "returns no error if last player is betting and total bets does not equal number of cards",
        players: getMockPlayers(7, [1, 2, null]),
        bet: 3,
        expectedResult: null,
      },
    ];

    examples.forEach((example) => {
      it(example.description, () => {
        // Arrange

        // Act
        const result = validateBet(example.players, example.bet);

        // Assert
        expect(result).to.eql(example.expectedResult);
      });
    });
  });
});
