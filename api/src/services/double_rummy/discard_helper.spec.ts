import { expect } from "chai";
import { describe, it } from "mocha";
import { CardRank, CardSuit, ICard } from "../../shared/dtos/card";
import {
  DiscardRestriction,
  IDiscardInput,
  IDiscardPile,
} from "../../shared/dtos/double_rummy/game";
import { performDiscard } from "./discard_helper";
import { cloneDeep } from "lodash";

interface IPerformDiscardExampleGameState {
  playerCards: ICard[];
  discardPile: IDiscardPile;
}

interface IPerformDiscardExample {
  description: string;
  discard: IDiscardInput;
  startGameState: IPerformDiscardExampleGameState;
  endGameState?: IPerformDiscardExampleGameState;
  expectedResult: string | null;
}

const examples: IPerformDiscardExample[] = [
  {
    description: "no discard",
    discard: {},
    startGameState: {
      playerCards: [],
      discardPile: {
        A: [],
        B: [],
        restriction: DiscardRestriction.NONE,
      },
    },
    expectedResult: "Must specify exactly one discard",
  },
  {
    description: "double discard",
    discard: {
      A: { suit: CardSuit.CLUBS, rank: CardRank.ACE },
      B: { suit: CardSuit.CLUBS, rank: CardRank.ACE },
    },
    startGameState: {
      playerCards: [],
      discardPile: {
        A: [],
        B: [],
        restriction: DiscardRestriction.NONE,
      },
    },
    expectedResult: "Must specify exactly one discard",
  },
  {
    description: "discard to A, no restrictions, card in hand",
    discard: { A: { suit: CardSuit.CLUBS, rank: CardRank.ACE } },
    startGameState: {
      playerCards: [
        { suit: CardSuit.CLUBS, rank: CardRank.ACE },
        { suit: CardSuit.CLUBS, rank: CardRank.TWO },
      ],
      discardPile: {
        A: [],
        B: [],
        restriction: DiscardRestriction.NONE,
      },
    },
    endGameState: {
      playerCards: [{ suit: CardSuit.CLUBS, rank: CardRank.TWO }],
      discardPile: {
        A: [{ suit: CardSuit.CLUBS, rank: CardRank.ACE }],
        B: [],
        restriction: DiscardRestriction.NONE,
      },
    },
    expectedResult: null,
  },
  {
    description: "discard to B, no restrictions, card in hand",
    discard: { B: { suit: CardSuit.CLUBS, rank: CardRank.ACE } },
    startGameState: {
      playerCards: [
        { suit: CardSuit.CLUBS, rank: CardRank.ACE },
        { suit: CardSuit.CLUBS, rank: CardRank.TWO },
      ],
      discardPile: {
        A: [],
        B: [],
        restriction: DiscardRestriction.NONE,
      },
    },
    endGameState: {
      playerCards: [{ suit: CardSuit.CLUBS, rank: CardRank.TWO }],
      discardPile: {
        A: [],
        B: [{ suit: CardSuit.CLUBS, rank: CardRank.ACE }],
        restriction: DiscardRestriction.NONE,
      },
    },
    expectedResult: null,
  },
  {
    description: "discard to A, no restrictions, card not in hand",
    discard: { A: { suit: CardSuit.CLUBS, rank: CardRank.ACE } },
    startGameState: {
      playerCards: [],
      discardPile: {
        A: [],
        B: [],
        restriction: DiscardRestriction.NONE,
      },
    },
    expectedResult: "Discard not in your hand",
  },
  {
    description: "discard to B, no restrictions, card not in hand",
    discard: { B: { suit: CardSuit.CLUBS, rank: CardRank.ACE } },
    startGameState: {
      playerCards: [],
      discardPile: {
        A: [],
        B: [],
        restriction: DiscardRestriction.NONE,
      },
    },
    expectedResult: "Discard not in your hand",
  },
  {
    description: "discard to B, must discard to A, card in hand",
    discard: { B: { suit: CardSuit.CLUBS, rank: CardRank.ACE } },
    startGameState: {
      playerCards: [{ suit: CardSuit.CLUBS, rank: CardRank.ACE }],
      discardPile: {
        A: [],
        B: [
          { suit: CardSuit.CLUBS, rank: CardRank.KING },
          { suit: CardSuit.SPADES, rank: CardRank.TWO },
          { suit: CardSuit.HEARTS, rank: CardRank.SEVEN },
          { suit: CardSuit.DIAMONDS, rank: CardRank.TEN },
          { suit: CardSuit.CLUBS, rank: CardRank.SIX },
        ],
        restriction: DiscardRestriction.MUST_DISCARD_TO_A,
      },
    },
    expectedResult: "Must discard to other pile",
  },
  {
    description: "discard to A, must discard to B, card in hand",
    discard: { A: { suit: CardSuit.CLUBS, rank: CardRank.ACE } },
    startGameState: {
      playerCards: [{ suit: CardSuit.CLUBS, rank: CardRank.ACE }],
      discardPile: {
        A: [
          { suit: CardSuit.CLUBS, rank: CardRank.KING },
          { suit: CardSuit.SPADES, rank: CardRank.TWO },
          { suit: CardSuit.HEARTS, rank: CardRank.SEVEN },
          { suit: CardSuit.DIAMONDS, rank: CardRank.TEN },
          { suit: CardSuit.CLUBS, rank: CardRank.SIX },
        ],
        B: [],
        restriction: DiscardRestriction.MUST_DISCARD_TO_B,
      },
    },
    expectedResult: "Must discard to other pile",
  },
];

describe.only("DoubleRummy - DiscardHelper", () => {
  describe("performDiscard", () => {
    examples.forEach((example) => {
      it(example.description, () => {
        // arrange
        const endGameState =
          example.endGameState ?? cloneDeep(example.startGameState);

        // act
        const result = performDiscard(
          example.discard,
          example.startGameState.playerCards,
          example.startGameState.discardPile
        );

        // assert
        expect(result).to.eql(example.expectedResult);
        expect(example.startGameState.playerCards).to.eql(
          endGameState.playerCards
        );
        expect(example.startGameState.discardPile).to.eql(
          endGameState.discardPile
        );
      });
    });
  });
});
