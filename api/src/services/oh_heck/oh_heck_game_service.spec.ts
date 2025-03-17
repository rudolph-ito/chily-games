import { CardRank, CardSuit, ICard } from "../../shared/dtos/card";
import {
  createTestCredentials,
  createTestUser,
  resetDatabaseBeforeEach,
} from "../../../test/test_helper";
import {
  GameState,
  IBetEvent,
  ITrickEvent,
} from "../../shared/dtos/oh_heck/game";
import { OhHeckGameService } from "./oh_heck_game_service";

import { NotFoundError, ValidationError } from "../shared/exceptions";
import { createTestOhHeckGame } from "../../../test/oh_heck_test_helper";
import { OhHeckGameDataService } from "./data/oh_heck_game_data_service";
import { ISerializedOhHeckGame } from "../../database/models/oh_heck_game";

interface ITestPlaceBetResult {
  error?: Error;
  result?: IBetEvent;
  game?: ISerializedOhHeckGame;
}

interface ITestPlaceBetSuccessResult {
  result: IBetEvent;
  game: ISerializedOhHeckGame;
}

interface ITestPlayCardResult {
  error?: Error;
  result?: ITrickEvent;
  game?: ISerializedOhHeckGame;
}

interface ITestPlayCardSuccessResult {
  result: ITrickEvent;
  game: ISerializedOhHeckGame;
}

function mockCards(count: number): ICard[] {
  return new Array(count).fill({ suit: CardSuit.CLUBS, rank: CardRank.ACE });
}

async function testPlaceBet(
  userId: number,
  gameId: number,
  bet: number
): Promise<ITestPlaceBetResult> {
  let error: Error | undefined;
  let game: ISerializedOhHeckGame | undefined;
  let result: IBetEvent | undefined;
  try {
    result = await new OhHeckGameService().placeBet(userId, gameId, { bet });
    game = await new OhHeckGameDataService().get(gameId);
  } catch (e) {
    error = e;
  }
  return { result, game, error };
}

async function testPlaceBetExpectError(
  userId: number,
  gameId: number,
  bet: number
): Promise<Error> {
  const { result, error } = await testPlaceBet(userId, gameId, bet);
  if (error == null) {
    throw new Error(
      `Expected error but didn't get one, result: ${JSON.stringify(result)}`
    );
  }
  return error;
}

