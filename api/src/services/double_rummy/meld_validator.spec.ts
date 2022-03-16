import { expect } from "chai";
import { describe, it } from "mocha";
import { CardRank, CardSuit, ICard } from "../../shared/dtos/card";
import { IMeld, IMeldInput } from "../../shared/dtos/double_rummy/game";
import {
  IValidateMeldResult,
  MeldAddElementRule,
  validateMeld,
} from "./meld_validator";

interface IExistingMeld {
  id: number;
  cards: ICard[];
}

interface IValidateMeldExample {
  description: string;
  meldInput: IMeldInput;
  existingMelds: IExistingMeld[];
  expectedResult: IValidateMeldResult | null;
}

const examples: IValidateMeldExample[] = [
  {
    description: "new meld, first, set",
    meldInput: {
      cards: [
        { rank: CardRank.TWO, suit: CardSuit.SPADES },
        { rank: CardRank.TWO, suit: CardSuit.HEARTS },
        { rank: CardRank.TWO, suit: CardSuit.DIAMONDS },
      ],
    },
    existingMelds: [],
    expectedResult: {
      meldId: 1,
      addElementRule: MeldAddElementRule.NONE,
    },
  },
  {
    description: "new meld, first, run",
    meldInput: {
      cards: [
        { rank: CardRank.ACE, suit: CardSuit.SPADES },
        { rank: CardRank.TWO, suit: CardSuit.SPADES },
        { rank: CardRank.THREE, suit: CardSuit.SPADES },
        { rank: CardRank.FOUR, suit: CardSuit.SPADES },
      ],
    },
    existingMelds: [],
    expectedResult: {
      meldId: 1,
      addElementRule: MeldAddElementRule.NONE,
    },
  },
  {
    description: "new meld, second, set",
    meldInput: {
      cards: [
        { rank: CardRank.TWO, suit: CardSuit.SPADES },
        { rank: CardRank.TWO, suit: CardSuit.HEARTS },
        { rank: CardRank.TWO, suit: CardSuit.DIAMONDS },
      ],
    },
    existingMelds: [
      {
        id: 1,
        cards: [],
      },
    ],
    expectedResult: {
      meldId: 2,
      addElementRule: MeldAddElementRule.NONE,
    },
  },
  {
    description: "new meld, second, run",
    meldInput: {
      cards: [
        { rank: CardRank.ACE, suit: CardSuit.SPADES },
        { rank: CardRank.TWO, suit: CardSuit.SPADES },
        { rank: CardRank.THREE, suit: CardSuit.SPADES },
        { rank: CardRank.FOUR, suit: CardSuit.SPADES },
      ],
    },
    existingMelds: [
      {
        id: 1,
        cards: [],
      },
    ],
    expectedResult: {
      meldId: 2,
      addElementRule: MeldAddElementRule.NONE,
    },
  },
  {
    description: "runs in descending need to be reversed",
    meldInput: {
      cards: [
        { rank: CardRank.FOUR, suit: CardSuit.SPADES },
        { rank: CardRank.THREE, suit: CardSuit.SPADES },
        { rank: CardRank.TWO, suit: CardSuit.SPADES },
        { rank: CardRank.ACE, suit: CardSuit.SPADES },
      ],
    },
    existingMelds: [
      {
        id: 1,
        cards: [],
      },
    ],
    expectedResult: {
      meldId: 2,
      addElementRule: MeldAddElementRule.REVERSE,
    },
  },
  {
    description: "adding to existing meld, set",
    meldInput: {
      id: 1,
      cards: [{ rank: CardRank.SIX, suit: CardSuit.SPADES }],
    },
    existingMelds: [
      {
        id: 1,
        cards: [
          { rank: CardRank.SIX, suit: CardSuit.DIAMONDS },
          { rank: CardRank.SIX, suit: CardSuit.HEARTS },
          { rank: CardRank.SIX, suit: CardSuit.CLUBS },
        ],
      },
    ],
    expectedResult: {
      meldId: 1,
      addElementRule: MeldAddElementRule.NONE,
    },
  },
  {
    description: "adding to existing meld, run (one card on suffix)",
    meldInput: {
      id: 1,
      cards: [{ rank: CardRank.SEVEN, suit: CardSuit.SPADES }],
    },
    existingMelds: [
      {
        id: 1,
        cards: [
          { rank: CardRank.THREE, suit: CardSuit.SPADES },
          { rank: CardRank.FOUR, suit: CardSuit.SPADES },
          { rank: CardRank.FIVE, suit: CardSuit.SPADES },
          { rank: CardRank.SIX, suit: CardSuit.SPADES },
        ],
      },
    ],
    expectedResult: {
      meldId: 1,
      addElementRule: MeldAddElementRule.SUFFIX,
    },
  },
  {
    description: "adding to existing meld, run (one card on prefix)",
    meldInput: {
      id: 1,
      cards: [{ rank: CardRank.TWO, suit: CardSuit.SPADES }],
    },
    existingMelds: [
      {
        id: 1,
        cards: [
          { rank: CardRank.THREE, suit: CardSuit.SPADES },
          { rank: CardRank.FOUR, suit: CardSuit.SPADES },
          { rank: CardRank.FIVE, suit: CardSuit.SPADES },
          { rank: CardRank.SIX, suit: CardSuit.SPADES },
        ],
      },
    ],
    expectedResult: {
      meldId: 1,
      addElementRule: MeldAddElementRule.PREFIX,
    },
  },
];

describe.only("DoubleRummy - MeldValidator", () => {
  describe("validateMeld", () => {
    examples.forEach((example) => {
      it(example.description, () => {
        // arrange
        const melds: IMeld[] = example.existingMelds.map(({ id, cards }) => {
          return {
            id,
            elements: cards.map((card) => ({ userId: 1, card })),
          };
        });

        // act
        const result = validateMeld(example.meldInput, melds);

        // assert
        expect(result).to.eql(example.expectedResult);
      });
    });
  });
});
