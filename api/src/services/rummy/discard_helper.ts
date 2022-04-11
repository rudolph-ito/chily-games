import { ICard } from "src/shared/dtos/card";
import { IDiscardInput, IDiscardState } from "../../shared/dtos/rummy/game";
import { isCardInList, removeCardFromList } from "../shared/card_helpers";

const RESTRICTION_THRESHOLD = 5;

// Validate discard and if valid, in place updates playerCards and discardState
export function performDiscard(
  input: IDiscardInput,
  playerCards: ICard[],
  discardState: IDiscardState
): null | string {
  resetRestriction(discardState);
  if (input.card == null) {
    return "Must specify a card";
  }
  if (input.pileIndex < 0 || input.pileIndex > discardState.piles.length) {
    return "Invalid pile index";
  }
  if (!isCardInList(playerCards, input.card)) {
    return "Discard not in your hand";
  }
  if (
    discardState.mustDiscardToPileIndex != null &&
    input.pileIndex !== discardState.mustDiscardToPileIndex
  ) {
    return "Must discard to a different pile";
  }
  removeCardFromList(playerCards, input.card);
  discardState.piles[input.pileIndex].push(input.card);
  resetRestriction(discardState);
  return null;
}

function resetRestriction(discardState: IDiscardState): void {
  if (discardState.piles.length === 1) {
    return;
  }
  let largestPileSize = 0;
  let smallestPileSize = Infinity;
  let smallestPileIndex = 0;
  discardState.piles.forEach((pile, pileIndex) => {
    if (pile.length > largestPileSize) {
      largestPileSize = pile.length;
    }
    if (pile.length < smallestPileSize) {
      smallestPileSize = pile.length;
      smallestPileIndex = pileIndex;
    }
  });
  if (smallestPileSize + RESTRICTION_THRESHOLD <= largestPileSize) {
    discardState.mustDiscardToPileIndex = smallestPileIndex;
  }
}
