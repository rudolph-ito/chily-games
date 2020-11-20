import { CardRank, CardSuit, ICard } from "../../shared/dtos/yaniv/card";
import shuffle from "knuth-shuffle-seeded";

const NUMBER_OF_STANDARD_CARDS = 52;

export const rankToNumber = {
  [CardRank.ACE]: 0,
  [CardRank.TWO]: 1,
  [CardRank.THREE]: 2,
  [CardRank.FOUR]: 3,
  [CardRank.FIVE]: 4,
  [CardRank.SIX]: 5,
  [CardRank.SEVEN]: 6,
  [CardRank.EIGHT]: 7,
  [CardRank.NINE]: 8,
  [CardRank.TEN]: 9,
  [CardRank.JACK]: 10,
  [CardRank.QUEEN]: 11,
  [CardRank.KING]: 12,
};

const numberToRank = {};
Object.keys(rankToNumber).forEach(
  (key) => (numberToRank[rankToNumber[key]] = key)
);

const suitToNumber = {
  [CardSuit.CLUBS]: 0,
  [CardSuit.DIAMONDS]: 1,
  [CardSuit.HEARTS]: 2,
  [CardSuit.SPADES]: 3,
};

const numberToSuit = {};
Object.keys(suitToNumber).forEach(
  (key) => (numberToSuit[suitToNumber[key]] = key)
);

export function serializeCard(card: ICard): number {
  if (card.isJoker) {
    return NUMBER_OF_STANDARD_CARDS + card.jokerNumber;
  }
  return rankToNumber[card.rank] + 13 * suitToNumber[card.suit];
}

export function deserializeCard(cardNumber: number): ICard {
  if (cardNumber >= NUMBER_OF_STANDARD_CARDS) {
    return {
      isJoker: true,
      jokerNumber: cardNumber - NUMBER_OF_STANDARD_CARDS,
    };
  }
  const rankNumber = cardNumber % 13;
  const suitNumber = (cardNumber - rankNumber) / 13;
  return { rank: numberToRank[rankNumber], suit: numberToSuit[suitNumber] };
}

export function areCardsEqual(a: ICard, b: ICard): boolean {
  if (a.isJoker) {
    return b.isJoker && a.jokerNumber === b.jokerNumber;
  }
  return a.rank === b.rank && a.suit === b.suit;
}

export function standardDeckWithTwoJokers(): ICard[] {
  const deck: ICard[] = [];
  for (let i = 0; i < NUMBER_OF_STANDARD_CARDS + 2; i++) {
    deck.push(deserializeCard(i));
  }
  shuffle(deck)
  return deck;
}
