import { IOhHeckPlayer } from "../src/database/models/oh_heck_game";
import { OhHeckGameDataService } from "../src/services/oh_heck/data/oh_heck_game_data_service";
import { OhHeckGameService } from "../src/services/oh_heck/oh_heck_game_service";
import { GameState } from "../src/shared/dtos/oh_heck/game";
import { ICard } from "../src/shared/dtos/card";
import {
  createTestCredentials,
  createTestUser,
  IUserCredentials,
} from "./test_helper";

interface ITestGamePlayerOptions {
  cardsInHand?: ICard[];
  bet?: number;
  tricksTaken?: number;
}

interface ITestGameOptions {
  players: ITestGamePlayerOptions[];
  gameState: GameState;
  currentTrick?: ICard[];
  completedRounds?: number[][];
  actionToIndex?: number;
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
  const players: IOhHeckPlayer[] = options.players.map(
    (playerOptions, index) => {
      return {
        userId: userIds[index],
        cardsInHand: playerOptions.cardsInHand ?? [],
        bet: playerOptions.bet ?? null,
        tricksTaken: playerOptions.tricksTaken ?? 0,
      };
    }
  );
  const currentTrick = (options.currentTrick ?? []).map((card, index) => {
    return { userId: userIds[index], card };
  });
  const completedRounds = (options.completedRounds ?? []).map((round) =>
    round.map((score, index) => ({
      score,
      bet: 0,
      tricksTaken: 0,
      userId: userIds[index],
    }))
  );
  await gameDataService.update(game.gameId, game.version, {
    state: options.gameState,
    actionToUserId: userIds[options.actionToIndex ?? 0],
    players,
    currentTrick,
    completedRounds,
  });
  return { userCredentials, userIds, gameId: game.gameId };
}
