import { ICard } from "src/shared/dtos/card";
import { IMeld, IMeldInput } from "../../shared/dtos/double_rummy/game";
import {
  areCardsARun,
  areCardsASet,
  RunDirection,
} from "../shared/card_helpers";

export enum MeldAddElementRule {
  NONE = "none",
  PREFIX = "prefix",
  SUFFIX = "suffix",
  REVERSE = "reverse",
}

export interface IValidateMeldResult {
  meldId: number;
  addElementRule: MeldAddElementRule;
  reverseCardOrder?: boolean;
}

export function validateMeld(
  meldInput: IMeldInput,
  existingMelds: IMeld[]
): null | IValidateMeldResult {
  if (meldInput.id == null) {
    if (isValidSet(meldInput.cards)) {
      return {
        meldId: existingMelds.length + 1,
        addElementRule: MeldAddElementRule.NONE,
      };
    }
    const runDirection = isValidRun(meldInput.cards);
    if (runDirection !== RunDirection.invalid) {
      return {
        meldId: existingMelds.length + 1,
        addElementRule:
          runDirection === RunDirection.descending
            ? MeldAddElementRule.REVERSE
            : MeldAddElementRule.NONE,
      };
    }
  } else {
    const existingMeld = existingMelds.find((m) => m.id === meldInput.id);
    if (existingMeld == null) {
      return null;
    }

    const existingCards = existingMeld.elements.map((e) => e.card);
    const cardsWithInputSuffix = existingCards.concat(meldInput.cards);
    if (isValidSet(cardsWithInputSuffix)) {
      return {
        meldId: existingMeld.id,
        addElementRule: MeldAddElementRule.NONE,
      };
    }
    if (isValidRun(cardsWithInputSuffix) === RunDirection.ascending) {
      return {
        meldId: existingMeld.id,
        addElementRule: MeldAddElementRule.SUFFIX,
      };
    }
    const cardsWithInputPrefix = meldInput.cards.concat(existingCards);
    if (isValidRun(cardsWithInputPrefix) === RunDirection.ascending) {
      return {
        meldId: existingMeld.id,
        addElementRule: MeldAddElementRule.PREFIX,
      };
    }
  }
  return null;
}

function isValidSet(cards: ICard[]): boolean {
  return areCardsASet(cards, 3);
}

function isValidRun(cards: ICard[]): RunDirection {
  return areCardsARun(cards, 4);
}
