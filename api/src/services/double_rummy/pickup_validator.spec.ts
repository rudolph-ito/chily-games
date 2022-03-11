import { describe, it } from "mocha";
import { expect } from "chai";
import { validatePickup } from "./pickup_validator";
import {
  DiscardRestriction,
  IDiscardPile,
  IPickupInput,
} from "../../shared/dtos/double_rummy/game";
import { CardRank, CardSuit, ICard } from "../../shared/dtos/card";

interface IValidatePickupExample {
  input: IPickupInput;
  discardPile: IDiscardPile;
  playerCards: ICard[];
  result: null | string;
  description: string;
}

describe("PickupValidator", () => {
  describe("validatePickup", () => {
    const examples: IValidatePickupExample[] = [
      {
        description: "from deck",
        input: {},
        discardPile: { A: [], B: [], restriction: DiscardRestriction.NONE },
        playerCards: [],
        result: null,
      },
      {
        description: "from top of A",
        input: { pickup: { rank: CardRank.TWO, suit: CardSuit.HEARTS } },
        discardPile: {
          A: [
            { rank: CardRank.ACE, suit: CardSuit.SPADES },
            { rank: CardRank.TWO, suit: CardSuit.HEARTS },
          ],
          B: [],
          restriction: DiscardRestriction.NONE,
        },
        playerCards: [],
        result: null,
      },
      {
        description: "from top of B",
        input: { pickup: { rank: CardRank.TWO, suit: CardSuit.HEARTS } },
        discardPile: {
          A: [],
          B: [
            { rank: CardRank.ACE, suit: CardSuit.SPADES },
            { rank: CardRank.TWO, suit: CardSuit.HEARTS },
          ],
          restriction: DiscardRestriction.NONE,
        },
        playerCards: [],
        result: null,
      },
      {
        description: "invalid card",
        input: { pickup: { rank: CardRank.ACE, suit: CardSuit.SPADES } },
        discardPile: { A: [], B: [], restriction: DiscardRestriction.NONE },
        playerCards: [],
        result:
          "Invalid pickup. Should be null or card from one of the discard piles",
      },
    ];

    examples.forEach((example) => {
      it(example.description, () => {
        // Arrange

        // Act
        const result = validatePickup(
          example.input,
          example.discardPile,
          example.playerCards
        );

        // Assert
        expect(result).to.eql(example.result);
      });
    });
  });
});
