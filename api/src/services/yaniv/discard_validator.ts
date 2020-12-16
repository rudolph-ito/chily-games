import { valueOrDefault } from "../../shared/utilities/value_checker";
import { ICard } from "../../shared/dtos/yaniv/card";
import { areCardsEqual, getCardRankNumber } from "./card_helpers";

export enum RunDirection {
  unknown = 0,
  ascending = 1,
  descending = 2,
}

export function isValidDiscard(cards: ICard[]): boolean {
  return cards.length === 1 || areCardsASet(cards) || areCardsARun(cards);
}

export function isValidPickup(pickup: ICard, lastDiscards: ICard[]): boolean {
  if (lastDiscards.length === 1 || areCardsASet(lastDiscards)) {
    return lastDiscards.some((x) => areCardsEqual(pickup, x));
  }
  if (areCardsARun(lastDiscards)) {
    return (
      areCardsEqual(pickup, lastDiscards[0]) ||
      areCardsEqual(pickup, lastDiscards[lastDiscards.length - 1])
    );
  }
  return false;
}

function areCardsASet(cards: ICard[]): boolean {
  if (cards.length < 2) {
    return false;
  }
  const nonJokers = cards.filter((c) => !valueOrDefault(c.isJoker, false));
  const firstCard = nonJokers[0];
  return nonJokers.every((c) => c.rank === firstCard.rank);
}

function areCardsARun(cards: ICard[]): boolean {
  if (cards.length < 3) {
    return false;
  }

  const normalizedCards = removeLeadingAndTrailingJokers(cards);

  const firstCard = normalizedCards[0];
  const isSameSuit = normalizedCards.every(
    (c) => valueOrDefault(c.isJoker, false) || c.suit === firstCard.suit
  );
  if (!isSameSuit) {
    return false;
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
          return false;
        }
      } else if (direction === RunDirection.ascending && !isExpectedAscending) {
        return false;
      } else if (
        direction === RunDirection.descending &&
        !isExpectedDescending
      ) {
        return false;
      }
      lastRankNumber = rankNumber;
      expectedRankDiff = 1;
    }
  }
  return true;
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
