import { CardRank, CardSuit, ICard } from "../../shared/dtos/card";
import shuffle from "knuth-shuffle-seeded";
import { valueOrDefault } from "../../shared/utilities/value_checker";

const NUMBER_OF_STANDARD_CARDS = 52;

const rankToNumber = {
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

export function getCardRankNumber(card: ICard): number {
  if (card.rank == null) {
    throw new Error("Expected card rank to be defined");
  }
  return rankToNumber[card.rank];
}

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

export function getCardSuitNumber(card: ICard): number {
  if (card.suit == null) {
    throw new Error("Expected card suit to be defined");
  }
  return suitToNumber[card.suit];
}

const numberToSuit = {};
Object.keys(suitToNumber).forEach(
  (key) => (numberToSuit[suitToNumber[key]] = key)
);

export function serializeCard(card: ICard): number {
  if (valueOrDefault(card.isJoker, false)) {
    if (card.jokerNumber == null) {
      throw new Error("Card missing joker number");
    }
    return NUMBER_OF_STANDARD_CARDS + card.jokerNumber;
  }
  return getCardRankNumber(card) + 13 * getCardSuitNumber(card);
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
  if (valueOrDefault(a.isJoker, false)) {
    return valueOrDefault(b.isJoker, false) && a.jokerNumber === b.jokerNumber;
  }
  return a.rank === b.rank && a.suit === b.suit;
}

export function standardDeck(): ICard[] {
  const deck: ICard[] = [];
  for (let i = 0; i < NUMBER_OF_STANDARD_CARDS; i++) {
    deck.push(deserializeCard(i));
  }
  shuffle(deck);
  return deck;
}

export function standardDeckWithTwoJokers(): ICard[] {
  const deck: ICard[] = [];
  for (let i = 0; i < NUMBER_OF_STANDARD_CARDS + 2; i++) {
    deck.push(deserializeCard(i));
  }
  shuffle(deck);
  return deck;
}

export function isCardInList(list: ICard[], card: ICard): boolean {
  return list.some((x) => areCardsEqual(x, card));
}

export function removeCardFromList(list: ICard[], card: ICard): void {
  const index = list.findIndex((x) => areCardsEqual(x, card));
  list.splice(index, 1);
}

export function areCardHandsEquivalent(
  cardsA: ICard[],
  cardsB: ICard[]
): boolean {
  const setA: Set<number> = new Set<number>(
    cardsA.map((x) => serializeCard(x))
  );
  const setB: Set<number> = new Set<number>(
    cardsB.map((x) => serializeCard(x))
  );
  return setSymmetricDifference(setA, setB).size === 0;
}

// Returns cards in cardsA that are not in cardsB
export function getCardListDifference(
  cardsA: ICard[],
  cardsB: ICard[]
): ICard[] {
  const setB: Set<number> = new Set<number>(
    cardsB.map((x) => serializeCard(x))
  );
  const difference: ICard[] = [];
  for (const card of cardsA) {
    if (!setB.has(serializeCard(card))) {
      difference.push(card);
    }
  }
  return difference;
}

function setSymmetricDifference<T>(setA: Set<T>, setB: Set<T>): Set<T> {
  const difference = new Set<T>(setA);
  setB.forEach((elem) => {
    if (difference.has(elem)) {
      difference.delete(elem);
    } else {
      difference.add(elem);
    }
  });
  return difference;
}

export function areCardsASet(cards: ICard[], minimumSize: number): boolean {
  if (cards.length < minimumSize) {
    return false;
  }
  const nonJokers = cards.filter((c) => !valueOrDefault(c.isJoker, false));
  const firstCard = nonJokers[0];
  return nonJokers.every((c) => c.rank === firstCard.rank);
}

export enum RunDirection {
  invalid = 0,
  ascending = 1,
  descending = 2,
}

export function areCardsARun(
  cards: ICard[],
  minimumSize: number
): RunDirection {
  if (cards.length < minimumSize) {
    return RunDirection.invalid;
  }

  const normalizedCards = removeLeadingAndTrailingJokers(cards);

  const firstCard = normalizedCards[0];
  const isSameSuit = normalizedCards.every(
    (c) => valueOrDefault(c.isJoker, false) || c.suit === firstCard.suit
  );
  if (!isSameSuit) {
    return RunDirection.invalid;
  }

  let lastRankNumber = getCardRankNumber(firstCard);
  let expectedRankDiff = 1;
  let direction: RunDirection | null = null;
  for (const card of normalizedCards.slice(1)) {
    if (valueOrDefault(card.isJoker, false)) {
      expectedRankDiff += 1;
    } else {
      const rankNumber = getCardRankNumber(card);
      const isExpectedAscending =
        rankNumber === (lastRankNumber + expectedRankDiff) % 13;
      const isExpectedDescending =
        rankNumber === (lastRankNumber - expectedRankDiff + 13) % 13;
      if (direction == null) {
        if (isExpectedAscending) {
          direction = RunDirection.ascending;
        } else if (isExpectedDescending) {
          direction = RunDirection.descending;
        } else {
          return RunDirection.invalid;
        }
      } else if (direction === RunDirection.ascending && !isExpectedAscending) {
        return RunDirection.invalid;
      } else if (
        direction === RunDirection.descending &&
        !isExpectedDescending
      ) {
        return RunDirection.invalid;
      }
      lastRankNumber = rankNumber;
      expectedRankDiff = 1;
    }
  }

  if (direction == null) {
    throw new Error("direction unexpectedly null");
  }
  return direction;
}

function removeLeadingAndTrailingJokers(cards: ICard[]): ICard[] {
  const newCards = cards.slice();
  while (newCards.length > 0 && valueOrDefault(newCards[0].isJoker, false)) {
    newCards.shift();
  }
  while (
    newCards.length > 0 &&
    valueOrDefault(newCards[newCards.length - 1].isJoker, false)
  ) {
    newCards.pop();
  }
  return newCards;
}
