import { ICard } from "src/shared/dtos/card";
import {
  DiscardRestriction,
  IDiscardInput,
  IDiscardPile,
} from "../../shared/dtos/double_rummy/game";
import { isCardInList, removeCardFromList } from "../shared/card_helpers";

const RESTRICTION_THRESHOLD = 5;

// Validate discard and if valid, in place updates playerCards and discardPile
export function performDiscard(
  input: IDiscardInput,
  playerCards: ICard[],
  discardPile: IDiscardPile
): null | string {
  resetRestriction(discardPile);
  if (
    (input.A != null && input.B != null) ||
    (input.A == null && input.B == null)
  ) {
    return "Must specify exactly one discard";
  }
  if (
    (input.A != null && !isCardInList(playerCards, input.A)) ||
    (input.B != null && !isCardInList(playerCards, input.B))
  ) {
    return "Discard not in your hand";
  }
  if (
    (input.A != null &&
      discardPile.restriction === DiscardRestriction.MUST_DISCARD_TO_B) ||
    (input.B != null &&
      discardPile.restriction === DiscardRestriction.MUST_DISCARD_TO_A)
  ) {
    return "Must discard to other pile";
  }
  if (input.A != null) {
    removeCardFromList(playerCards, input.A);
    discardPile.A.push(input.A);
  }
  if (input.B != null) {
    removeCardFromList(playerCards, input.B);
    discardPile.B.push(input.B);
  }
  resetRestriction(discardPile);
  return null;
}

function resetRestriction(discardPile: IDiscardPile): void {
  if (discardPile.A.length + RESTRICTION_THRESHOLD <= discardPile.B.length) {
    discardPile.restriction = DiscardRestriction.MUST_DISCARD_TO_A;
  }
  if (discardPile.B.length + RESTRICTION_THRESHOLD <= discardPile.A.length) {
    discardPile.restriction = DiscardRestriction.MUST_DISCARD_TO_B;
  }
  if (
    (discardPile.restriction === DiscardRestriction.MUST_DISCARD_TO_A &&
      discardPile.A.length >= discardPile.B.length) ||
    (discardPile.restriction === DiscardRestriction.MUST_DISCARD_TO_B &&
      discardPile.B.length >= discardPile.A.length)
  ) {
    discardPile.restriction = DiscardRestriction.NONE;
  }
}
