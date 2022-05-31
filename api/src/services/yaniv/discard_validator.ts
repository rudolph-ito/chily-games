import { ICard } from "../../shared/dtos/card";
import {
  areCardsARun,
  areCardsASet,
  areCardsEqual,
  isCardInList,
  RunDirection,
} from "../shared/card_helpers";

export function isValidDiscard(cards: ICard[]): boolean {
  return cards.length === 1 || isValidSet(cards) || isValidRun(cards);
}

export function isValidPickup(pickup: ICard, lastDiscards: ICard[]): boolean {
  if (lastDiscards.length === 1 || isValidSet(lastDiscards)) {
    return isCardInList(lastDiscards, pickup);
  }
  if (isValidRun(lastDiscards)) {
    return (
      areCardsEqual(pickup, lastDiscards[0]) ||
      areCardsEqual(pickup, lastDiscards[lastDiscards.length - 1])
    );
  }
  return false;
}

function isValidSet(cards: ICard[]): boolean {
  return areCardsASet(cards, 2);
}

function isValidRun(cards: ICard[]): boolean {
  return areCardsARun(cards, 3) !== RunDirection.invalid;
}
