import { IMeld } from "../../shared/dtos/double_rummy/game";

export interface IMeldResult {
  meldId?: number;
  success: boolean;
}

export function validateMeld(meld: IMeld, existingMelds: IMeld[]): IMeldResult {
  // check if meld adds onto any existing melds, if so, return that id and success: true
  // check if standalone meld, if so, return existing melds.length + 1 and sucesss: true
  return { success: false };
}
