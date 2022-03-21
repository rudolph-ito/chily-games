import { describe, it } from "mocha";
import { expect } from "chai";
import {
  DiscardRestriction,
  IDiscardPile,
  IPickupInput,
} from "../../shared/dtos/double_rummy/game";
import { CardRank, CardSuit, ICard } from "../../shared/dtos/card";
import { clone, cloneDeep } from "lodash";
import { performPickup } from "./pickup_helper";

interface IPerformPickupExampleGameState {
  deck: ICard[];
  discardPile: IDiscardPile;
  playerCards: ICard[];
}

interface IPerformPickupExample {
  input: IPickupInput;
  startGameState: IPerformPickupExampleGameState;
  endGameState?: IPerformPickupExampleGameState;
  result: null | string;
  description: string;
}

interface IPerformPickupBaseSymmetricExampleGameState {
  deck: ICard[];
  sampleDiscardPile: ICard[];
  playerCards: ICard[];
}

interface IBaseSymmetricValidatePickupExample {
  input: IPickupInput;
  startGameState: IPerformPickupBaseSymmetricExampleGameState;
  endGameState?: IPerformPickupBaseSymmetricExampleGameState;
  result: null | string;
  description: string;
}

function buildSymmetricDiscardExamples(
  bases: IBaseSymmetricValidatePickupExample[]
): IPerformPickupExample[] {
  const result: IPerformPickupExample[] = [];
  bases.forEach((base) => {
    result.push({
      input: base.input,
      startGameState: {
        deck: clone(base.startGameState.deck),
        discardPile: {
          A: clone(base.startGameState.sampleDiscardPile),
          B: [],
          restriction: DiscardRestriction.NONE,
        },
        playerCards: clone(base.startGameState.playerCards),
      },
      endGameState:
        base.endGameState == null
          ? undefined
          : {
              deck: base.endGameState.deck,
              discardPile: {
                A: base.endGameState.sampleDiscardPile,
                B: [],
                restriction: DiscardRestriction.NONE,
              },
              playerCards: base.endGameState.playerCards,
            },
      result: base.result,
      description: `discard A, ${base.description}`,
    });
    result.push({
      input: base.input,
      startGameState: {
        deck: clone(base.startGameState.deck),
        discardPile: {
          A: [],
          B: clone(base.startGameState.sampleDiscardPile),
          restriction: DiscardRestriction.NONE,
        },
        playerCards: clone(base.startGameState.playerCards),
      },
      endGameState:
        base.endGameState == null
          ? undefined
          : {
              deck: base.endGameState.deck,
              discardPile: {
                A: [],
                B: base.endGameState.sampleDiscardPile,
                restriction: DiscardRestriction.NONE,
              },
              playerCards: base.endGameState.playerCards,
            },
      result: base.result,
      description: `discard B, ${base.description}`,
    });
  });
  return result;
}

const examples: IPerformPickupExample[] = [
  {
    description: "from deck",
    input: {},
    startGameState: {
      deck: [{ rank: CardRank.TWO, suit: CardSuit.DIAMONDS }],
      discardPile: { A: [], B: [], restriction: DiscardRestriction.NONE },
      playerCards: [],
    },
    endGameState: {
      deck: [],
      discardPile: { A: [], B: [], restriction: DiscardRestriction.NONE },
      playerCards: [{ rank: CardRank.TWO, suit: CardSuit.DIAMONDS }],
    },
    result: null,
  },
  ...buildSymmetricDiscardExamples([
    {
      description: "from top",
      input: { pickup: { rank: CardRank.TWO, suit: CardSuit.HEARTS } },
      startGameState: {
        deck: [],
        sampleDiscardPile: [
          { rank: CardRank.ACE, suit: CardSuit.SPADES },
          { rank: CardRank.TWO, suit: CardSuit.HEARTS },
        ],
        playerCards: [],
      },
      endGameState: {
        deck: [],
        sampleDiscardPile: [{ rank: CardRank.ACE, suit: CardSuit.SPADES }],
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
        sampleDiscardPile: [
          { rank: CardRank.ACE, suit: CardSuit.SPADES },
          { rank: CardRank.TWO, suit: CardSuit.HEARTS },
        ],
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
        sampleDiscardPile: [
          { rank: CardRank.ACE, suit: CardSuit.SPADES },
          { rank: CardRank.TWO, suit: CardSuit.HEARTS },
        ],
        playerCards: [],
      },
      result: "Meld must include the card being picked up",
    },
  ]),
  {
    description: "invalid card",
    input: { pickup: { rank: CardRank.ACE, suit: CardSuit.SPADES } },
    startGameState: {
      deck: [],
      discardPile: { A: [], B: [], restriction: DiscardRestriction.NONE },
      playerCards: [],
    },
    result:
      "Invalid pickup. Should be null or card from one of the discard piles",
  },
];

describe.only("DoubleRummy - PickupHelper", () => {
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
          example.startGameState.discardPile,
          example.startGameState.playerCards
        );

        // Assert
        expect(result).to.eql(example.result);
        expect(endGameState.deck).to.eql(example.startGameState.deck);
        expect(endGameState.discardPile).to.eql(
          example.startGameState.discardPile
        );
        expect(endGameState.playerCards).to.eql(
          example.startGameState.playerCards
        );
      });
    });
  });
});
