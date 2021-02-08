import { expect } from "chai";
import { getTrickWinner, validatePlay } from "./trick_helper";
import { describe, it } from "mocha";
import { CardRank, CardSuit, ICard } from "../../shared/dtos/card";
import { ITrickPlayerCard } from "../../shared/dtos/oh_heck/game";

interface IValidatePlayExample {
  description: string;
  cardsInHand: ICard[];
  cardPlayed: ICard;
  trick: ITrickPlayerCard[];
  expectedResult: null | string;
}

interface IGetTrickWinnerExample {
  description: string;
  trick: ITrickPlayerCard[];
  expectedResult: number;
}

describe("TrickHelper", () => {
  describe("validatePlay", () => {
    const examples: IValidatePlayExample[] = [
      {
        description:
          "returns error if card is not in hard (first card of trick)",
        cardsInHand: [{ suit: CardSuit.CLUBS, rank: CardRank.ACE }],
        cardPlayed: { suit: CardSuit.CLUBS, rank: CardRank.TWO },
        trick: [],
        expectedResult: "Card is not in your hand.",
      },
      {
        description:
          "returns no error if card is not in hard (first card of trick)",
        cardsInHand: [{ suit: CardSuit.CLUBS, rank: CardRank.ACE }],
        cardPlayed: { suit: CardSuit.CLUBS, rank: CardRank.ACE },
        trick: [],
        expectedResult: null,
      },
      {
        description:
          "returns error if not following suit of first card played when can",
        cardsInHand: [
          { suit: CardSuit.CLUBS, rank: CardRank.ACE },
          { suit: CardSuit.DIAMONDS, rank: CardRank.ACE },
        ],
        cardPlayed: { suit: CardSuit.DIAMONDS, rank: CardRank.ACE },
        trick: [
          { userId: 1, card: { suit: CardSuit.CLUBS, rank: CardRank.TWO } },
        ],
        expectedResult: "You must follow suit of first card played if you can.",
      },
      {
        description: "returns no error if following suit of first card played",
        cardsInHand: [
          { suit: CardSuit.CLUBS, rank: CardRank.ACE },
          { suit: CardSuit.DIAMONDS, rank: CardRank.ACE },
        ],
        cardPlayed: { suit: CardSuit.CLUBS, rank: CardRank.ACE },
        trick: [
          { userId: 1, card: { suit: CardSuit.CLUBS, rank: CardRank.TWO } },
        ],
        expectedResult: null,
      },
      {
        description:
          "returns no error if not following suit of first card played when can't",
        cardsInHand: [
          { suit: CardSuit.HEARTS, rank: CardRank.ACE },
          { suit: CardSuit.DIAMONDS, rank: CardRank.ACE },
        ],
        cardPlayed: { suit: CardSuit.DIAMONDS, rank: CardRank.ACE },
        trick: [
          { userId: 1, card: { suit: CardSuit.CLUBS, rank: CardRank.TWO } },
        ],
        expectedResult: null,
      },
    ];

    examples.forEach((example) => {
      it(example.description, () => {
        // Arrange

        // Act
        const result = validatePlay(
          example.cardsInHand,
          example.trick,
          example.cardPlayed
        );

        // Assert
        expect(result).to.eql(example.expectedResult);
      });
    });
  });

  describe("getTrickWinner", () => {
    const examples: IGetTrickWinnerExample[] = [
      {
        description:
          "returns the highest of the original suit if no trump card was played (everyone follows suit)",
        trick: [
          { userId: 1, card: { suit: CardSuit.CLUBS, rank: CardRank.EIGHT } },
          { userId: 2, card: { suit: CardSuit.CLUBS, rank: CardRank.FIVE } },
          { userId: 3, card: { suit: CardSuit.CLUBS, rank: CardRank.TEN } },
        ],
        expectedResult: 3,
      },
      {
        description:
          "returns the highest of the original suit if no trump card was played (ace is high)",
        trick: [
          { userId: 1, card: { suit: CardSuit.CLUBS, rank: CardRank.EIGHT } },
          { userId: 2, card: { suit: CardSuit.CLUBS, rank: CardRank.KING } },
          { userId: 3, card: { suit: CardSuit.CLUBS, rank: CardRank.ACE } },
        ],
        expectedResult: 3,
      },
      {
        description:
          "returns the highest of the original suit if no trump card was played (some follow suit)",
        trick: [
          { userId: 1, card: { suit: CardSuit.CLUBS, rank: CardRank.EIGHT } },
          { userId: 2, card: { suit: CardSuit.CLUBS, rank: CardRank.KING } },
          { userId: 3, card: { suit: CardSuit.HEARTS, rank: CardRank.ACE } },
        ],
        expectedResult: 2,
      },
      {
        description:
          "returns the highest of the original suit if no trump card was played (no one follows suit)",
        trick: [
          { userId: 1, card: { suit: CardSuit.CLUBS, rank: CardRank.EIGHT } },
          { userId: 2, card: { suit: CardSuit.DIAMONDS, rank: CardRank.FIVE } },
          { userId: 3, card: { suit: CardSuit.HEARTS, rank: CardRank.TEN } },
        ],
        expectedResult: 1,
      },
      {
        description:
          "returns the highest of the trump suit if any trump card was played (one trump card played)",
        trick: [
          { userId: 1, card: { suit: CardSuit.CLUBS, rank: CardRank.EIGHT } },
          { userId: 2, card: { suit: CardSuit.SPADES, rank: CardRank.FIVE } },
          { userId: 3, card: { suit: CardSuit.HEARTS, rank: CardRank.TEN } },
        ],
        expectedResult: 2,
      },
      {
        description:
          "returns the highest of the trump suit if any trump card was played (multiple trump card played)",
        trick: [
          { userId: 1, card: { suit: CardSuit.CLUBS, rank: CardRank.EIGHT } },
          { userId: 2, card: { suit: CardSuit.SPADES, rank: CardRank.FIVE } },
          { userId: 3, card: { suit: CardSuit.SPADES, rank: CardRank.TEN } },
        ],
        expectedResult: 3,
      },
    ];

    examples.forEach((example) => {
      it(example.description, () => {
        // Arrange

        // Act
        const result = getTrickWinner(example.trick);

        // Assert
        expect(result).to.eql(example.expectedResult);
      });
    });
  });
});
