import { ICard } from "../../shared/dtos/card";
import {
  IDiscardPile,
  IMeldInput,
  IPickupInput,
} from "../../shared/dtos/double_rummy/game";
import { areCardsEqual, getCardListDifference } from "../shared/card_helpers";

export function validatePickup(
  input: IPickupInput,
  discardPile: IDiscardPile,
  playerCards: ICard[]
): null | string {
  const { pickup, meld } = input;
  if (
    pickup == null ||
    isCardTopOfDiscard(discardPile.A, pickup) ||
    isCardTopOfDiscard(discardPile.B, pickup)
  ) {
    if (meld != null) {
      return "Cannot meld when picking up from deck or top of discard pile";
    }
  } else {
    for (const pile of [discardPile.A, discardPile.B]) {
      const result = validateDeepPickup(pile, pickup, meld, playerCards);
      if (result.success) {
        return null;
      } else if (result.error != null) {
        return result.error;
      }
    }
    return "Invalid pickup. Should be null or card from one of the discard piles";
  }
  return null;
}

function isCardTopOfDiscard(pile: ICard[], card: ICard): boolean {
  if (pile.length > 0) {
    return areCardsEqual(pile[pile.length - 1], card);
  }
  return false;
}

interface IDeepPickupValidationResult {
  error?: string;
  success: boolean;
}

function validateDeepPickup(
  pile: ICard[],
  pickup: ICard,
  meld: IMeldInput | undefined,
  playerCards: ICard[]
): IDeepPickupValidationResult {
  const pileIndex = pile.findIndex((card) => areCardsEqual(card, pickup));
  if (pileIndex === -1) {
    return { success: false };
  }
  if (meld == null) {
    return {
      success: false,
      error:
        "Meld is required when picking up a buried card from a discard pile",
    };
  }
  const meldedCardsNotInHand = getCardListDifference(meld.cards, playerCards);
  const difference = getCardListDifference(
    meldedCardsNotInHand,
    pile.slice(pileIndex)
  );
  if (difference.length === 0) {
    return { success: true };
  }
  return {
    success: false,
    error: `The following cards are not in the users hand or part of what is picked up: ${JSON.stringify(
      difference
    )}`,
  };
}
