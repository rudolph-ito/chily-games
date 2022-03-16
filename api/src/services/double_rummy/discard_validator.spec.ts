import { expect } from "chai";
import { describe, it } from "mocha";
import { CardRank, CardSuit, ICard } from "../../shared/dtos/card";
import { DiscardRestriction, IDiscard, IDiscardPile } from "../../shared/dtos/double_rummy/game";
import {
  validateDiscard
} from "./discard_validator";

interface IValidateDiscardExample {
  description: string;
  discard: IDiscard;
  discardRestriction: DiscardRestriction;
  playerCards: ICard[];
  expectedResult: string | null;
}

const examples: IValidateDiscardExample[] = [
  {
    description: 'discard to A, no restrictions, card in hand',
    discard: { A: { suit: CardSuit.CLUBS, rank: CardRank.ACE } },
    discardRestriction: DiscardRestriction.NONE,
    playerCards: [{ suit: CardSuit.CLUBS, rank: CardRank.ACE }],
    expectedResult: null,
  },
  {
    description: 'discard to B, no restrictions, card in hand',
    discard: { B: { suit: CardSuit.CLUBS, rank: CardRank.ACE } },
    discardRestriction: DiscardRestriction.NONE,
    playerCards: [{ suit: CardSuit.CLUBS, rank: CardRank.ACE }],
    expectedResult: null,
  },
  {
    description: 'discard to A, no restrictions, card not in hand',
    discard: { A: { suit: CardSuit.CLUBS, rank: CardRank.ACE } },
    discardRestriction: DiscardRestriction.NONE,
    playerCards: [],
    expectedResult: 'Discard not in your hand',
  },
  {
    description: 'discard to B, no restrictions, card not in hand',
    discard: { B: { suit: CardSuit.CLUBS, rank: CardRank.ACE } },
    discardRestriction: DiscardRestriction.NONE,
    playerCards: [],
    expectedResult: 'Discard not in your hand',
  },
  {
    description: 'discard to A, must discard to A, card in hand',
    discard: { A: { suit: CardSuit.CLUBS, rank: CardRank.ACE } },
    discardRestriction: DiscardRestriction.MUST_DISCARD_TO_A,
    playerCards: [{ suit: CardSuit.CLUBS, rank: CardRank.ACE }],
    expectedResult: null,
  }, {
    description: 'discard to A, must discard to B, card in hand',
    discard: { A: { suit: CardSuit.CLUBS, rank: CardRank.ACE } },
    discardRestriction: DiscardRestriction.MUST_DISCARD_TO_B,
    playerCards: [{ suit: CardSuit.CLUBS, rank: CardRank.ACE }],
    expectedResult: 'Must discard to other pile',
  },
  {
    description: 'discard to B, must discard to A, card in hand',
    discard: { B: { suit: CardSuit.CLUBS, rank: CardRank.ACE } },
    discardRestriction: DiscardRestriction.MUST_DISCARD_TO_A,
    playerCards: [{ suit: CardSuit.CLUBS, rank: CardRank.ACE }],
    expectedResult: 'Must discard to other pile',
  }, {
    description: 'discard to B, must discard to B, card in hand',
    discard: { B: { suit: CardSuit.CLUBS, rank: CardRank.ACE } },
    discardRestriction: DiscardRestriction.MUST_DISCARD_TO_B,
    playerCards: [{ suit: CardSuit.CLUBS, rank: CardRank.ACE }],
    expectedResult: null
  },
];

describe("DoubleRummy - DiscardValidator", () => {
  describe("validateDiscard", () => {
    examples.forEach((example) => {
      it(example.description, () => {
        // arrange

        // act
        const result = validateDiscard(example.discard, example.discardRestriction, example.playerCards);

        // assert
        expect(result).to.eql(example.expectedResult);
      });
    });
  });
});
