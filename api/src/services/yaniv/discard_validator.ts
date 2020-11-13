import { ICard } from 'src/shared/dtos/yaniv/card';
import { areCardsEqual, rankToNumber } from './card_helpers';

export enum RunDirection {
  unknown = 0,
  ascending = 1,
  descending = 2
}

export function isValidDiscard(cards: ICard[]): boolean {
  return cards.length === 1 || areCardsASet(cards) || areCardsARun(cards)
}

export function isValidPickup(pickup: ICard, lastDiscards: ICard[]): boolean {
  if (lastDiscards.length === 1 || areCardsASet(lastDiscards)) {
    return lastDiscards.some(x => areCardsEqual(pickup, x))
  }
  if (areCardsARun(lastDiscards)) {
    return areCardsEqual(pickup, lastDiscards[0]) || areCardsEqual(pickup, lastDiscards[lastDiscards.length - 1])
  }
  return false
}

function areCardsASet(cards: ICard[]): boolean {
  if (cards.length < 2) {
    return false
  }
  const nonJokers = cards.filter(c => !c.isJoker);
  const firstCard = nonJokers[0];
  return nonJokers.every(c => c.rank == firstCard.rank);
}

function areCardsARun(cards: ICard[]): boolean {
  if (cards.length < 3) {
    return false
  }

  const cardsWithoutLeadingTrailingJokers = cards.slice()
  while (cardsWithoutLeadingTrailingJokers[0].isJoker) {
    cardsWithoutLeadingTrailingJokers.shift()
  }
  while (cardsWithoutLeadingTrailingJokers[cardsWithoutLeadingTrailingJokers.length - 1].isJoker) {
    cardsWithoutLeadingTrailingJokers.pop()
  }
  
  const firstCard = cardsWithoutLeadingTrailingJokers[0];
  const isSameSuit = cardsWithoutLeadingTrailingJokers.every(c => c.isJoker || c.suit == firstCard.suit);
  if (!isSameSuit) {
    return false
  }

  let lastRankNumber = rankToNumber[firstCard.rank];
  let expectedRankDiff = 1;
  let direction = null;
  for (const card of cardsWithoutLeadingTrailingJokers.slice(1)) {
    if (card.isJoker) {
      expectedRankDiff += 1
    } else {
      const rankNumber = rankToNumber[card.rank];
      const isExpectedAscending = rankNumber === (lastRankNumber + expectedRankDiff) % 13;
      const isExpectedDescending = rankNumber === (lastRankNumber - expectedRankDiff) % 13;
      if (direction === null) {
        if (isExpectedAscending) {
          direction = RunDirection.ascending
        } else if (isExpectedDescending) {
          direction = RunDirection.descending
        } else {
          return false
        }
      } else if (direction === RunDirection.ascending && !isExpectedAscending) {
        return false
      } else if (direction === RunDirection.descending && !isExpectedDescending) {
        return false
      }
      lastRankNumber = rankNumber;
      expectedRankDiff = 1
    }
  }
  return true;
}