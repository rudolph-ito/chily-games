import { IOhHeckPlayer } from "../src/database/models/oh_heck_game";
import { OhHeckGameDataService } from "../src/services/oh_heck/data/oh_heck_game_data_service";
import { OhHeckGameService } from "../src/services/oh_heck/oh_heck_game_service";
import { GameState, ITrickPlayerCard } from "../src/shared/dtos/oh_heck/game";
import { ICard } from "../src/shared/dtos/card";
import {
  createTestCredentials,
  createTestUser,
  IUserCredentials,
} from "./test_helper";

interface ITestGamePlayerOptions {
  cardsInHand: ICard[];
  bet?: number;
  tricksTaken?: number;
}

interface ITestGameOptions {
  players: ITestGamePlayerOptions[];
  gameState: GameState;
  currentTrick?: ITrickPlayerCard[];
}

interface ITestGame {
  userCredentials: IUserCredentials[];
  userIds: number[];
  gameId: number;
}

export async function createTestOhHeckGame(
  options: ITestGameOptions
): Promise<ITestGame> {
  const gameService = new OhHeckGameService();
  const gameDataService = new OhHeckGameDataService();
  const userCredentials: IUserCredentials[] = [];
  const userIds: number[] = [];
  for (let i = 0; i < options.players.length; i++) {
    const creds = createTestCredentials(`test${i + 1}`);
    userCredentials.push(creds);
    userIds.push(await createTestUser(creds));
  }
  const createdGame = await gameService.create(userIds[0], { halfGame: false });
  for (const userId of userIds.slice(1)) {
    await gameService.join(userId, createdGame.gameId);
  }
  const game = await gameDataService.get(createdGame.gameId);
  const players: IOhHeckPlayer[] = options.players.map((playerOptions, index) => {
    return {
      userId: userIds[index],
      cardsInHand: playerOptions.cardsInHand,
      bet: playerOptions.bet ?? null,
      tricksTaken: playerOptions.tricksTaken ?? 0
    }
  })
  await gameDataService.update(game.gameId, game.version, {
    state: options.gameState,
    actionToUserId: userIds[0],
    players,
  });
  return { userCredentials, userIds, gameId: game.gameId };
}
