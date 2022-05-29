import { IRummyPlayerScore } from "../src/database/models/rummy_game";
import {
  IDiscardState,
  GameState,
  IPickupOutput,
  IGame,
  IMeldEvent,
  IPickupInput,
  IMeldInput,
} from "../src/shared/dtos/rummy/game";
import { ICard } from "../src/shared/dtos/card";
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
  state?: GameState;
  roundScores?: number[][];
}

interface ITestGame {
  userCredentials: IUserCredentials[];
  userIds: number[];
  gameId: number;
}

interface ITestPickupResult {
  error?: Error;
  result?: IPickupOutput;
  game?: IGame;
}

interface ITestPickupSuccessResult {
  result: IPickupOutput;
  game: IGame;
}

interface ITestMeldResult {
  error?: Error;
  result?: IMeldEvent;
  game?: IGame;
}

interface ITestMeldSuccessResult {
  result: IMeldEvent;
  game: IGame;
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
    numberOfDiscardPiles: options.discardState?.piles.length ?? 1,
    pointThreshold: 500,
  });
  for (const userId of userIds.slice(1)) {
    await gameService.join(userId, createdGame.gameId);
  }
  const game = await gameDataService.get(createdGame.gameId);
  game.players.map((x, index) => (x.cardsInHand = options.playerCards[index]));
  const completedRounds: IRummyPlayerScore[][] = [];
  if (options.roundScores != null) {
    options.roundScores.forEach((roundScore) => {
      completedRounds.push(
        userIds.map((userId, index) => ({ userId, score: roundScore[index] }))
      );
    });
  }
  await gameDataService.update(game.gameId, game.version, {
    state: options.state ?? GameState.PICKUP,
    actionToUserId: userIds[0],
    discardState: options.discardState ?? game.discardState,
    cardsInDeck: options.cardsInDeck ?? game.cardsInDeck,
    players: game.players,
    completedRounds,
  });
  return { userCredentials, userIds, gameId: game.gameId };
}

async function testPickup(
  userId: number,
  gameId: number,
  action: IPickupInput
): Promise<ITestPickupResult> {
  let error: Error | undefined;
  let game: IGame | undefined;
  let result: IPickupOutput | undefined;
  try {
    result = await new RummyGameService().pickup(userId, gameId, action);
    game = await new RummyGameService().get(userId, gameId);
  } catch (e) {
    error = e;
  }
  return { result, game, error };
}

export async function testPickupExpectError(
  userId: number,
  gameId: number,
  input: IPickupInput
): Promise<Error> {
  const { result, error } = await testPickup(userId, gameId, input);
  if (error == null) {
    throw new Error(
      `Expected error but didn't get one, result: ${JSON.stringify(result)}`
    );
  }
  return error;
}

export async function testPickupExpectSuccess(
  userId: number,
  gameId: number,
  input: IPickupInput
): Promise<ITestPickupSuccessResult> {
  const { result, game, error } = await testPickup(userId, gameId, input);
  if (result == null || game == null) {
    throw new Error(`Expected no error but got one, result: ${error}`);
  }
  return { result, game };
}

async function testMeld(
  userId: number,
  gameId: number,
  action: IMeldInput
): Promise<ITestMeldResult> {
  let error: Error | undefined;
  let game: IGame | undefined;
  let result: IMeldEvent | undefined;
  try {
    result = await new RummyGameService().meld(userId, gameId, action);
    game = await new RummyGameService().get(userId, gameId);
  } catch (e) {
    error = e;
  }
  return { result, game, error };
}

export async function testMeldExpectError(
  userId: number,
  gameId: number,
  input: IMeldInput
): Promise<Error> {
  const { result, error } = await testMeld(userId, gameId, input);
  if (error == null) {
    throw new Error(
      `Expected error but didn't get one, result: ${JSON.stringify(result)}`
    );
  }
  return error;
}

export async function testMeldExpectSuccess(
  userId: number,
  gameId: number,
  input: IMeldInput
): Promise<ITestMeldSuccessResult> {
  const { result, game, error } = await testMeld(userId, gameId, input);
  if (result == null || game == null) {
    throw new Error(`Expected no error but got one, result: ${error}`);
  }
  return { result, game };
}
