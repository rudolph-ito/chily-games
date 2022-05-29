import {
  createTestRummyGame,
  testMeldExpectError,
  testMeldExpectSuccess,
  testPickupExpectError,
  testPickupExpectSuccess,
} from "../../../test/rummy_test_helper";
import { expect } from "chai";
import {
  IPickupInput,
  GameState,
  IMeldInput,
} from "../../shared/dtos/rummy/game";
import {
  createTestCredentials,
  createTestUser,
  resetDatabaseBeforeEach,
} from "../../../test/test_helper";
import { NotFoundError, ValidationError } from "../shared/exceptions";
import { RummyGameService } from "./rummy_game_service";
import { CardRank, CardSuit } from "../../shared/dtos/card";

describe("RummyGameService", () => {
  resetDatabaseBeforeEach();

  describe("create", () => {
    it("it creates a game in state players joining", async () => {
      // arrange
      const gameService = new RummyGameService();
      const user1Id = await createTestUser(createTestCredentials("test1"));

      // act
      const result = await gameService.create(user1Id, {
        numberOfDiscardPiles: 1,
        pointThreshold: 500,
      });

      // assert
      expect(result.hostUserId).to.eql(user1Id);
      expect(result.state).to.eql(GameState.PLAYERS_JOINING);
      expect(result.playerStates.length).to.eql(1);
      expect(result.playerStates[0].userId).to.eql(user1Id);
    });
  });

  describe("join", () => {
    it("it adds the player", async () => {
      // arrange
      const gameService = new RummyGameService();
      const user1Id = await createTestUser(createTestCredentials("test1"));
      const user2Id = await createTestUser(createTestCredentials("test2"));
      const { gameId } = await gameService.create(user1Id, {
        numberOfDiscardPiles: 1,
        pointThreshold: 500,
      });

      // act
      const result = await gameService.join(user2Id, gameId);

      // assert
      expect(result.playerStates.length).to.eql(2);
      expect(result.playerStates[1].userId).to.eql(user2Id);
    });
  });

  describe("abort", () => {
    it("it updates the game state", async () => {
      // arrange
      const gameService = new RummyGameService();
      const user1Id = await createTestUser(createTestCredentials("test1"));
      const { gameId } = await gameService.create(user1Id, {
        numberOfDiscardPiles: 1,
        pointThreshold: 500,
      });

      // act
      const result = await gameService.abort(user1Id, gameId);

      // assert
      expect(result.state).to.eql(GameState.ABORTED);
    });
  });

  describe("startRound", () => {
    it("it gives all players cards and sets state and action to", async () => {
      // arrange
      const gameService = new RummyGameService();
      const user1Id = await createTestUser(createTestCredentials("test1"));
      const user2Id = await createTestUser(createTestCredentials("test2"));
      const { gameId } = await gameService.create(user1Id, {
        numberOfDiscardPiles: 2,
        pointThreshold: 500,
      });
      await gameService.join(user2Id, gameId);

      // act
      const result = await gameService.startRound(user1Id, gameId);

      // assert
      expect(result.state).to.eql(GameState.PICKUP);
      expect(result.actionToUserId).to.eql(user1Id);
      expect(result.playerStates[0].numberOfCards).to.eql(7);
      expect(result.playerStates[1].numberOfCards).to.eql(7);
      expect(result.discardState.piles[0].length).to.eql(1);
      expect(result.discardState.piles[1].length).to.eql(1);
      expect(result.cardsInDeck.length).to.eql(36);
    });
  });

  describe("pickup", () => {
    it("throws a validation error if game not found", async () => {
      // arrange
      const userCreds = createTestCredentials("test");
      const userId = await createTestUser(userCreds);
      const gameId = 1;
      const input: IPickupInput = {};

      // act
      const error = await testPickupExpectError(userId, gameId, input);

      // assert
      expect(error).to.be.instanceOf(NotFoundError);
      expect(error.message).to.eql(`Game does not exist with id: ${gameId}`);
    });

    it("throws a validation error if action not to you", async () => {
      // arrange
      const {
        userIds: [, user2Id],
        gameId,
      } = await createTestRummyGame({
        playerCards: [[], []],
      });
      const input: IPickupInput = {};

      // act
      const error = await testPickupExpectError(user2Id, gameId, input);

      // assert
      expect(error).to.be.instanceOf(ValidationError);
      expect(error.message).to.eql('Validation errors: "Action is not to you"');
    });

    it("throws a validation error if not in correct state for pickup", async () => {
      // arrange
      const {
        userIds: [user1Id],
        gameId,
      } = await createTestRummyGame({
        playerCards: [[], []],
        state: GameState.MELD_OR_DISCARD,
      });
      const input: IPickupInput = {};

      // act
      const error = await testPickupExpectError(user1Id, gameId, input);

      // assert
      expect(error).to.be.instanceOf(ValidationError);
      expect(error.message).to.eql(
        'Validation errors: "Invalid state to pickup"'
      );
    });

    it("throws a validation error if pickup is invalid", async () => {
      // arrange
      const {
        userIds: [user1Id],
        gameId,
      } = await createTestRummyGame({
        playerCards: [[], []],
      });
      const input: IPickupInput = {
        pickup: { suit: CardSuit.CLUBS, rank: CardRank.TWO },
      };

      // act
      const error = await testPickupExpectError(user1Id, gameId, input);

      // assert
      expect(error).to.be.instanceOf(ValidationError);
      expect(error.message).to.eql(
        'Validation errors: "Invalid pickup. Should be null or card from one of the discard piles"'
      );
    });

    it("throws a validation error if deep meld is invalid", async () => {
      // arrange
      const {
        userIds: [user1Id],
        gameId,
      } = await createTestRummyGame({
        playerCards: [[{ suit: CardSuit.CLUBS, rank: CardRank.THREE }], []],
        discardState: {
          piles: [
            [
              { suit: CardSuit.CLUBS, rank: CardRank.TWO },
              { suit: CardSuit.SPADES, rank: CardRank.JACK },
            ],
          ],
        },
      });
      const input: IPickupInput = {
        pickup: { suit: CardSuit.CLUBS, rank: CardRank.TWO },
        deepPickupMeld: {
          cards: [
            { suit: CardSuit.CLUBS, rank: CardRank.TWO },
            { suit: CardSuit.CLUBS, rank: CardRank.THREE },
          ],
        },
      };

      // act
      const error = await testPickupExpectError(user1Id, gameId, input);

      // assert
      expect(error).to.be.instanceOf(ValidationError);
      expect(error.message).to.eql('Validation errors: "Invalid meld"');
    });

    it("picks up from deck if no pickup provided", async () => {
      // arrange
      const {
        userIds: [user1Id],
        gameId,
      } = await createTestRummyGame({
        playerCards: [[], []],
        cardsInDeck: [{ suit: CardSuit.CLUBS, rank: CardRank.TWO }],
      });
      const input: IPickupInput = {};

      // act
      const { result, game } = await testPickupExpectSuccess(
        user1Id,
        gameId,
        input
      );

      // assert
      expect(result).to.eql({
        event: {
          actionToUserId: user1Id,
          input,
          updatedGameState: GameState.MELD_OR_DISCARD,
          userId: user1Id,
        },
        cardPickedUpFromDeck: { suit: CardSuit.CLUBS, rank: CardRank.TWO },
      });
      expect(game.cardsInDeck).to.eql([]);
      expect(game.playerStates[0].cardsInHand).to.eql([
        { suit: CardSuit.CLUBS, rank: CardRank.TWO },
      ]);
    });

    it("picks up from discard pile if valid (without deep meld)", async () => {
      // arrange
      const {
        userIds: [user1Id],
        gameId,
      } = await createTestRummyGame({
        playerCards: [[], []],
        discardState: {
          piles: [[{ suit: CardSuit.CLUBS, rank: CardRank.TWO }]],
        },
      });
      const input: IPickupInput = {
        pickup: { suit: CardSuit.CLUBS, rank: CardRank.TWO },
      };

      // act
      const { result, game } = await testPickupExpectSuccess(
        user1Id,
        gameId,
        input
      );

      // assert
      expect(result).to.eql({
        event: {
          actionToUserId: user1Id,
          input,
          updatedGameState: GameState.MELD_OR_DISCARD,
          userId: user1Id,
        },
      });
      expect(game.discardState.piles).to.eql([[]]);
      expect(game.playerStates[0].cardsInHand).to.eql([
        { suit: CardSuit.CLUBS, rank: CardRank.TWO },
      ]);
    });

    it("picks up from discard pile if (with deep meld)", async () => {
      // arrange
      const {
        userIds: [user1Id],
        gameId,
      } = await createTestRummyGame({
        playerCards: [
          [
            { suit: CardSuit.CLUBS, rank: CardRank.THREE },
            { suit: CardSuit.CLUBS, rank: CardRank.FOUR },
          ],
          [],
        ],
        discardState: {
          piles: [
            [
              { suit: CardSuit.HEARTS, rank: CardRank.EIGHT },
              { suit: CardSuit.CLUBS, rank: CardRank.FIVE },
              { suit: CardSuit.CLUBS, rank: CardRank.SIX },
              { suit: CardSuit.SPADES, rank: CardRank.JACK },
            ],
          ],
        },
      });
      const input: IPickupInput = {
        pickup: { suit: CardSuit.CLUBS, rank: CardRank.FIVE },
        deepPickupMeld: {
          cards: [
            { suit: CardSuit.CLUBS, rank: CardRank.THREE },
            { suit: CardSuit.CLUBS, rank: CardRank.FOUR },
            { suit: CardSuit.CLUBS, rank: CardRank.FIVE },
            { suit: CardSuit.CLUBS, rank: CardRank.SIX },
          ],
        },
      };

      // act
      const { result, game } = await testPickupExpectSuccess(
        user1Id,
        gameId,
        input
      );

      // assert
      expect(result).to.eql({
        event: {
          actionToUserId: user1Id,
          input,
          updatedGameState: GameState.MELD_OR_DISCARD,
          userId: user1Id,
        },
      });
      expect(game.discardState.piles).to.eql([
        [{ suit: CardSuit.HEARTS, rank: CardRank.EIGHT }],
      ]);
      expect(game.playerStates[0].cardsInHand).to.eql([
        { suit: CardSuit.SPADES, rank: CardRank.JACK },
      ]);
      expect(game.melds).to.eql([
        {
          id: 1,
          elements: [
            {
              userId: user1Id,
              card: { suit: CardSuit.CLUBS, rank: CardRank.THREE },
            },
            {
              userId: user1Id,
              card: { suit: CardSuit.CLUBS, rank: CardRank.FOUR },
            },
            {
              userId: user1Id,
              card: { suit: CardSuit.CLUBS, rank: CardRank.FIVE },
            },
            {
              userId: user1Id,
              card: { suit: CardSuit.CLUBS, rank: CardRank.SIX },
            },
          ],
        },
      ]);
    });
  });

  describe("meld", () => {
    it("throws validation error if action not to you", async () => {
      // arrange
      const {
        userIds: [, user2Id],
        gameId,
      } = await createTestRummyGame({
        playerCards: [[], []],
        state: GameState.MELD_OR_DISCARD,
      });
      const input: IMeldInput = { cards: [] };

      // act
      const error = await testMeldExpectError(user2Id, gameId, input);

      // assert
      expect(error).to.be.instanceOf(ValidationError);
      expect(error.message).to.eql('Validation errors: "Action is not to you"');
    });

    it("throws validation error if invalid state", async () => {
      // arrange
      const {
        userIds: [user1Id],
        gameId,
      } = await createTestRummyGame({
        playerCards: [[], []],
        state: GameState.PICKUP,
      });
      const input: IMeldInput = { cards: [] };

      // act
      const error = await testMeldExpectError(user1Id, gameId, input);

      // assert
      expect(error).to.be.instanceOf(ValidationError);
      expect(error.message).to.eql(
        'Validation errors: "Invalid state to meld"'
      );
    });

    it("throws validation error if invalid meld", async () => {
      // arrange
      const {
        userIds: [user1Id],
        gameId,
      } = await createTestRummyGame({
        playerCards: [[], []],
        state: GameState.MELD_OR_DISCARD,
      });
      const input: IMeldInput = {
        cards: [
          { suit: CardSuit.CLUBS, rank: CardRank.THREE },
          { suit: CardSuit.CLUBS, rank: CardRank.FOUR },
          { suit: CardSuit.CLUBS, rank: CardRank.FIVE },
          { suit: CardSuit.CLUBS, rank: CardRank.SIX },
        ],
      };

      // act
      const error = await testMeldExpectError(user1Id, gameId, input);

      // assert
      expect(error).to.be.instanceOf(ValidationError);
      expect(error.message).to.eql(
        'Validation errors: "Meld contains cards not in your hand"'
      );
    });

    it("adds to meld if valid (round still active)", async () => {
      // arrange
      const {
        userIds: [user1Id],
        gameId,
      } = await createTestRummyGame({
        playerCards: [
          [
            { suit: CardSuit.CLUBS, rank: CardRank.THREE },
            { suit: CardSuit.CLUBS, rank: CardRank.FOUR },
            { suit: CardSuit.CLUBS, rank: CardRank.FIVE },
            { suit: CardSuit.CLUBS, rank: CardRank.SIX },
            { suit: CardSuit.HEARTS, rank: CardRank.KING },
          ],
          [],
        ],
        state: GameState.MELD_OR_DISCARD,
      });
      const input: IMeldInput = {
        cards: [
          { suit: CardSuit.CLUBS, rank: CardRank.THREE },
          { suit: CardSuit.CLUBS, rank: CardRank.FOUR },
          { suit: CardSuit.CLUBS, rank: CardRank.FIVE },
          { suit: CardSuit.CLUBS, rank: CardRank.SIX },
        ],
      };

      // act
      const { game, result } = await testMeldExpectSuccess(
        user1Id,
        gameId,
        input
      );

      // assert
      expect(result).to.eql({
        actionToUserId: user1Id,
        input,
        updatedGameState: GameState.MELD_OR_DISCARD,
        userId: user1Id,
      });
      expect(game.playerStates[0].cardsInHand).to.eql([
        { suit: CardSuit.HEARTS, rank: CardRank.KING },
      ]);
      expect(game.melds).to.eql([
        {
          id: 1,
          elements: [
            {
              userId: user1Id,
              card: { suit: CardSuit.CLUBS, rank: CardRank.THREE },
            },
            {
              userId: user1Id,
              card: { suit: CardSuit.CLUBS, rank: CardRank.FOUR },
            },
            {
              userId: user1Id,
              card: { suit: CardSuit.CLUBS, rank: CardRank.FIVE },
            },
            {
              userId: user1Id,
              card: { suit: CardSuit.CLUBS, rank: CardRank.SIX },
            },
          ],
        },
      ]);
    });

    it("adds to meld if valid (round complete)", async () => {
      // arrange
      const {
        userIds: [user1Id, user2Id],
        gameId,
      } = await createTestRummyGame({
        playerCards: [
          [
            { suit: CardSuit.CLUBS, rank: CardRank.THREE },
            { suit: CardSuit.CLUBS, rank: CardRank.FOUR },
            { suit: CardSuit.CLUBS, rank: CardRank.FIVE },
            { suit: CardSuit.CLUBS, rank: CardRank.SIX },
          ],
          [{ suit: CardSuit.SPADES, rank: CardRank.JACK }],
        ],
        state: GameState.MELD_OR_DISCARD,
      });
      const input: IMeldInput = {
        cards: [
          { suit: CardSuit.CLUBS, rank: CardRank.THREE },
          { suit: CardSuit.CLUBS, rank: CardRank.FOUR },
          { suit: CardSuit.CLUBS, rank: CardRank.FIVE },
          { suit: CardSuit.CLUBS, rank: CardRank.SIX },
        ],
      };

      // act
      const { game, result } = await testMeldExpectSuccess(
        user1Id,
        gameId,
        input
      );

      // assert
      expect(result).to.eql({
        actionToUserId: user1Id,
        input,
        updatedGameState: GameState.ROUND_COMPLETE,
        userId: user1Id,
        roundScore: {
          [user1Id]: 20,
          [user2Id]: -10,
        },
      });
      expect(game.state).to.eql(GameState.ROUND_COMPLETE);
      expect(game.roundScores).to.eql([
        {
          [user1Id]: 20,
          [user2Id]: -10,
        },
      ]);
    });

    it("adds to meld if valid (game complete)", async () => {
      const {
        userIds: [user1Id, user2Id],
        gameId,
      } = await createTestRummyGame({
        playerCards: [
          [
            { suit: CardSuit.CLUBS, rank: CardRank.THREE },
            { suit: CardSuit.CLUBS, rank: CardRank.FOUR },
            { suit: CardSuit.CLUBS, rank: CardRank.FIVE },
            { suit: CardSuit.CLUBS, rank: CardRank.SIX },
          ],
          [{ suit: CardSuit.SPADES, rank: CardRank.JACK }],
        ],
        state: GameState.MELD_OR_DISCARD,
        roundScores: [
          [200, 0],
          [280, 100],
        ],
      });
      const input: IMeldInput = {
        cards: [
          { suit: CardSuit.CLUBS, rank: CardRank.THREE },
          { suit: CardSuit.CLUBS, rank: CardRank.FOUR },
          { suit: CardSuit.CLUBS, rank: CardRank.FIVE },
          { suit: CardSuit.CLUBS, rank: CardRank.SIX },
        ],
      };

      // act
      const { game, result } = await testMeldExpectSuccess(
        user1Id,
        gameId,
        input
      );

      // assert
      expect(result).to.eql({
        actionToUserId: user1Id,
        input,
        updatedGameState: GameState.COMPLETE,
        userId: user1Id,
        roundScore: {
          [user1Id]: 20,
          [user2Id]: -10,
        },
      });
      expect(game.state).to.eql(GameState.COMPLETE);
      expect(game.roundScores).to.eql([
        {
          [user1Id]: 200,
          [user2Id]: 0,
        },
        {
          [user1Id]: 280,
          [user2Id]: 100,
        },
        {
          [user1Id]: 20,
          [user2Id]: -10,
        },
      ]);
    });
  });

  describe("discard", () => {
    it("throws validation error if action not to you", () => {});

    it("throws validation error if invalid state", () => {});

    it("throws validation error if invalid discard", () => {});

    it("updates game state if valid (round still active)", () => {});

    it("updates game state if valid (round complete)", () => {});

    it("updates game state if valid (game complete)", () => {});
  });
});
