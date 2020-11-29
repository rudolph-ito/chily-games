import { CardRank, CardSuit, ICard } from "../../shared/dtos/yaniv/card";
import { expect } from "chai";
import { isValidDiscard, isValidPickup } from "./discard_validator";

interface IIsValidDiscardExample {
  cards: ICard[];
  description: string;
  expectedResult: boolean;
}

const isValidDiscardExamples: IIsValidDiscardExample[] = [
  {
    cards: [{ rank: CardRank.KING, suit: CardSuit.CLUBS }],
    description: "one card (non-joker)",
    expectedResult: true,
  },
  {
    cards: [{ isJoker: true }],
    description: "one card (joker)",
    expectedResult: true,
  },
  {
    cards: [
      { rank: CardRank.KING, suit: CardSuit.CLUBS },
      { rank: CardRank.KING, suit: CardSuit.DIAMONDS },
    ],
    description: "two cards with the same rank",
    expectedResult: true,
  },
  {
    cards: [
      { rank: CardRank.KING, suit: CardSuit.CLUBS },
      { rank: CardRank.KING, suit: CardSuit.DIAMONDS },
      { rank: CardRank.KING, suit: CardSuit.HEARTS },
    ],
    description: "three cards with the same rank",
    expectedResult: true,
  },
  {
    cards: [
      { rank: CardRank.KING, suit: CardSuit.CLUBS },
      { rank: CardRank.KING, suit: CardSuit.DIAMONDS },
      { rank: CardRank.KING, suit: CardSuit.HEARTS },
      { rank: CardRank.KING, suit: CardSuit.SPADES },
    ],
    description: "four cards with the same rank",
    expectedResult: true,
  },
  {
    cards: [
      { rank: CardRank.KING, suit: CardSuit.CLUBS },
      { rank: CardRank.KING, suit: CardSuit.DIAMONDS },
      { rank: CardRank.KING, suit: CardSuit.HEARTS },
      { rank: CardRank.KING, suit: CardSuit.SPADES },
      { isJoker: true },
    ],
    description: "four cards with the same rank and a joker",
    expectedResult: true,
  },
  {
    cards: [{ rank: CardRank.KING, suit: CardSuit.CLUBS }, { isJoker: true }],
    description: "any card and a joker",
    expectedResult: true,
  },
  {
    cards: [
      { rank: CardRank.KING, suit: CardSuit.CLUBS },
      { rank: CardRank.JACK, suit: CardSuit.DIAMONDS },
    ],
    description: "two different ranks and suit",
    expectedResult: false,
  },
  {
    cards: [
      { rank: CardRank.KING, suit: CardSuit.CLUBS },
      { rank: CardRank.QUEEN, suit: CardSuit.CLUBS },
    ],
    description: "two consecutive ranks with the same suit",
    expectedResult: false,
  },
  {
    cards: [
      { rank: CardRank.KING, suit: CardSuit.CLUBS },
      { rank: CardRank.QUEEN, suit: CardSuit.DIAMONDS },
      { rank: CardRank.JACK, suit: CardSuit.CLUBS },
    ],
    description: "three consecutive ranks with multiple suits",
    expectedResult: false,
  },
  {
    cards: [
      { rank: CardRank.KING, suit: CardSuit.CLUBS },
      { rank: CardRank.QUEEN, suit: CardSuit.CLUBS },
      { rank: CardRank.JACK, suit: CardSuit.CLUBS },
    ],
    description: "three consecutive ranks with the same suit (ascending)",
    expectedResult: true,
  },
  {
    cards: [
      { rank: CardRank.JACK, suit: CardSuit.CLUBS },
      { rank: CardRank.QUEEN, suit: CardSuit.CLUBS },
      { rank: CardRank.KING, suit: CardSuit.CLUBS },
    ],
    description: "three consecutive ranks with the same suit (descending)",
    expectedResult: true,
  },
  {
    cards: [
      { rank: CardRank.KING, suit: CardSuit.CLUBS },
      { rank: CardRank.ACE, suit: CardSuit.CLUBS },
      { rank: CardRank.TWO, suit: CardSuit.CLUBS },
    ],
    description: "three consecutive ranks with the same suit (wrap-around)",
    expectedResult: true,
  },
  {
    cards: [
      { rank: CardRank.TWO, suit: CardSuit.CLUBS },
      { isJoker: true },
      { rank: CardRank.KING, suit: CardSuit.CLUBS },
      { rank: CardRank.QUEEN, suit: CardSuit.CLUBS },
    ],
    description:
      "four consecutive ranks with the same suit (wrap-around, with joker at ace)",
    expectedResult: true,
  },
  {
    cards: [
      { rank: CardRank.KING, suit: CardSuit.CLUBS },
      { isJoker: true },
      { rank: CardRank.JACK, suit: CardSuit.CLUBS },
    ],
    description:
      "three consecutive ranks with the same suit (joker in the middle)",
    expectedResult: true,
  },
  {
    cards: [
      { isJoker: true },
      { rank: CardRank.QUEEN, suit: CardSuit.CLUBS },
      { rank: CardRank.JACK, suit: CardSuit.CLUBS },
    ],
    description:
      "three consecutive ranks with the same suit (one joker at end)",
    expectedResult: true,
  },
  {
    cards: [
      { rank: CardRank.KING, suit: CardSuit.CLUBS },
      { rank: CardRank.QUEEN, suit: CardSuit.CLUBS },
      { rank: CardRank.JACK, suit: CardSuit.CLUBS },
      { rank: CardRank.TEN, suit: CardSuit.CLUBS },
    ],
    description: "four consecutive ranks with the same suit",
    expectedResult: true,
  },
  {
    cards: [
      { isJoker: true },
      { isJoker: true },
      { rank: CardRank.JACK, suit: CardSuit.CLUBS },
      { rank: CardRank.TEN, suit: CardSuit.CLUBS },
    ],
    description:
      "four consecutive ranks with the same suit (two jokers at beginning)",
    expectedResult: true,
  },
  {
    cards: [
      { rank: CardRank.JACK, suit: CardSuit.CLUBS },
      { rank: CardRank.TEN, suit: CardSuit.CLUBS },
      { isJoker: true },
      { isJoker: true },
    ],
    description:
      "four consecutive ranks with the same suit (two jokers at end)",
    expectedResult: true,
  },
  {
    cards: [
      { rank: CardRank.KING, suit: CardSuit.CLUBS },
      { isJoker: true },
      { isJoker: true },
      { rank: CardRank.TEN, suit: CardSuit.CLUBS },
    ],
    description:
      "four consecutive ranks with the same suit (two jokers in the middle)",
    expectedResult: true,
  },
  {
    cards: [
      { rank: CardRank.KING, suit: CardSuit.CLUBS },
      { isJoker: true },
      { rank: CardRank.JACK, suit: CardSuit.CLUBS },
      { isJoker: true },
    ],
    description:
      "four consecutive ranks with the same suit (two jokers, one in middle, one at end)",
    expectedResult: true,
  },
  {
    cards: [
      { rank: CardRank.KING, suit: CardSuit.CLUBS },
      { rank: CardRank.QUEEN, suit: CardSuit.CLUBS },
      { rank: CardRank.JACK, suit: CardSuit.CLUBS },
      { rank: CardRank.TEN, suit: CardSuit.CLUBS },
      { rank: CardRank.NINE, suit: CardSuit.CLUBS },
    ],
    description: "five consecutive ranks with the same suit",
    expectedResult: true,
  },
  {
    cards: [
      { rank: CardRank.KING, suit: CardSuit.CLUBS },
      { isJoker: true },
      { rank: CardRank.JACK, suit: CardSuit.CLUBS },
      { isJoker: true },
      { rank: CardRank.NINE, suit: CardSuit.CLUBS },
    ],
    description:
      "five consecutive ranks with the same suit (two jokers in middle spaced apart)",
    expectedResult: true,
  },
  {
    cards: [
      { rank: CardRank.KING, suit: CardSuit.CLUBS },
      { isJoker: true },
      { isJoker: true },
      { rank: CardRank.TEN, suit: CardSuit.CLUBS },
      { rank: CardRank.NINE, suit: CardSuit.CLUBS },
    ],
    description:
      "five consecutive ranks with the same suit (two jokers in middle together)",
    expectedResult: true,
  },
];

