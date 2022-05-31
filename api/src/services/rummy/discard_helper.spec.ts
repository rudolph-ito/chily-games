import { expect } from "chai";
import { describe, it } from "mocha";
import { CardRank, CardSuit, ICard } from "../../shared/dtos/card";
import { IDiscardInput, IDiscardState } from "../../shared/dtos/rummy/game";
import { performDiscard } from "./discard_helper";
import { cloneDeep } from "lodash";

interface IPerformDiscardExampleGameState {
  playerCards: ICard[];
  discardState: IDiscardState;
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
    discard: { card: null as any, pileIndex: 0 },
    startGameState: {
      playerCards: [],
      discardState: { piles: [[]] },
    },
    expectedResult: "Must specify a card",
  },
  {
    description: "invalid pile index",
    discard: {
      card: { suit: CardSuit.CLUBS, rank: CardRank.ACE } as any,
      pileIndex: 1,
    },
    startGameState: {
      playerCards: [],
      discardState: { piles: [[]] },
    },
    expectedResult: "Invalid pile index",
  },
  {
    description: "discard, no restrictions, card in hand",
    discard: {
      card: { suit: CardSuit.CLUBS, rank: CardRank.ACE },
      pileIndex: 0,
    },
    startGameState: {
      playerCards: [
        { suit: CardSuit.CLUBS, rank: CardRank.ACE },
        { suit: CardSuit.CLUBS, rank: CardRank.TWO },
      ],
      discardState: { piles: [[]] },
    },
    endGameState: {
      playerCards: [{ suit: CardSuit.CLUBS, rank: CardRank.TWO }],
      discardState: {
        piles: [[{ suit: CardSuit.CLUBS, rank: CardRank.ACE }]],
      },
    },
    expectedResult: null,
  },
  {
    description: "discard, no restrictions, card not in hand",
    discard: {
      card: { suit: CardSuit.CLUBS, rank: CardRank.ACE },
      pileIndex: 0,
    },
    startGameState: {
      playerCards: [],
      discardState: { piles: [[]] },
    },
    expectedResult: "Discard not in your hand",
  },
  {
    description: "discard, must discard to different pile, card in hand",
    discard: {
      card: { suit: CardSuit.CLUBS, rank: CardRank.ACE },
      pileIndex: 1,
    },
    startGameState: {
      playerCards: [{ suit: CardSuit.CLUBS, rank: CardRank.ACE }],
      discardState: {
        piles: [
          [],
          [
            { suit: CardSuit.CLUBS, rank: CardRank.KING },
            { suit: CardSuit.SPADES, rank: CardRank.TWO },
            { suit: CardSuit.HEARTS, rank: CardRank.SEVEN },
            { suit: CardSuit.DIAMONDS, rank: CardRank.TEN },
            { suit: CardSuit.CLUBS, rank: CardRank.SIX },
          ],
        ],
        mustDiscardToPileIndex: 0,
      },
    },
    expectedResult: "Must discard to a different pile",
  },
];

describe("DoubleRummy - DiscardHelper", () => {
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
          example.startGameState.discardState
        );

        // assert
        expect(result).to.eql(example.expectedResult);
        expect(example.startGameState.playerCards).to.eql(
          endGameState.playerCards
        );
        expect(example.startGameState.discardState).to.eql(
          endGameState.discardState
        );
      });
    });
  });
});
