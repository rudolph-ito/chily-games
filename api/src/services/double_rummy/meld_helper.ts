import { ICard } from "src/shared/dtos/card";
import {
  IMeld,
  IMeldElement,
  IMeldInput,
} from "../../shared/dtos/double_rummy/game";
import {
  areCardsARun,
  areCardsASet,
  areCardsEqual,
  getCardListDifference,
  removeCardFromList,
  RunDirection,
} from "../shared/card_helpers";
import { uniqWith } from "lodash";

enum MeldAddElementRule {
  NONE = "none",
  PREFIX = "prefix",
  SUFFIX = "suffix",
  REVERSE = "reverse",
}

// Validates the meld and if valid in-place updates playerCards and existingMelds
export function performMeld(
  meldInput: IMeldInput,
  userId: number,
  playerCards: ICard[],
  existingMelds: IMeld[]
): null | string {
  if (
    uniqWith(meldInput.cards, areCardsEqual).length < meldInput.cards.length
  ) {
    return "Meld cannot contain duplicates";
  }
  if (getCardListDifference(meldInput.cards, playerCards).length !== 0) {
    return "Meld contains cards not in your hand";
  }
  const addElementRule = getMeldAddElementRule(meldInput, existingMelds);
  if (addElementRule != null) {
    applyMeld(meldInput, userId, playerCards, existingMelds, addElementRule);
    return null;
  }
  return "Invalid meld";
}

function getMeldAddElementRule(
  meldInput: IMeldInput,
  existingMelds: IMeld[]
): MeldAddElementRule | null {
  if (meldInput.id == null) {
    if (isValidSet(meldInput.cards)) {
      return MeldAddElementRule.NONE;
    }
    const runDirection = isValidRun(meldInput.cards);
    if (runDirection !== RunDirection.invalid) {
      return runDirection === RunDirection.descending
        ? MeldAddElementRule.REVERSE
        : MeldAddElementRule.NONE;
    }
  } else {
    const existingMeld = existingMelds.find((m) => m.id === meldInput.id);
    if (existingMeld == null) {
      return null;
    }
    const existingCards = existingMeld.elements.map((e) => e.card);
    const cardsWithInputSuffix = existingCards.concat(meldInput.cards);
    if (isValidSet(cardsWithInputSuffix)) {
      return MeldAddElementRule.SUFFIX;
    }
    if (isValidRun(cardsWithInputSuffix) === RunDirection.ascending) {
      return MeldAddElementRule.SUFFIX;
    }
    const cardsWithInputPrefix = meldInput.cards.concat(existingCards);
    if (isValidRun(cardsWithInputPrefix) === RunDirection.ascending) {
      return MeldAddElementRule.PREFIX;
    }
  }
  return null;
}

function applyMeld(
  meldInput: IMeldInput,
  userId: number,
  playerCards: ICard[],
  existingMelds: IMeld[],
  addElementRule: MeldAddElementRule = MeldAddElementRule.NONE
): void {
  meldInput.cards.forEach((meldedCard) =>
    removeCardFromList(playerCards, meldedCard)
  );
  const newElements: IMeldElement[] = meldInput.cards.map((card) => ({
    userId,
    card,
  }));
  if (meldInput.id != null) {
    const existingMeld = existingMelds.find((x) => x.id === meldInput.id);
    if (existingMeld == null) {
      throw new Error("Existing meld unexpectly null");
    }
    if (addElementRule === MeldAddElementRule.PREFIX) {
      existingMeld.elements = newElements.concat(existingMeld.elements);
    } else {
      existingMeld.elements = existingMeld.elements.concat(newElements);
    }
  } else {
    const newMeld: IMeld = {
      id: existingMelds.length + 1,
      elements: newElements,
    };
    if (addElementRule === MeldAddElementRule.REVERSE) {
      newMeld.elements.reverse();
    }
    existingMelds.push(newMeld);
  }
}

function isValidSet(cards: ICard[]): boolean {
  return areCardsASet(cards, 3);
}

function isValidRun(cards: ICard[]): RunDirection {
  return areCardsARun(cards, 4);
}