interface IsValidPickupExample {
  pickupCard: ICard;
  lastDiscards: ICard[];
  description: string;
  expectedResult: boolean;
}

const isValidPickupExamples: IsValidPickupExample[] = [
  {
    pickupCard: { rank: CardRank.KING, suit: CardSuit.CLUBS },
    lastDiscards: [{ rank: CardRank.KING, suit: CardSuit.CLUBS }],
    description: "discard is single card, picked up",
    expectedResult: true,
  },
  {
    pickupCard: { rank: CardRank.KING, suit: CardSuit.CLUBS },
    lastDiscards: [{ rank: CardRank.KING, suit: CardSuit.DIAMONDS }],
    description: "discard is single card, invalid pick up",
    expectedResult: false,
  },
  {
    pickupCard: { rank: CardRank.QUEEN, suit: CardSuit.CLUBS },
    lastDiscards: [
      { rank: CardRank.KING, suit: CardSuit.CLUBS },
      { rank: CardRank.KING, suit: CardSuit.DIAMONDS },
    ],
    description: "discard is set, invalid pick up",
    expectedResult: false,
  },
  {
    pickupCard: { rank: CardRank.KING, suit: CardSuit.CLUBS },
    lastDiscards: [
      { rank: CardRank.KING, suit: CardSuit.CLUBS },
      { rank: CardRank.KING, suit: CardSuit.DIAMONDS },
    ],
    description: "discard is set, picked up one",
    expectedResult: true,
  },
  {
    pickupCard: { rank: CardRank.KING, suit: CardSuit.CLUBS },
    lastDiscards: [
      { rank: CardRank.KING, suit: CardSuit.CLUBS },
      { rank: CardRank.QUEEN, suit: CardSuit.CLUBS },
      { rank: CardRank.JACK, suit: CardSuit.CLUBS },
    ],
    description: "discard is run, picked up first card",
    expectedResult: true,
  },
  {
    pickupCard: { rank: CardRank.QUEEN, suit: CardSuit.CLUBS },
    lastDiscards: [
      { rank: CardRank.KING, suit: CardSuit.CLUBS },
      { rank: CardRank.QUEEN, suit: CardSuit.CLUBS },
      { rank: CardRank.JACK, suit: CardSuit.CLUBS },
    ],
    description: "discard is run, picked up middle",
    expectedResult: false,
  },
  {
    pickupCard: { rank: CardRank.JACK, suit: CardSuit.CLUBS },
    lastDiscards: [
      { rank: CardRank.KING, suit: CardSuit.CLUBS },
      { rank: CardRank.QUEEN, suit: CardSuit.CLUBS },
      { rank: CardRank.JACK, suit: CardSuit.CLUBS },
    ],
    description: "discard is run, picked up last card",
    expectedResult: true,
  },
];

describe("YanivDiscardValidator", () => {
  describe("isValidDiscard", () => {
    isValidDiscardExamples.forEach((example) => {
      it(`returns ${example.expectedResult.toString()} for ${
        example.description
      }`, () => {
        // arrange

        // act
        const result = isValidDiscard(example.cards);

        // assert
        expect(result).to.eql(example.expectedResult);
      });
    });
  });

  describe("isValidPickup", () => {
    isValidPickupExamples.forEach((example) => {
      it(`returns ${example.expectedResult.toString()} for ${
        example.description
      }`, () => {
        // arrange

        // act
        const result = isValidPickup(example.pickupCard, example.lastDiscards);

        // assert
        expect(result).to.eql(example.expectedResult);
      });
    });
  });
});
