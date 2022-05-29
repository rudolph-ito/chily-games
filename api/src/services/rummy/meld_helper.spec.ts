import { expect } from "chai";
import { describe, it } from "mocha";
import { CardRank, CardSuit, ICard } from "../../shared/dtos/card";
import { IMeld, IMeldInput } from "../../shared/dtos/rummy/game";
import { performMeld } from "./meld_helper";
import { cloneDeep } from "lodash";

interface IPerformMeldExampleGameState {
  playerCards?: ICard[];
  melds: IMeld[];
}

interface IPerformMeldExample {
  description: string;
  meldInput: IMeldInput;
  startGameState: IPerformMeldExampleGameState;
  endGameState?: IPerformMeldExampleGameState;
  expectedResult: string | null;
}

const USER_ID = 1;
const OTHER_USER_ID = 2;

const examples: IPerformMeldExample[] = [
  {
    description: "meld contains duplicates",
    meldInput: {
      cards: [
        { rank: CardRank.TWO, suit: CardSuit.SPADES },
        { rank: CardRank.TWO, suit: CardSuit.SPADES },
        { rank: CardRank.TWO, suit: CardSuit.DIAMONDS },
      ],
    },
    startGameState: {
      playerCards: [],
      melds: [],
    },
    expectedResult: "Meld cannot contain duplicates",
  },
  {
    description: "meld contains cards not in user hand",
    meldInput: {
      cards: [
        { rank: CardRank.TWO, suit: CardSuit.SPADES },
        { rank: CardRank.TWO, suit: CardSuit.HEARTS },
        { rank: CardRank.TWO, suit: CardSuit.DIAMONDS },
      ],
    },
    startGameState: {
      playerCards: [
        { rank: CardRank.TWO, suit: CardSuit.SPADES },
        { rank: CardRank.TWO, suit: CardSuit.HEARTS },
      ],
      melds: [],
    },
    expectedResult: "Meld contains cards not in your hand",
  },
  {
    description: "new meld, first, set",
    meldInput: {
      cards: [
        { rank: CardRank.TWO, suit: CardSuit.SPADES },
        { rank: CardRank.TWO, suit: CardSuit.HEARTS },
        { rank: CardRank.TWO, suit: CardSuit.DIAMONDS },
      ],
    },
    startGameState: {
      melds: [],
    },
    endGameState: {
      melds: [
        {
          id: 1,
          elements: [
            {
              card: { rank: CardRank.TWO, suit: CardSuit.SPADES },
              userId: USER_ID,
            },
            {
              card: { rank: CardRank.TWO, suit: CardSuit.HEARTS },
              userId: USER_ID,
            },
            {
              card: { rank: CardRank.TWO, suit: CardSuit.DIAMONDS },
              userId: USER_ID,
            },
          ],
        },
      ],
    },
    expectedResult: null,
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
    startGameState: {
      melds: [],
    },
    endGameState: {
      melds: [
        {
          id: 1,
          elements: [
            {
              card: { rank: CardRank.ACE, suit: CardSuit.SPADES },
              userId: USER_ID,
            },
            {
              card: { rank: CardRank.TWO, suit: CardSuit.SPADES },
              userId: USER_ID,
            },
            {
              card: { rank: CardRank.THREE, suit: CardSuit.SPADES },
              userId: USER_ID,
            },
            {
              card: { rank: CardRank.FOUR, suit: CardSuit.SPADES },
              userId: USER_ID,
            },
          ],
        },
      ],
    },
    expectedResult: null,
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
    startGameState: {
      melds: [
        {
          id: 1,
          elements: [],
        },
      ],
    },
    endGameState: {
      melds: [
        {
          id: 1,
          elements: [],
        },
        {
          id: 2,
          elements: [
            {
              card: { rank: CardRank.TWO, suit: CardSuit.SPADES },
              userId: USER_ID,
            },
            {
              card: { rank: CardRank.TWO, suit: CardSuit.HEARTS },
              userId: USER_ID,
            },
            {
              card: { rank: CardRank.TWO, suit: CardSuit.DIAMONDS },
              userId: USER_ID,
            },
          ],
        },
      ],
    },
    expectedResult: null,
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
    startGameState: {
      melds: [
        {
          id: 1,
          elements: [],
        },
      ],
    },
    endGameState: {
      melds: [
        {
          id: 1,
          elements: [],
        },
        {
          id: 2,
          elements: [
            {
              card: { rank: CardRank.ACE, suit: CardSuit.SPADES },
              userId: USER_ID,
            },
            {
              card: { rank: CardRank.TWO, suit: CardSuit.SPADES },
              userId: USER_ID,
            },
            {
              card: { rank: CardRank.THREE, suit: CardSuit.SPADES },
              userId: USER_ID,
            },
            {
              card: { rank: CardRank.FOUR, suit: CardSuit.SPADES },
              userId: USER_ID,
            },
          ],
        },
      ],
    },
    expectedResult: null,
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
    startGameState: {
      melds: [],
    },
    endGameState: {
      melds: [
        {
          id: 1,
          elements: [
            {
              card: { rank: CardRank.ACE, suit: CardSuit.SPADES },
              userId: USER_ID,
            },
            {
              card: { rank: CardRank.TWO, suit: CardSuit.SPADES },
              userId: USER_ID,
            },
            {
              card: { rank: CardRank.THREE, suit: CardSuit.SPADES },
              userId: USER_ID,
            },
            {
              card: { rank: CardRank.FOUR, suit: CardSuit.SPADES },
              userId: USER_ID,
            },
          ],
        },
      ],
    },
    expectedResult: null,
  },
  {
    description: "add to existing meld, invalid",
    meldInput: {
      id: 1,
      cards: [{ rank: CardRank.TWO, suit: CardSuit.SPADES }],
    },
    startGameState: {
      playerCards: [{ rank: CardRank.TWO, suit: CardSuit.SPADES }],
      melds: [],
    },
    expectedResult: "Invalid meld",
  },
  {
    description: "adding to existing meld, set",
    meldInput: {
      id: 1,
      cards: [{ rank: CardRank.SIX, suit: CardSuit.SPADES }],
    },
    startGameState: {
      melds: [
        {
          id: 1,
          elements: [
            {
              card: { rank: CardRank.SIX, suit: CardSuit.DIAMONDS },
              userId: OTHER_USER_ID,
            },
            {
              card: { rank: CardRank.SIX, suit: CardSuit.HEARTS },
              userId: OTHER_USER_ID,
            },
            {
              card: { rank: CardRank.SIX, suit: CardSuit.CLUBS },
              userId: OTHER_USER_ID,
            },
          ],
        },
      ],
    },
    endGameState: {
      melds: [
        {
          id: 1,
          elements: [
            {
              card: { rank: CardRank.SIX, suit: CardSuit.DIAMONDS },
              userId: OTHER_USER_ID,
            },
            {
              card: { rank: CardRank.SIX, suit: CardSuit.HEARTS },
              userId: OTHER_USER_ID,
            },
            {
              card: { rank: CardRank.SIX, suit: CardSuit.CLUBS },
              userId: OTHER_USER_ID,
            },
            {
              card: { rank: CardRank.SIX, suit: CardSuit.SPADES },
              userId: USER_ID,
            },
          ],
        },
      ],
    },
    expectedResult: null,
  },
  {
    description: "adding to existing meld, run (one card on suffix)",
    meldInput: {
      id: 1,
      cards: [{ rank: CardRank.SEVEN, suit: CardSuit.SPADES }],
    },
    startGameState: {
      melds: [
        {
          id: 1,
          elements: [
            {
              card: { rank: CardRank.THREE, suit: CardSuit.SPADES },
              userId: OTHER_USER_ID,
            },
            {
              card: { rank: CardRank.FOUR, suit: CardSuit.SPADES },
              userId: OTHER_USER_ID,
            },
            {
              card: { rank: CardRank.FIVE, suit: CardSuit.SPADES },
              userId: OTHER_USER_ID,
            },
            {
              card: { rank: CardRank.SIX, suit: CardSuit.SPADES },
              userId: OTHER_USER_ID,
            },
          ],
        },
      ],
    },
    endGameState: {
      melds: [
        {
          id: 1,
          elements: [
            {
              card: { rank: CardRank.THREE, suit: CardSuit.SPADES },
              userId: OTHER_USER_ID,
            },
            {
              card: { rank: CardRank.FOUR, suit: CardSuit.SPADES },
              userId: OTHER_USER_ID,
            },
            {
              card: { rank: CardRank.FIVE, suit: CardSuit.SPADES },
              userId: OTHER_USER_ID,
            },
            {
              card: { rank: CardRank.SIX, suit: CardSuit.SPADES },
              userId: OTHER_USER_ID,
            },
            {
              card: { rank: CardRank.SEVEN, suit: CardSuit.SPADES },
              userId: USER_ID,
            },
          ],
        },
      ],
    },
    expectedResult: null,
  },
  {
    description: "adding to existing meld, run (one card on prefix)",
    meldInput: {
      id: 1,
      cards: [{ rank: CardRank.TWO, suit: CardSuit.SPADES }],
    },
    startGameState: {
      melds: [
        {
          id: 1,
          elements: [
            {
              card: { rank: CardRank.THREE, suit: CardSuit.SPADES },
              userId: OTHER_USER_ID,
            },
            {
              card: { rank: CardRank.FOUR, suit: CardSuit.SPADES },
              userId: OTHER_USER_ID,
            },
            {
              card: { rank: CardRank.FIVE, suit: CardSuit.SPADES },
              userId: OTHER_USER_ID,
            },
            {
              card: { rank: CardRank.SIX, suit: CardSuit.SPADES },
              userId: OTHER_USER_ID,
            },
          ],
        },
      ],
    },
    endGameState: {
      melds: [
        {
          id: 1,
          elements: [
            {
              card: { rank: CardRank.TWO, suit: CardSuit.SPADES },
              userId: USER_ID,
            },
            {
              card: { rank: CardRank.THREE, suit: CardSuit.SPADES },
              userId: OTHER_USER_ID,
            },
            {
              card: { rank: CardRank.FOUR, suit: CardSuit.SPADES },
              userId: OTHER_USER_ID,
            },
            {
              card: { rank: CardRank.FIVE, suit: CardSuit.SPADES },
              userId: OTHER_USER_ID,
            },
            {
              card: { rank: CardRank.SIX, suit: CardSuit.SPADES },
              userId: OTHER_USER_ID,
            },
          ],
        },
      ],
    },
    expectedResult: null,
  },
];

describe("DoubleRummy - MeldHelper", () => {
  describe("performMeld", () => {
    examples.forEach((example) => {
      it(example.description, () => {
        // arrange
        const extraCards: ICard[] = [
          { rank: CardRank.SEVEN, suit: CardSuit.CLUBS },
        ];
        const startPlayerCards: ICard[] =
          example.startGameState.playerCards ??
          cloneDeep(example.meldInput.cards).concat(extraCards);
        const endGameState =
          example.endGameState ?? cloneDeep(example.startGameState);
        const endPlayerCards = endGameState.playerCards ?? extraCards;

        // act
        const result = performMeld(
          example.meldInput,
          USER_ID,
          startPlayerCards,
          example.startGameState.melds
        );

        // assert
        expect(result).to.eql(example.expectedResult);
        expect(example.startGameState.melds).to.eql(endGameState.melds);
        expect(startPlayerCards).eql(endPlayerCards);
      });
    });
  });
});
