import { CardRank, CardSuit, ICard } from "../../shared/dtos/card";
import {
  createTestCredentials,
  createTestUser,
  resetDatabaseBeforeEach,
} from "../../../test/test_helper";
import { GameState, IBetEvent, IGame } from "../../shared/dtos/oh_heck/game";
import { OhHeckGameService } from "./oh_heck_game_service";
import { expect } from "chai";
import { NotFoundError, ValidationError } from "../shared/exceptions";
import { createTestOhHeckGame } from "../../../test/oh_heck_test_helper";

interface ITestBetResult {
  error?: Error;
  result?: IBetEvent;
  game?: IGame;
}

interface ITestBetSuccessResult {
  result: IBetEvent;
  game: IGame;
}

function mockCards(count: number): ICard[] {
  return new Array(count).fill({ suit: CardSuit.CLUBS, rank: CardRank.ACE });
}

async function testBet(
  userId: number,
  gameId: number,
  bet: number
): Promise<ITestBetResult> {
  let error: Error | undefined;
  let game: IGame | undefined;
  let result: IBetEvent | undefined;
  try {
    result = await new OhHeckGameService().placeBet(userId, gameId, bet);
    game = await new OhHeckGameService().get(userId, gameId);
  } catch (e) {
    error = e;
  }
  return { result, game, error };
}

async function testBetExpectError(
  userId: number,
  gameId: number,
  bet: number
): Promise<Error> {
  const { result, error } = await testBet(userId, gameId, bet);
  if (error == null) {
    throw new Error(
      `Expected error but didn't get one, result: ${JSON.stringify(result)}`
    );
  }
  return error;
}

async function testBetExpectSuccess(
  userId: number,
  gameId: number,
  bet: number
): Promise<ITestBetSuccessResult> {
  const { result, error, game } = await testBet(userId, gameId, bet);
  if (error != null) {
    throw new Error(
      `Expected no error but got one, error: ${error.stack ?? error.message}`
    );
  }
  if (game == null) {
    throw new Error(`Expected game but it is null`);
  }
  if (result == null) {
    throw new Error(`Expected result but it is null`);
  }
  return { game, result };
}

describe.only("OhHeckGameService", () => {
  resetDatabaseBeforeEach();

  describe("startRound", () => {
    it("deals to all users and updates the game state (from players joining)", async () => {
      // arrange
      const {
        userIds: [user1Id],
        gameId,
      } = await createTestOhHeckGame({
        players: [{}, {}],
        gameState: GameState.PLAYERS_JOINING,
      });

      // act
      await new OhHeckGameService().startRound(user1Id, gameId);

      // assert
      const game = await new OhHeckGameService().get(user1Id, gameId);
      expect(game.state).to.eql(GameState.BETTING);
      expect(game.actionToUserId).to.eql(user1Id);
      expect(game.playerStates[0].cards.length).to.eql(7);
      expect(game.playerStates[1].numberOfCards).to.eql(7);
    });

    it("deals to all users and updates the game state (from completed round)", async () => {
      // arrange
      const {
        userIds: [user1Id, user2Id],
        gameId,
      } = await createTestOhHeckGame({
        players: [{}, {}],
        gameState: GameState.PLAYERS_JOINING,
        completedRounds: [[0, 5]],
      });

      // act
      await new OhHeckGameService().startRound(user1Id, gameId);

      // assert
      const game = await new OhHeckGameService().get(user1Id, gameId);
      expect(game.state).to.eql(GameState.BETTING);
      expect(game.actionToUserId).to.eql(user2Id);
      expect(game.playerStates[0].cards.length).to.eql(6);
      expect(game.playerStates[1].numberOfCards).to.eql(6);
    });
  });

  describe("placeBet", () => {
    it("throws a validation error if game not found", async () => {
      // arrange
      const userCreds = createTestCredentials("test");
      const userId = await createTestUser(userCreds);
      const gameId = 1;
      const bet = 0;

      // act
      const error = await testBetExpectError(userId, gameId, bet);

      // assert
      expect(error).to.be.instanceOf(NotFoundError);
      expect(error.message).to.eql(`Game does not exist with id: ${gameId}`);
    });

    it("throws a validation error if action is not to user", async () => {
      // arrange
      const {
        userIds: [, user2Id],
        gameId,
      } = await createTestOhHeckGame({
        players: [{}, {}],
        gameState: GameState.BETTING,
      });

      // act
      const error = await testBetExpectError(user2Id, gameId, 1);

      // assert
      expect(error).to.be.instanceOf(ValidationError);
      expect(error.message).to.eql(
        'Validation errors: "Action is not to you."'
      );
    });

    it("throws a validation error if state is not betting", async () => {
      // arrange
      const {
        userIds: [user1Id],
        gameId,
      } = await createTestOhHeckGame({
        players: [{}, {}],
        gameState: GameState.TRICK_ACTIVE,
      });

      // act
      const error = await testBetExpectError(user1Id, gameId, 1);

      // assert
      expect(error).to.be.instanceOf(ValidationError);
      expect(error.message).to.eql(
        'Validation errors: "Invalid state to place bet."'
      );
    });

    it("throws a validation error if bet is invalid", async () => {
      // arrange
      const {
        userIds: [user1Id],
        gameId,
      } = await createTestOhHeckGame({
        players: [{ cardsInHand: mockCards(4) }, { cardsInHand: mockCards(4) }],
        gameState: GameState.BETTING,
      });

      // act
      const error = await testBetExpectError(user1Id, gameId, 5);

      // assert
      expect(error).to.be.instanceOf(ValidationError);
      expect(error.message).to.eql(
        'Validation errors: "Bet must be between 0 and 4."'
      );
    });

    it("succeeds if action to user, game state is betting, and bet is valid (more players to bet)", async () => {
      // arrange
      const {
        userIds: [user1Id, user2Id],
        gameId,
      } = await createTestOhHeckGame({
        players: [{ cardsInHand: mockCards(7) }, { cardsInHand: mockCards(7) }],
        gameState: GameState.BETTING,
      });
      const bet = 1;

      // act
      const { game, result } = await testBetExpectSuccess(user1Id, gameId, bet);

      // assert
      expect(result).to.eql({
        betPlaced: { userId: user1Id, bet },
        updatedGameState: GameState.BETTING,
        actionToUserId: user2Id,
      });
      expect(game.state).to.eql(GameState.BETTING);
      expect(game.actionToUserId).to.eql(user2Id);
      expect(game.playerStates[0].bet).to.eql(bet);
      expect(game.playerStates[1].bet).to.eql(null);
    });

    it("succeeds if action to user, game state is betting, and bet is valid (ready to start first trick)", async () => {
      // arrange
      const {
        userIds: [user1Id, user2Id],
        gameId,
      } = await createTestOhHeckGame({
        players: [
          { cardsInHand: mockCards(7) },
          { cardsInHand: mockCards(7), bet: 2 },
        ],
        gameState: GameState.BETTING,
      });
      const bet = 3;

      // act
      const { game, result } = await testBetExpectSuccess(user1Id, gameId, bet);

      // assert
      expect(result).to.eql({
        betPlaced: { userId: user1Id, bet },
        updatedGameState: GameState.TRICK_ACTIVE,
        actionToUserId: user2Id,
      });
      expect(game.state).to.eql(GameState.TRICK_ACTIVE);
      expect(game.actionToUserId).to.eql(user2Id);
      expect(game.playerStates[0].bet).to.eql(bet);
      expect(game.playerStates[1].bet).to.eql(2);
    });
  });
});
