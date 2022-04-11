import { IRummyPlayerScore } from "../src/database/models/rummy_game";
import { IDiscardState, GameState } from "../../shared/dtos/rummy/game";
import { ICard } from "../../shared/dtos/card";
import { RummyGameDataService } from "../src/services/rummy/data/rummy_game_data_service";
import { RummyGameService } from "../src/services/rummy/rummy_game_service";
import {
  createTestCredentials,
  createTestUser,
  IUserCredentials,
} from "./test_helper";

interface ITestGameOptions {
  playerCards: ICard[][];
  discardState?: IDiscardState;
  cardsInDeck?: ICard[];
}

interface ITestGame {
  userCredentials: IUserCredentials[];
  userIds: number[];
  gameId: number;
}

export async function createTestRummyGame(
  options: ITestGameOptions
): Promise<ITestGame> {
  const gameService = new RummyGameService();
  const gameDataService = new RummyGameDataService();
  const userCredentials: IUserCredentials[] = [];
  const userIds: number[] = [];
  for (let i = 0; i < options.playerCards.length; i++) {
    const creds = createTestCredentials(`test${i + 1}`);
    userCredentials.push(creds);
    userIds.push(await createTestUser(creds));
  }
  const createdGame = await gameService.create(userIds[0], {
    numberOfDiscardPiles: 1,
    pointThreshold: 500,
  });
  for (const userId of userIds.slice(1)) {
    await gameService.join(userId, createdGame.gameId);
  }
  const game = await gameDataService.get(createdGame.gameId);
  game.players.map((x, index) => (x.cardsInHand = options.playerCards[index]));
  const completedRounds: IRummyPlayerScore[][] = [];
  await gameDataService.update(game.gameId, game.version, {
    state: GameState.PICKUP,
    actionToUserId: userIds[0],
    discardState: options.discardState ?? game.discardState,
    cardsInDeck: options.cardsInDeck ?? game.cardsInDeck,
    players: game.players,
    completedRounds,
  });
  return { userCredentials, userIds, gameId: game.gameId };
}
