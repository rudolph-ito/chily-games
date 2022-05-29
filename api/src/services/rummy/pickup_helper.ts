import { ICard } from "../../shared/dtos/card";
import {
  IDiscardState,
  IMeldInput,
  IPickupInput,
} from "../../shared/dtos/rummy/game";
import { areCardsEqual } from "../shared/card_helpers";

// Validates the pickup and if valid in-place updates cardsInDeck / discardState / playerCards
export function performPickup(
  input: IPickupInput,
  cardsInDeck: ICard[],
  discardState: IDiscardState,
  playerCards: ICard[]
): null | string {
  const { pickup, deepPickupMeld } = input;
  if (pickup == null) {
    if (deepPickupMeld != null) {
      return "Cannot meld when picking up from deck";
    }
    const deckCard = cardsInDeck.pop();
    if (deckCard == null) {
      return "Cannot pick up from empty deck";
    }
    playerCards.push(deckCard);
    return null;
  }
  for (const pile of discardState.piles) {
    if (isCardTopOfDiscard(pile, pickup)) {
      if (deepPickupMeld != null) {
        return "Cannot meld when picking up from top of discard pile";
      }
      pile.pop();
      playerCards.push(pickup);
      return null;
    }
    const result = validateDeepPickup(
      pile,
      pickup,
      deepPickupMeld,
      playerCards
    );
    if (result.error != null) {
      return result.error;
    }
    if (result.success) {
      return null;
    }
  }
  return "Invalid pickup. Should be null or card from one of the discard piles";
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
  deepPickupMeld: IMeldInput | undefined,
  playerCards: ICard[]
): IDeepPickupValidationResult {
  const pileIndex = pile.findIndex((card) => areCardsEqual(card, pickup));
  if (pileIndex === -1) {
    return { success: false };
  }
  if (deepPickupMeld == null) {
    return {
      success: false,
      error:
        "Meld is required when picking up a buried card from a discard pile",
    };
  }
  if (deepPickupMeld.cards.find((c) => areCardsEqual(c, pickup)) == null) {
    return {
      success: false,
      error: "Meld must include the card being picked up",
    };
  }
  const cardsPickedUp = pile.slice(pileIndex);
  playerCards.push(...cardsPickedUp);

  pile.splice(pileIndex, cardsPickedUp.length);
  return { success: true };
}
