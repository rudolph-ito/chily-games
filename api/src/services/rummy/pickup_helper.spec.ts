import { describe, it } from "mocha";
import { expect } from "chai";
import { IDiscardState, IPickupInput } from "../../shared/dtos/rummy/game";
import { CardRank, CardSuit, ICard } from "../../shared/dtos/card";
import { cloneDeep } from "lodash";
import { performPickup } from "./pickup_helper";

interface IPerformPickupExampleGameState {
  deck: ICard[];
  discardState: IDiscardState;
  playerCards: ICard[];
}

interface IPerformPickupExample {
  input: IPickupInput;
  startGameState: IPerformPickupExampleGameState;
  endGameState?: IPerformPickupExampleGameState;
  result: null | string;
  description: string;
}

const examples: IPerformPickupExample[] = [
  {
    description: "from deck",
    input: {},
    startGameState: {
      deck: [{ rank: CardRank.TWO, suit: CardSuit.DIAMONDS }],
      discardState: { piles: [[]] },
      playerCards: [],
    },
    endGameState: {
      deck: [],
      discardState: { piles: [[]] },
      playerCards: [{ rank: CardRank.TWO, suit: CardSuit.DIAMONDS }],
    },
    result: null,
  },
  {
    description: "from top",
    input: { pickup: { rank: CardRank.TWO, suit: CardSuit.HEARTS } },
    startGameState: {
      deck: [],
      discardState: {
        piles: [
          [
            { rank: CardRank.ACE, suit: CardSuit.SPADES },
            { rank: CardRank.TWO, suit: CardSuit.HEARTS },
          ],
        ],
      },
      playerCards: [],
    },
    endGameState: {
      deck: [],
      discardState: {
        piles: [[{ rank: CardRank.ACE, suit: CardSuit.SPADES }]],
      },
      playerCards: [{ rank: CardRank.TWO, suit: CardSuit.HEARTS }],
    },
    result: null,
  },
  {
    description: "buried, without meld",
    input: {
      pickup: { rank: CardRank.ACE, suit: CardSuit.SPADES },
    },
    startGameState: {
      deck: [],
      discardState: {
        piles: [
          [
            { rank: CardRank.ACE, suit: CardSuit.SPADES },
            { rank: CardRank.TWO, suit: CardSuit.HEARTS },
          ],
        ],
      },
      playerCards: [],
    },
    result:
      "Meld is required when picking up a buried card from a discard pile",
  },
  {
    description: "buried, meld does not include picked up card",
    input: {
      pickup: { rank: CardRank.ACE, suit: CardSuit.SPADES },
      deepPickupMeld: {
        cards: [
          { rank: CardRank.TWO, suit: CardSuit.SPADES },
          { rank: CardRank.TWO, suit: CardSuit.HEARTS },
        ],
      },
    },
    startGameState: {
      deck: [],
      discardState: {
        piles: [
          [
            { rank: CardRank.ACE, suit: CardSuit.SPADES },
            { rank: CardRank.TWO, suit: CardSuit.HEARTS },
          ],
        ],
      },
      playerCards: [],
    },
    result: "Meld must include the card being picked up",
  },
  {
    description: "invalid card",
    input: { pickup: { rank: CardRank.ACE, suit: CardSuit.SPADES } },
    startGameState: {
      deck: [],
      discardState: { piles: [[]] },
      playerCards: [],
    },
    result:
      "Invalid pickup. Should be null or card from one of the discard piles",
  },
];

describe("DoubleRummy - PickupHelper", () => {
  describe("performPickup", () => {
    examples.forEach((example) => {
      it(example.description, () => {
        // Arrange
        const endGameState =
          example.endGameState ?? cloneDeep(example.startGameState);

        // Act
        const result = performPickup(
          example.input,
          example.startGameState.deck,
          example.startGameState.discardState,
          example.startGameState.playerCards
        );

        // Assert
        expect(result).to.eql(example.result);
        expect(endGameState.deck).to.eql(example.startGameState.deck);
        expect(endGameState.discardState).to.eql(
          example.startGameState.discardState
        );
        expect(endGameState.playerCards).to.eql(
          example.startGameState.playerCards
        );
      });
    });
  });
});
