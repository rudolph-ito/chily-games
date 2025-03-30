import { IRummikubRoundPlayerScore } from "../src/database/models/rummikub_game";
import { RummikubGameDataService } from "../src/services/rummikub/data/rummikub_game_data_service";
import { RummikubGameService } from "../src/services/rummikub/rummikub_game_service";
import {
  GameState,
  IGameOptions,
  INullableTile,
  IUpdateSets,
} from "../src/shared/dtos/rummikub/game";
import { ITile } from "../src/shared/dtos/rummikub/tile";
import {
  createTestCredentials,
  createTestUser,
  IUserCredentials,
} from "./test_helper";

export async function joinTestRummikubGame(
  userId: number,
  gameId: number
): Promise<void> {
  await new RummikubGameService().join(userId, gameId);
}

interface ITestGameOptions {
  sets: INullableTile[];
  playerTiles: INullableTile[][];
  tilePool: ITile[];
  latestUpdateSets?: IUpdateSets;
  lastValidUpdateSets?: IUpdateSets;
  playerHasPlayedInitialMeld?: boolean[];
  playerPassedLastTurn?: boolean[];
  playerRoundScores?: number[][];
  createOptions?: IGameOptions;
  state?: GameState;
}

interface ITestGame {
  userCredentials: IUserCredentials[];
  userIds: number[];
  gameId: number;
}

export async function createTestRummikubGame(
  options: ITestGameOptions
): Promise<ITestGame> {
  const gameService = new RummikubGameService();
  const gameDataService = new RummikubGameDataService();
  const userCredentials: IUserCredentials[] = [];
  const userIds: number[] = [];
  for (let i = 0; i < options.playerTiles.length; i++) {
    const creds = createTestCredentials(`test${i + 1}`);
    userCredentials.push(creds);
    userIds.push(await createTestUser(creds));
  }
  const createdGame = await gameService.create(
    userIds[0],
    options.createOptions ?? {
      playTo: 100,
      hideTileCount: true,
    }
  );
  for (const userId of userIds.slice(1)) {
    await gameService.join(userId, createdGame.gameId);
  }
  const game = await gameDataService.get(createdGame.gameId);
  game.players.forEach((x, index) => {
    x.hasPlayedInitialMeld =
      options.playerHasPlayedInitialMeld?.[index] ?? false;
    x.passedLastTurn = options.playerPassedLastTurn?.[index] ?? false;
    x.tiles = options.playerTiles[index];
  });
  const completedRounds: IRummikubRoundPlayerScore[][] = (
    options.playerRoundScores ?? []
  ).map((roundScores) => {
    return roundScores.map((roundScore, index) => {
      return {
        userId: userIds[index],
        score: roundScore,
      };
    });
  });
  await gameDataService.update(game.gameId, game.version, {
    state: options.state ?? GameState.ROUND_ACTIVE,
    actionToUserId: userIds[0],
    latestUpdateSets: options.latestUpdateSets,
    lastValidUpdateSets: options.lastValidUpdateSets,
    sets: options.sets,
    players: game.players,
    tilePool: options.tilePool,
    completedRounds,
  });
  return { userCredentials, userIds, gameId: game.gameId };
}
