import {
  createTestUser,
  createTestCredentials,
  resetDatabaseBeforeEach,
  IUserCredentials,
  loginTestUser,
  createTestServer,
  ITestServer,
} from "../../../test/test_helper";
import { describe, it } from "mocha";
import HttpStatus from "http-status-codes";
import { expect } from "chai";
import { GameState, IGame } from "../../shared/dtos/yaniv/game";
import {
  createTestYanivGame,
  joinTestYanivGame,
} from "../../../test/yaniv_test_helper";

describe("YanivGameRoutes", () => {
  resetDatabaseBeforeEach();
  let testServer: ITestServer;
  let user1Credentials: IUserCredentials;
  let user1Id: number;
  let user2Credentials: IUserCredentials;
  let user2Id: number;

  before(() => {
    testServer = createTestServer();
  });

  after(async () => {
    await testServer.quit();
  });

  beforeEach(async () => {
    user1Credentials = createTestCredentials("user1");
    user1Id = await createTestUser(user1Credentials);
    user2Credentials = createTestCredentials("user2");
    user2Id = await createTestUser(user2Credentials);
  });

  describe("create game (POST /api/yaniv/games)", () => {
    it("returns the created game", async () => {
      // Arrange
      const agent = await loginTestUser(testServer.app, user1Credentials);

      // Act
      const response = await agent
        .post(`/api/yaniv/games`)
        .send({ playTo: 200 })
        .expect(HttpStatus.OK);

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
            userId: user1Id,
          },
        ],
        roundScores: [],
        state: GameState.PLAYERS_JOINING,
      });
    });
  });

  describe("join game (PUT /api/yaniv/games/<game_id>/join", () => {
    it("returns the updated game", async () => {
      // Arrange
      const gameId = await createTestYanivGame(user1Id, { playTo: 200 });
      const agent = await loginTestUser(testServer.app, user2Credentials);

      // Act
      const response = await agent
        .put(`/api/yaniv/games/${gameId}/join`)
        .expect(HttpStatus.OK);

      // Assert
      expect(response.body).to.exist();
      const game: IGame = response.body;
      expect(game.gameId).to.eql(gameId);
      expect(game.state).to.eql(GameState.PLAYERS_JOINING);
      expect(game.playerStates).to.eql([
        {
          userId: user1Id,
        },
        {
          userId: user2Id,
        },
      ]);
    });
  });

  describe("start round (PUT /api/yaniv/games/<game_id>/start-round", () => {
    it("returns the updated game", async () => {
      // Arrange
      const gameId = await createTestYanivGame(user1Id, { playTo: 200 });
      await joinTestYanivGame(user2Id, gameId);
      const agent = await loginTestUser(testServer.app, user1Credentials);

      // Act
      const response = await agent
        .put(`/api/yaniv/games/${gameId}/start-round`)
        .expect(HttpStatus.OK);

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
});
