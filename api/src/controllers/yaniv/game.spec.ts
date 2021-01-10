import {
  createTestUser,
  createTestCredentials,
  resetDatabaseBeforeEach,
  loginTestUser,
  createTestServer,
  ITestServer,
} from "../../../test/test_helper";
import { describe, it } from "mocha";
import { StatusCodes } from "http-status-codes";
import { expect } from "chai";
import {
  GameState,
  IGame,
  IGameActionRequest,
  IGameActionResponse,
} from "../../shared/dtos/yaniv/game";
import {
  createTestYanivGame,
  createTestYanivRoundActiveGame,
  joinTestYanivGame,
} from "../../../test/yaniv_test_helper";
import { CardRank, CardSuit } from "../../shared/dtos/yaniv/card";
import { YanivGameService } from "../../services/yaniv/yaniv_game_service";

describe("YanivGameRoutes", () => {
  resetDatabaseBeforeEach();
  let testServer: ITestServer;

  before(() => {
    testServer = createTestServer();
  });

  after(async () => {
    await testServer.quit();
  });

  describe("create game (POST /api/yaniv/games)", () => {
    it("returns the created game", async () => {
      // Arrange
      const user1Credentials = createTestCredentials("user1");
      const user1Id = await createTestUser(user1Credentials);
      const agent = await loginTestUser(testServer.app, user1Credentials);

      // Act
      const response = await agent
        .post(`/api/yaniv/games`)
        .send({ playTo: 200 })
        .expect(StatusCodes.OK);

      // Assert
      expect(response.body).to.exist();
      const game: IGame = response.body;
      expect(game).to.eql({
        gameId: game.gameId,
        hostUserId: user1Id,
        options: {
          playTo: 200,
        },
        playerStates: [
          {
            numberOfCards: 0,
            cards: [],
            userId: user1Id,
            displayName: "user1",
          },
        ],
        roundScores: [],
        state: GameState.PLAYERS_JOINING,
        actionToUserId: user1Id,
        cardsOnTopOfDiscardPile: [],
      });
    });
  });

  describe("join game (PUT /api/yaniv/games/<game_id>/join", () => {
    it("returns the updated game", async () => {
      // Arrange
      const user1Credentials = createTestCredentials("user1");
      const user1Id = await createTestUser(user1Credentials);
      const user2Credentials = createTestCredentials("user2");
      const user2Id = await createTestUser(user2Credentials);
      const gameId = await createTestYanivGame(user1Id, { playTo: 200 });
      const agent = await loginTestUser(testServer.app, user2Credentials);

      // Act
      const response = await agent
        .put(`/api/yaniv/games/${gameId}/join`)
        .expect(StatusCodes.OK);

      // Assert
      expect(response.body).to.exist();
      const game: IGame = response.body;
      expect(game.gameId).to.eql(gameId);
      expect(game.state).to.eql(GameState.PLAYERS_JOINING);
      expect(game.playerStates).to.eql([
        {
          numberOfCards: 0,
          cards: [],
          userId: user1Id,
          displayName: "user1",
        },
        {
          numberOfCards: 0,
          cards: [],
          userId: user2Id,
          displayName: "user2",
        },
      ]);
    });
  });

  describe("start round (PUT /api/yaniv/games/<game_id>/start-round", () => {
    it("returns the updated game", async () => {
      // Arrange
      const user1Credentials = createTestCredentials("user1");
      const user1Id = await createTestUser(user1Credentials);
      const user2Credentials = createTestCredentials("user2");
      const user2Id = await createTestUser(user2Credentials);
      const gameId = await createTestYanivGame(user1Id, { playTo: 200 });
      await joinTestYanivGame(user2Id, gameId);
      const agent = await loginTestUser(testServer.app, user1Credentials);

      // Act
      const response = await agent
        .put(`/api/yaniv/games/${gameId}/start-round`)
        .expect(StatusCodes.OK);

      // Assert
      expect(response.body).to.exist();
      const game: IGame = response.body;
      expect(game.gameId).to.eql(gameId);
      expect(game.state).to.eql(GameState.ROUND_ACTIVE);
      expect(game.actionToUserId).to.eql(user1Id);
      expect(game.cardsOnTopOfDiscardPile.length).to.eql(1);
      expect(game.playerStates[0].userId).to.eql(user1Id);
      expect(game.playerStates[0].numberOfCards).to.eql(5);
      expect(game.playerStates[1].userId).to.eql(user2Id);
      expect(game.playerStates[1].numberOfCards).to.eql(5);
    });
  });

  describe("play (PUT /api/yaniv/games/<game_id>/play", () => {
    it("returns the updated game", async () => {
      // Arrange
      const {
        userCredentials: [user1Credentials],
        userIds: [user1Id, user2Id],
        gameId,
      } = await createTestYanivRoundActiveGame({
        playerCards: [
          [
            { rank: CardRank.ACE, suit: CardSuit.CLUBS },
            { rank: CardRank.KING, suit: CardSuit.DIAMONDS },
          ],
          [],
        ],
        cardsInDeck: [{ rank: CardRank.SEVEN, suit: CardSuit.HEARTS }],
        cardsOnTopOfDiscardPile: [
          { rank: CardRank.TWO, suit: CardSuit.SPADES },
        ],
      });
      const action: IGameActionRequest = {
        cardsDiscarded: [{ rank: CardRank.KING, suit: CardSuit.DIAMONDS }],
      };
      const agent = await loginTestUser(testServer.app, user1Credentials);

      // Act
      const response = await agent
        .put(`/api/yaniv/games/${gameId}/play`)
        .send(action)
        .expect(StatusCodes.OK);

      // Assert
      expect(response.body).to.exist();
      const gameResponse: IGameActionResponse = response.body;
      expect(gameResponse.actionToNextPlayerEvent).to.eql({
        lastAction: {
          cardsDiscarded: [{ rank: CardRank.KING, suit: CardSuit.DIAMONDS }],
          userId: user1Id,
        },
        actionToUserId: user2Id,
      });
      expect(gameResponse.cardPickedUpFromDeck).to.eql({
        rank: CardRank.SEVEN,
        suit: CardSuit.HEARTS,
      });
      const updatedGame = await new YanivGameService().get(user1Id, gameId);
      expect(updatedGame.state).to.eql(GameState.ROUND_ACTIVE);
      expect(updatedGame.actionToUserId).to.eql(user2Id);
      expect(updatedGame.cardsOnTopOfDiscardPile).to.eql([
        { rank: CardRank.KING, suit: CardSuit.DIAMONDS },
      ]);
      expect(updatedGame.playerStates[0].cards).to.eql([
        { rank: CardRank.ACE, suit: CardSuit.CLUBS },
        { rank: CardRank.SEVEN, suit: CardSuit.HEARTS },
      ]);
    });
  });
});
