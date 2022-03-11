import { ICard } from "../../shared/dtos/card";
import {
  IDiscardPile,
  IPickupInput,
} from "../../shared/dtos/double_rummy/game";
import { areCardsEqual, getCardListDifference } from "../shared/card_helpers";

export function validatePickup(
  input: IPickupInput,
  discardPile: IDiscardPile,
  getPlayerCards: () => ICard[]
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
    if (meld == null) {
      return "Meld is required when picking up a buried card from a discard pile";
    }
    const playerCards = getPlayerCards();
    const meldedCardsNotInHand = meld.cards.filter(
      (meldCard) =>
        !playerCards.some((playerCard) => areCardsEqual(playerCard, meldCard))
    );
    for (const pile of [discardPile.A, discardPile.B]) {
      const result = validateDeepPickup(pile, pickup, meldedCardsNotInHand);
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

export interface IDeepPickupValidationResult {
  error?: string;
  success: boolean;
}

function validateDeepPickup(
  pile: ICard[],
  pickup: ICard,
  otherCardsPickedUpForMeld: ICard[]
): IDeepPickupValidationResult {
  const pileIndex = pile.findIndex((card) => areCardsEqual(card, pickup));
  if (pileIndex === -1) {
    return { success: false };
  }
  const difference = getCardListDifference(
    otherCardsPickedUpForMeld,
    pile.slice(pileIndex + 1)
  );
  if (difference.length === 0) {
    return { success: true };
  }
  return {
    error: `The following cards are not in the users hand or part of what is picked up: ${JSON.stringify(
      difference
    )}`,
    success: false,
  };
}
