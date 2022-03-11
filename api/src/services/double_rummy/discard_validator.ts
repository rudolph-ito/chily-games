import {
  IDiscardInput,
  IDiscardPile,
} from "../../shared/dtos/double_rummy/game";

export function validateDiscard(
  input: IDiscardInput,
  discardPile: IDiscardPile
): boolean {
  // validate discard is from users hand
  // if must discard to one, validate discarding to proper place
  return true;
}
