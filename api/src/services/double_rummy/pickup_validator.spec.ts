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

interface IBaseSymmetricValidatePickupExample {
  input: IPickupInput;
  sampleDiscardPile: ICard[];
  playerCards: ICard[];
  result: null | string;
  description: string;
}

function buildSymmetricDiscardExamples(
  bases: IBaseSymmetricValidatePickupExample[]
): IValidatePickupExample[] {
  const result: IValidatePickupExample[] = [];
  bases.forEach((base) => {
    result.push({
      input: base.input,
      discardPile: {
        A: base.sampleDiscardPile,
        B: [],
        restriction: DiscardRestriction.NONE,
      },
      playerCards: base.playerCards,
      result: base.result,
      description: `discard A, ${base.description}`,
    });
    result.push({
      input: base.input,
      discardPile: {
        A: [],
        B: base.sampleDiscardPile,
        restriction: DiscardRestriction.NONE,
      },
      playerCards: base.playerCards,
      result: base.result,
      description: `discard B, ${base.description}`,
    });
  });
  return result;
}

describe("DoubleRummy - PickupValidator", () => {
  describe("validatePickup", () => {
    const examples: IValidatePickupExample[] = [
      {
        description: "from deck",
        input: {},
        discardPile: { A: [], B: [], restriction: DiscardRestriction.NONE },
        playerCards: [],
        result: null,
      },
      ...buildSymmetricDiscardExamples([
        {
          description: "from top",
          input: { pickup: { rank: CardRank.TWO, suit: CardSuit.HEARTS } },
          sampleDiscardPile: [
            { rank: CardRank.ACE, suit: CardSuit.SPADES },
            { rank: CardRank.TWO, suit: CardSuit.HEARTS },
          ],
          playerCards: [],
          result: null,
        },
        {
          description: "buried, without meld",
          input: {
            pickup: { rank: CardRank.ACE, suit: CardSuit.SPADES },
          },
          sampleDiscardPile: [
            { rank: CardRank.ACE, suit: CardSuit.SPADES },
            { rank: CardRank.TWO, suit: CardSuit.HEARTS },
          ],
          playerCards: [],
          result:
            "Meld is required when picking up a buried card from a discard pile",
        },
        {
          description:
            "buried, meld includes card not in hand nor picked up from discard pile",
          input: {
            pickup: { rank: CardRank.ACE, suit: CardSuit.SPADES },
            meld: {
              cards: [
                { rank: CardRank.ACE, suit: CardSuit.SPADES },
                { rank: CardRank.TWO, suit: CardSuit.SPADES },
              ],
            },
          },
          sampleDiscardPile: [
            { rank: CardRank.ACE, suit: CardSuit.SPADES },
            { rank: CardRank.TWO, suit: CardSuit.HEARTS },
          ],
          playerCards: [],
          result:
            'The following cards are not in the users hand or part of what is picked up: [{"rank":"2","suit":"spades"}]',
        },
        {
          description: "buried, meld is just pickup card",
          input: {
            pickup: { rank: CardRank.ACE, suit: CardSuit.SPADES },
            meld: { cards: [{ rank: CardRank.ACE, suit: CardSuit.SPADES }] },
          },
          sampleDiscardPile: [
            { rank: CardRank.ACE, suit: CardSuit.SPADES },
            { rank: CardRank.TWO, suit: CardSuit.HEARTS },
          ],
          playerCards: [],
          result: null,
        },
        {
          description: "buried, meld with additional cards from pile",
          input: {
            pickup: { rank: CardRank.ACE, suit: CardSuit.SPADES },
            meld: {
              cards: [
                { rank: CardRank.ACE, suit: CardSuit.SPADES },
                { rank: CardRank.TWO, suit: CardSuit.SPADES },
              ],
            },
          },
          sampleDiscardPile: [
            { rank: CardRank.ACE, suit: CardSuit.SPADES },
            { rank: CardRank.TWO, suit: CardSuit.HEARTS },
            { rank: CardRank.TWO, suit: CardSuit.SPADES },
          ],
          playerCards: [],
          result: null,
        },
        {
          description: "buried, meld with cards from hand",
          input: {
            pickup: { rank: CardRank.ACE, suit: CardSuit.SPADES },
            meld: {
              cards: [
                { rank: CardRank.ACE, suit: CardSuit.SPADES },
                { rank: CardRank.TWO, suit: CardSuit.SPADES },
              ],
            },
          },
          sampleDiscardPile: [
            { rank: CardRank.ACE, suit: CardSuit.SPADES },
            { rank: CardRank.TWO, suit: CardSuit.HEARTS },
          ],
          playerCards: [{ rank: CardRank.TWO, suit: CardSuit.SPADES }],
          result: null,
        },
        {
          description:
            "buried, meld with cards from hand and additional cards from pile",
          input: {
            pickup: { rank: CardRank.ACE, suit: CardSuit.SPADES },
            meld: {
              cards: [
                { rank: CardRank.ACE, suit: CardSuit.SPADES },
                { rank: CardRank.TWO, suit: CardSuit.SPADES },
                { rank: CardRank.THREE, suit: CardSuit.SPADES },
              ],
            },
          },
          sampleDiscardPile: [
            { rank: CardRank.ACE, suit: CardSuit.SPADES },
            { rank: CardRank.TWO, suit: CardSuit.HEARTS },
            { rank: CardRank.THREE, suit: CardSuit.SPADES },
          ],
          playerCards: [{ rank: CardRank.TWO, suit: CardSuit.SPADES }],
          result: null,
        },
        {
          description: "buried in A, meld includes card buried deeper in pile",
          input: {
            pickup: { rank: CardRank.ACE, suit: CardSuit.SPADES },
            meld: {
              cards: [
                { rank: CardRank.ACE, suit: CardSuit.SPADES },
                { rank: CardRank.TWO, suit: CardSuit.SPADES },
              ],
            },
          },
          sampleDiscardPile: [
            { rank: CardRank.TWO, suit: CardSuit.SPADES },
            { rank: CardRank.ACE, suit: CardSuit.SPADES },
            { rank: CardRank.TWO, suit: CardSuit.HEARTS },
          ],
          playerCards: [],
          result:
            'The following cards are not in the users hand or part of what is picked up: [{"rank":"2","suit":"spades"}]',
        },
      ]),
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
