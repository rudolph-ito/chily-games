import { ICard } from "src/shared/dtos/card";
import {
  DiscardRestriction,
  IDiscard,
} from "../../shared/dtos/double_rummy/game";
import { isCardInList } from "../shared/card_helpers";

export function validateDiscard(
  input: IDiscard,
  discardRestriction: DiscardRestriction,
  playerCards: ICard[]
): null | string {
  if (
    (input.A != null && !isCardInList(playerCards, input.A)) ||
    (input.B != null && !isCardInList(playerCards, input.B))
  ) {
    return "Discard not in your hand";
  }
  if (
    (input.A != null &&
      discardRestriction === DiscardRestriction.MUST_DISCARD_TO_B) ||
    (input.B != null &&
      discardRestriction === DiscardRestriction.MUST_DISCARD_TO_A)
  ) {
    return "Must discard to other pile";
  }
  return null;
}