async function testPlaceBetExpectSuccess(
  userId: number,
  gameId: number,
  bet: number
): Promise<ITestPlaceBetSuccessResult> {
  const { result, error, game } = await testPlaceBet(userId, gameId, bet);
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

async function testPlayCard(
  userId: number,
  gameId: number,
  card: ICard
): Promise<ITestPlayCardResult> {
  let error: Error | undefined;
  let game: ISerializedOhHeckGame | undefined;
  let result: ITrickEvent | undefined;
  try {
    result = await new OhHeckGameService().playCard(userId, gameId, { card });
    game = await new OhHeckGameDataService().get(gameId);
  } catch (e) {
    error = e;
  }
  return { result, game, error };
}

async function testPlayCardExpectError(
  userId: number,
  gameId: number,
  card: ICard
): Promise<Error> {
  const { result, error } = await testPlayCard(userId, gameId, card);
  if (error == null) {
    throw new Error(
      `Expected error but didn't get one, result: ${JSON.stringify(result)}`
    );
  }
  return error;
}

async function testPlayCardExpectSuccess(
  userId: number,
  gameId: number,
  card: ICard
): Promise<ITestPlayCardSuccessResult> {
  const { result, error, game } = await testPlayCard(userId, gameId, card);
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

describe("OhHeckGameService", () => {
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
      expect(game.state).toEqual(GameState.BETTING);
      expect(game.actionToUserId).toEqual(user1Id);
      expect(game.playerStates[0].cards.length).toEqual(7);
      expect(game.playerStates[1].numberOfCards).toEqual(7);
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
      expect(game.state).toEqual(GameState.BETTING);
      expect(game.actionToUserId).toEqual(user2Id);
      expect(game.playerStates[0].cards.length).toEqual(6);
      expect(game.playerStates[1].numberOfCards).toEqual(6);
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
      const error = await testPlaceBetExpectError(userId, gameId, bet);

      // assert
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toEqual(`Game does not exist with id: ${gameId}`);
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
      const error = await testPlaceBetExpectError(user2Id, gameId, 1);

      // assert
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toEqual(
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
      const error = await testPlaceBetExpectError(user1Id, gameId, 1);

      // assert
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toEqual(
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
      const error = await testPlaceBetExpectError(user1Id, gameId, 5);

      // assert
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toEqual(
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
      const { game, result } = await testPlaceBetExpectSuccess(
        user1Id,
        gameId,
        bet
      );

      // assert
      expect(result).toEqual({
        betPlaced: { userId: user1Id, bet },
        updatedGameState: GameState.BETTING,
        actionToUserId: user2Id,
      });
      expect(game.state).toEqual(GameState.BETTING);
      expect(game.actionToUserId).toEqual(user2Id);
      expect(game.players[0].bet).toEqual(bet);
      expect(game.players[1].bet).toEqual(null);
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
      const { game, result } = await testPlaceBetExpectSuccess(
        user1Id,
        gameId,
        bet
      );

      // assert
      expect(result).toEqual({
        betPlaced: { userId: user1Id, bet },
        updatedGameState: GameState.TRICK_ACTIVE,
        actionToUserId: user2Id,
      });
      expect(game.state).toEqual(GameState.TRICK_ACTIVE);
      expect(game.actionToUserId).toEqual(user2Id);
      expect(game.players[0].bet).toEqual(bet);
      expect(game.players[1].bet).toEqual(2);
    });
  });

  describe("playCard", () => {
    it("throws a validation error if game not found", async () => {
      // arrange
      const userCreds = createTestCredentials("test");
      const userId = await createTestUser(userCreds);
      const gameId = 1;
      const card: ICard = { suit: CardSuit.CLUBS, rank: CardRank.TWO };

      // act
      const error = await testPlayCardExpectError(userId, gameId, card);

      // assert
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toEqual(`Game does not exist with id: ${gameId}`);
    });

    it("throws a validation error if action is not to user", async () => {
      // arrange
      const {
        userIds: [, user2Id],
        gameId,
      } = await createTestOhHeckGame({
        players: [{}, {}],
        gameState: GameState.TRICK_ACTIVE,
      });
      const card: ICard = { suit: CardSuit.CLUBS, rank: CardRank.TWO };

      // act
      const error = await testPlayCardExpectError(user2Id, gameId, card);

      // assert
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toEqual(
        'Validation errors: "Action is not to you."'
      );
    });

    it("throws a validation error if state is not trick active or trick complete", async () => {
      // arrange
      const {
        userIds: [user1Id],
        gameId,
      } = await createTestOhHeckGame({
        players: [{}, {}],
        gameState: GameState.BETTING,
      });
      const card: ICard = { suit: CardSuit.CLUBS, rank: CardRank.TWO };

      // act
      const error = await testPlayCardExpectError(user1Id, gameId, card);

      // assert
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toEqual(
        'Validation errors: "Invalid state to play card."'
      );
    });

    it("throws a validation error if card played is invalid", async () => {
      // arrange
      const {
        userIds: [, user2Id],
        gameId,
      } = await createTestOhHeckGame({
        players: [
          { cardsInHand: [{ suit: CardSuit.CLUBS, rank: CardRank.FOUR }] },
          {
            cardsInHand: [
              { suit: CardSuit.HEARTS, rank: CardRank.JACK },
              { suit: CardSuit.DIAMONDS, rank: CardRank.TWO },
            ],
          },
        ],
        gameState: GameState.TRICK_ACTIVE,
        currentTrick: [{ suit: CardSuit.DIAMONDS, rank: CardRank.THREE }],
        actionToIndex: 1,
      });
      const card = { suit: CardSuit.HEARTS, rank: CardRank.JACK };

      // act
      const error = await testPlayCardExpectError(user2Id, gameId, card);

      // assert
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toEqual(
        'Validation errors: "You must follow suit of first card played (diamonds) if you can."'
      );
    });

    it("suceeds if card played is valid (first play of round)", async () => {
      // arrange
      const {
        userIds: [user1Id, user2Id],
        gameId,
      } = await createTestOhHeckGame({
        players: [
          {
            cardsInHand: [
              { suit: CardSuit.CLUBS, rank: CardRank.FOUR },
              { suit: CardSuit.DIAMONDS, rank: CardRank.THREE },
            ],
          },
          {
            cardsInHand: [
              { suit: CardSuit.HEARTS, rank: CardRank.JACK },
              { suit: CardSuit.DIAMONDS, rank: CardRank.TWO },
            ],
          },
        ],
        gameState: GameState.TRICK_ACTIVE,
      });
      const card = { suit: CardSuit.DIAMONDS, rank: CardRank.THREE };

      // act
      const { result, game } = await testPlayCardExpectSuccess(
        user1Id,
        gameId,
        card
      );

      // assert
      expect(result).toEqual({
        cardPlayed: { userId: user1Id, card },
        updatedGameState: GameState.TRICK_ACTIVE,
        actionToUserId: user2Id,
        roundScore: undefined,
      });
      expect(game.players[0].cardsInHand).toEqual([
        { suit: CardSuit.CLUBS, rank: CardRank.FOUR },
      ]);
      expect(game.currentTrick).toEqual([{ userId: user1Id, card }]);
      expect(game.state).toEqual(GameState.TRICK_ACTIVE);
      expect(game.actionToUserId).toEqual(user2Id);
    });

    it("suceeds if card played is valid (finishing a trick)", async () => {
      // arrange
      const {
        userIds: [user1Id, user2Id],
        gameId,
      } = await createTestOhHeckGame({
        players: [
          { cardsInHand: [{ suit: CardSuit.CLUBS, rank: CardRank.FOUR }] },
          {
            cardsInHand: [
              { suit: CardSuit.HEARTS, rank: CardRank.JACK },
              { suit: CardSuit.DIAMONDS, rank: CardRank.TWO },
            ],
          },
        ],
        gameState: GameState.TRICK_ACTIVE,
        currentTrick: [{ suit: CardSuit.DIAMONDS, rank: CardRank.THREE }],
        actionToIndex: 1,
      });
      const card = { suit: CardSuit.DIAMONDS, rank: CardRank.TWO };

      // act
      const { result, game } = await testPlayCardExpectSuccess(
        user2Id,
        gameId,
        card
      );

      // assert
      expect(result).toEqual({
        cardPlayed: { userId: user2Id, card },
        updatedGameState: GameState.TRICK_COMPLETE,
        actionToUserId: user1Id,
        roundScore: undefined,
      });
      expect(game.players[0].cardsInHand).toEqual([
        { suit: CardSuit.CLUBS, rank: CardRank.FOUR },
      ]);
      expect(game.players[0].tricksTaken).toEqual(1);
      expect(game.players[1].cardsInHand).toEqual([
        { suit: CardSuit.HEARTS, rank: CardRank.JACK },
      ]);
      expect(game.players[1].tricksTaken).toEqual(0);
      expect(game.currentTrick).toEqual([
        {
          userId: user1Id,
          card: { suit: CardSuit.DIAMONDS, rank: CardRank.THREE },
        },
        { userId: user2Id, card },
      ]);
      expect(game.state).toEqual(GameState.TRICK_COMPLETE);
      expect(game.actionToUserId).toEqual(user1Id);
    });

    it("suceeds if card played is valid (finishing a round)", async () => {
      // arrange
      const {
        userIds: [user1Id, user2Id],
        gameId,
      } = await createTestOhHeckGame({
        players: [
          { cardsInHand: [], bet: 2, tricksTaken: 1 },
          {
            cardsInHand: [{ suit: CardSuit.DIAMONDS, rank: CardRank.TWO }],
            bet: 3,
            tricksTaken: 2,
          },
        ],
        gameState: GameState.TRICK_ACTIVE,
        currentTrick: [{ suit: CardSuit.DIAMONDS, rank: CardRank.THREE }],
        actionToIndex: 1,
      });
      const card = { suit: CardSuit.DIAMONDS, rank: CardRank.TWO };

      // act
      const { result, game } = await testPlayCardExpectSuccess(
        user2Id,
        gameId,
        card
      );

      // assert
      expect(result).toEqual({
        cardPlayed: { userId: user2Id, card },
        updatedGameState: GameState.ROUND_COMPLETE,
        actionToUserId: user1Id,
        roundScore: {
          [user1Id]: { score: 7, bet: 2, tricksTaken: 2 },
          [user2Id]: { score: 0, bet: 3, tricksTaken: 2 },
        },
      });
      expect(game.players[0].cardsInHand).toEqual([]);
      expect(game.players[0].tricksTaken).toEqual(2);
      expect(game.players[1].cardsInHand).toEqual([]);
      expect(game.players[1].tricksTaken).toEqual(2);
      expect(game.currentTrick).toEqual([
        {
          userId: user1Id,
          card: { suit: CardSuit.DIAMONDS, rank: CardRank.THREE },
        },
        { userId: user2Id, card },
      ]);
      expect(game.state).toEqual(GameState.ROUND_COMPLETE);
      expect(game.actionToUserId).toEqual(user1Id);
    });
  });

  it("suceeds if card played is valid (finishing a half game)", async () => {
    // arrange
    const {
      userIds: [user1Id, user2Id],
      gameId,
    } = await createTestOhHeckGame({
      halfGame: true,
      players: [
        { cardsInHand: [], bet: 2, tricksTaken: 1 },
        {
          cardsInHand: [{ suit: CardSuit.DIAMONDS, rank: CardRank.TWO }],
          bet: 3,
          tricksTaken: 2,
        },
      ],
      gameState: GameState.TRICK_ACTIVE,
      currentTrick: [{ suit: CardSuit.DIAMONDS, rank: CardRank.THREE }],
      completedRounds: [
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
      ],
      actionToIndex: 1,
    });
    const card = { suit: CardSuit.DIAMONDS, rank: CardRank.TWO };

    // act
    const { result, game } = await testPlayCardExpectSuccess(
      user2Id,
      gameId,
      card
    );

    // assert
    expect(result).toEqual({
      cardPlayed: { userId: user2Id, card },
      updatedGameState: GameState.COMPLETE,
      actionToUserId: user1Id,
      roundScore: {
        [user1Id]: { score: 7, bet: 2, tricksTaken: 2 },
        [user2Id]: { score: 0, bet: 3, tricksTaken: 2 },
      },
    });
    expect(game.players[0].cardsInHand).toEqual([]);
    expect(game.players[0].tricksTaken).toEqual(2);
    expect(game.players[1].cardsInHand).toEqual([]);
    expect(game.players[1].tricksTaken).toEqual(2);
    expect(game.currentTrick).toEqual([
      {
        userId: user1Id,
        card: { suit: CardSuit.DIAMONDS, rank: CardRank.THREE },
      },
      { userId: user2Id, card },
    ]);
    expect(game.state).toEqual(GameState.COMPLETE);
    expect(game.actionToUserId).toEqual(user1Id);
  });

  it("suceeds if card played is valid (finishing a full game)", async () => {
    // arrange
    const {
      userIds: [user1Id, user2Id],
      gameId,
    } = await createTestOhHeckGame({
      players: [
        { cardsInHand: [], bet: 2, tricksTaken: 1 },
        {
          cardsInHand: [{ suit: CardSuit.DIAMONDS, rank: CardRank.TWO }],
          bet: 3,
          tricksTaken: 2,
        },
      ],
      gameState: GameState.TRICK_ACTIVE,
      currentTrick: [{ suit: CardSuit.DIAMONDS, rank: CardRank.THREE }],
      completedRounds: [
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
      ],
      actionToIndex: 1,
    });
    const card = { suit: CardSuit.DIAMONDS, rank: CardRank.TWO };

    // act
    const { result, game } = await testPlayCardExpectSuccess(
      user2Id,
      gameId,
      card
    );

    // assert
    expect(result).toEqual({
      cardPlayed: { userId: user2Id, card },
      updatedGameState: GameState.COMPLETE,
      actionToUserId: user1Id,
      roundScore: {
        [user1Id]: { score: 7, bet: 2, tricksTaken: 2 },
        [user2Id]: { score: 0, bet: 3, tricksTaken: 2 },
      },
    });
    expect(game.players[0].cardsInHand).toEqual([]);
    expect(game.players[0].tricksTaken).toEqual(2);
    expect(game.players[1].cardsInHand).toEqual([]);
    expect(game.players[1].tricksTaken).toEqual(2);
    expect(game.currentTrick).toEqual([
      {
        userId: user1Id,
        card: { suit: CardSuit.DIAMONDS, rank: CardRank.THREE },
      },
      { userId: user2Id, card },
    ]);
    expect(game.state).toEqual(GameState.COMPLETE);
    expect(game.actionToUserId).toEqual(user1Id);
  });
});
