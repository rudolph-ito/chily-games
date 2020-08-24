import { Injectable } from "@angular/core";
import { IGame, Action } from "../shared/dtos/game";
import { doesNotHaveValue } from "../shared/utilities/value_checker";

@Injectable({
  providedIn: "root",
})
export class GameFormatterService {
  getGameStatus(game: IGame): string {
    if (game.action === Action.SETUP) {
      if (doesNotHaveValue(game.actionTo)) {
        return "Both players setting up";
      } else {
        return `${game.actionTo} setting up`;
      }
    } else if (game.action === Action.PLAY) {
      return `${game.actionTo} to play`;
    } else if (game.action === Action.COMPLETE) {
      return `${game.actionTo} has been defeated`;
    }
    return "TODO";
  }
}
