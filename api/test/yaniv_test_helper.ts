import { IYanivCompletedRound } from "../src/database/models/yaniv_game";
import { YanivGameDataService } from "../src/services/yaniv/data/yaniv_game_data_service";
import { YanivGameService } from "../src/services/yaniv/yaniv_game_service";
import { ICard } from "../src/shared/dtos/yaniv/card";
import { GameState, IGameOptions, RoundScoreType } from "../src/shared/dtos/yaniv/game";
import {
  createTestCredentials,
  createTestUser,
  IUserCredentials,
} from "./test_helper";

export async function createTestYanivGame(
  userId: number,
  options: IGameOptions
): Promise<number> {
  const game = await new YanivGameService().create(userId, options);
  return game.gameId;
}

export async function joinTestYanivGame(
  userId: number,
  gameId: number
): Promise<void> {
  await new YanivGameService().join(userId, gameId);
}

interface ITestGameOptions {
  playerCards: ICard[][];
  cardsOnTopOfDiscardPile: ICard[];
  cardsInDeck: ICard[];
  playerRoundScores?: number[][]
}

interface ITestGame {
  userCredentials: IUserCredentials[];
  userIds: number[];
  gameId: number;
}

export async function createTestYanivRoundActiveGame(
  options: ITestGameOptions
): Promise<ITestGame> {
  const gameService = new YanivGameService();
  const gameDataService = new YanivGameDataService();
  const userCredentials: IUserCredentials[] = [];
  const userIds: number[] = [];
  for (let i = 0; i < options.playerCards.length; i++) {
    const creds = createTestCredentials(`test${i + 1}`);
    userCredentials.push(creds);
    userIds.push(await createTestUser(creds));
  }
  const createdGame = await gameService.create(userIds[0], { playTo: 100 });
  for (const userId of userIds.slice(1)) {
    await gameService.join(userId, createdGame.gameId);
  }
  const game = await gameDataService.get(createdGame.gameId);
  game.players.map((x, index) => (x.cardsInHand = options.playerCards[index]));
  const completedRounds: IYanivCompletedRound[][] = (options.playerRoundScores ?? []).map(roundScores => {
    return roundScores.map((roundScore, index) => {
      return { 
        userId: userIds[index],
        score: roundScore,
        scoreType: RoundScoreType.DEFAULT
      }
    })
  })
  await gameDataService.update(game.gameId, game.version, {
    state: GameState.ROUND_ACTIVE,
    actionToUserId: userIds[0],
    cardsBuriedInDiscardPile: [],
    cardsOnTopOfDiscardPile: options.cardsOnTopOfDiscardPile,
    cardsInDeck: options.cardsInDeck,
    players: game.players,
    completedRounds,
  });
  return { userCredentials, userIds, gameId: game.gameId };
}
