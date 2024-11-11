import {
  createTestVariant,
  createTestUser,
  createTestCredentials,
  resetDatabaseBeforeEach,
  IUserCredentials,
  loginTestUser,
  createAndLoginTestUser,
  createTestServer,
  ITestServer,
} from "../../../test/test_helper";
import { describe, it } from "mocha";
import { StatusCodes } from "http-status-codes";
import { CyvasseGameDataService } from "../../services/cyvasse/data/cyvasse_game_data_service";
import { CyvasseGameService } from "../../services/cyvasse/cyvasse_game_service";
import { PieceType } from "../../shared/dtos/cyvasse/piece_rule";
import { expect } from "chai";
import {
  IGame,
  PlayerColor,
  IGameSetupChange,
  Action,
  IGamePly,
} from "../../shared/dtos/cyvasse/game";

describe("CyvasseGameRoutes", () => {
  resetDatabaseBeforeEach();
  let testServer: ITestServer;
  let user1Credentials: IUserCredentials;
  let user1Id: number;
  let user2Credentials: IUserCredentials;
  let user2Id: number;
  let variantId: number;

  before(async () => {
    testServer = await createTestServer();
  });

  after(async () => {
    await testServer.quit();
  });

  beforeEach(async () => {
    user1Credentials = createTestCredentials("user1");
    user1Id = await createTestUser(user1Credentials);
    user2Credentials = createTestCredentials("user2");
    user2Id = await createTestUser(user2Credentials);
    variantId = await createTestVariant(user1Id);
  });

  describe("get game (GET /api/cyvasse/games/:gameId)", () => {
    it("if not found, returns Not Found", async () => {
      // Arrange
      const agent = await loginTestUser(testServer.app, user1Credentials);

      // Act
      await agent.get(`/api/cyvasse/games/999`).expect(StatusCodes.NOT_FOUND);

      // Assert
    });

    describe("in setup", () => {
      let gameId: number;

      beforeEach(async () => {
        gameId = (
          await new CyvasseGameDataService().createGame({
            variantId,
            alabasterUserId: user1Id,
            onyxUserId: user2Id,
          })
        ).gameId;
        await new CyvasseGameService().updateGameSetup(user1Id, gameId, {
          pieceChange: {
            pieceTypeId: PieceType.KING,
            to: { x: 0, y: -1 },
          },
        });
        await new CyvasseGameService().updateGameSetup(user2Id, gameId, {
          pieceChange: {
            pieceTypeId: PieceType.KING,
            to: { x: 0, y: 1 },
          },
        });
      });

      it("on success for alabaster user, returns only the alabaster setup", async () => {
        // Arrange
        const agent = await loginTestUser(testServer.app, user1Credentials);

        // Act
        const response = await agent
          .get(`/api/cyvasse/games/${gameId}`)
          .expect(StatusCodes.OK);

        // Assert
        expect(response.body).to.exist();
        const game: IGame = response.body;
        expect(game.alabasterSetupCoordinateMap).to.eql([
          {
            key: { x: 0, y: -1 },
            value: {
              piece: {
                pieceTypeId: PieceType.KING,
                playerColor: PlayerColor.ALABASTER,
              },
            },
          },
        ]);
        expect(game.onyxSetupCoordinateMap).to.eql([]);
      });

      it("on success for onyx user, returns only the onyx setup", async () => {
        // Arrange
        const agent = await loginTestUser(testServer.app, user2Credentials);

        // Act
        const response = await agent
          .get(`/api/cyvasse/games/${gameId}`)
          .expect(StatusCodes.OK);

        // Assert
        expect(response.body).to.exist();
        const game: IGame = response.body;
        expect(game.alabasterSetupCoordinateMap).to.eql([]);
        expect(game.onyxSetupCoordinateMap).to.eql([
          {
            key: { x: 0, y: 1 },
            value: {
              piece: {
                pieceTypeId: PieceType.KING,
                playerColor: PlayerColor.ONYX,
              },
            },
          },
        ]);
      });

      it("on success for spectator, returns no setup", async () => {
        // Arrange
        const { agent } = await createAndLoginTestUser(testServer.app, "user3");

        // Act
        const response = await agent
          .get(`/api/cyvasse/games/${gameId}`)
          .expect(StatusCodes.OK);

        // Assert
        expect(response.body).to.exist();
        const game: IGame = response.body;
        expect(game.alabasterSetupCoordinateMap).to.eql([]);
        expect(game.onyxSetupCoordinateMap).to.eql([]);
      });
    });
  });

  describe("update game setup (POST /api/cyvasse/games/:gameId/updateSetup)", () => {
    it("if not found, returns Not Found", async () => {
      // Arrange
      const agent = await loginTestUser(testServer.app, user1Credentials);

      // Act
      await agent
        .post(`/api/cyvasse/games/999/updateSetup`)
        .expect(StatusCodes.NOT_FOUND);

      // Assert
    });

    describe("in setup", () => {
      let gameId: number;

      beforeEach(async () => {
        gameId = (
          await new CyvasseGameDataService().createGame({
            variantId,
            alabasterUserId: user1Id,
            onyxUserId: user2Id,
          })
        ).gameId;
      });

      it("on success for alabaster user, updates", async () => {
        // Arrange
        const agent = await loginTestUser(testServer.app, user1Credentials);
        const request: IGameSetupChange = {
          pieceChange: {
            pieceTypeId: PieceType.KING,
            to: { x: 0, y: -1 },
          },
        };

        // Act
        await agent
          .post(`/api/cyvasse/games/${gameId}/updateSetup`)
          .send(request)
          .expect(StatusCodes.OK);

        // Assert
        const updatedGame = await new CyvasseGameDataService().getGame(gameId);
        expect(updatedGame.alabasterSetupCoordinateMap).to.eql([
          {
            key: { x: 0, y: -1 },
            value: {
              piece: {
                pieceTypeId: PieceType.KING,
                playerColor: PlayerColor.ALABASTER,
              },
            },
          },
        ]);
      });
    });
  });

  describe("complete game setup (POST /api/cyvasse/games/:gameId/completeSetup)", () => {
    it("if not found, returns Not Found", async () => {
      // Arrange
      const agent = await loginTestUser(testServer.app, user1Credentials);

      // Act
      await agent
        .post(`/api/cyvasse/games/999/completeSetup`)
        .expect(StatusCodes.NOT_FOUND);

      // Assert
    });

    describe("in setup, neither player completed", () => {
      let gameId: number;

      beforeEach(async () => {
        gameId = (
          await new CyvasseGameDataService().createGame({
            variantId,
            alabasterUserId: user1Id,
            onyxUserId: user2Id,
          })
        ).gameId;
        await new CyvasseGameService().updateGameSetup(user1Id, gameId, {
          pieceChange: {
            pieceTypeId: PieceType.KING,
            to: { x: 0, y: -1 },
          },
        });
      });

      it("on success, updates state", async () => {
        // Arrange
        const agent = await loginTestUser(testServer.app, user1Credentials);

        // Act
        await agent
          .post(`/api/cyvasse/games/${gameId}/completeSetup`)
          .expect(StatusCodes.OK);

        // Assert
        const updatedGame = await new CyvasseGameDataService().getGame(gameId);
        expect(updatedGame.action).to.eql(Action.SETUP);
        expect(updatedGame.actionTo).to.eql(PlayerColor.ONYX);
      });
    });

    describe("in setup, other player completed", () => {
      let gameId: number;

      beforeEach(async () => {
        gameId = (
          await new CyvasseGameDataService().createGame({
            variantId,
            alabasterUserId: user1Id,
            onyxUserId: user2Id,
          })
        ).gameId;
        await new CyvasseGameService().updateGameSetup(user1Id, gameId, {
          pieceChange: {
            pieceTypeId: PieceType.KING,
            to: { x: 0, y: -1 },
          },
        });
        await new CyvasseGameService().updateGameSetup(user2Id, gameId, {
          pieceChange: {
            pieceTypeId: PieceType.KING,
            to: { x: 0, y: 1 },
          },
        });
        await new CyvasseGameService().completeGameSetup(user2Id, gameId);
      });

      it("on success, updates state", async () => {
        // Arrange
        const agent = await loginTestUser(testServer.app, user1Credentials);

        // Act
        await agent
          .post(`/api/cyvasse/games/${gameId}/completeSetup`)
          .expect(StatusCodes.OK);

        // Assert
        const updatedGame = await new CyvasseGameDataService().getGame(gameId);
        expect(updatedGame.action).to.eql(Action.PLAY);
        expect(updatedGame.actionTo).to.eql(PlayerColor.ALABASTER);
        expect(updatedGame.currentCoordinateMap).to.eql([
          {
            key: { x: 0, y: -1 },
            value: {
              piece: {
                pieceTypeId: PieceType.KING,
                playerColor: PlayerColor.ALABASTER,
              },
            },
          },
          {
            key: { x: 0, y: 1 },
            value: {
              piece: {
                pieceTypeId: PieceType.KING,
                playerColor: PlayerColor.ONYX,
              },
            },
          },
        ]);
      });
    });
  });

  describe("create game ply (POST /api/cyvasse/games/:gameId/createPly)", () => {
    it("if not found, returns Not Found", async () => {
      // Arrange
      const agent = await loginTestUser(testServer.app, user1Credentials);

      // Act
      await agent
        .post(`/api/cyvasse/games/999/createPly`)
        .expect(StatusCodes.NOT_FOUND);

      // Assert
    });

    describe("in play, ply does not cause game to end", () => {
      let gameId: number;

      beforeEach(async () => {
        gameId = (
          await new CyvasseGameDataService().createGame({
            variantId,
            alabasterUserId: user1Id,
            onyxUserId: user2Id,
          })
        ).gameId;
        await new CyvasseGameService().updateGameSetup(user1Id, gameId, {
          pieceChange: {
            pieceTypeId: PieceType.KING,
            to: { x: 0, y: -1 },
          },
        });
        await new CyvasseGameService().updateGameSetup(user2Id, gameId, {
          pieceChange: {
            pieceTypeId: PieceType.KING,
            to: { x: 0, y: 1 },
          },
        });
        await new CyvasseGameService().completeGameSetup(user1Id, gameId);
        await new CyvasseGameService().completeGameSetup(user2Id, gameId);
      });

      it("on success, updates state", async () => {
        // Arrange
        const agent = await loginTestUser(testServer.app, user1Credentials);
        const request: IGamePly = {
          piece: {
            pieceTypeId: PieceType.KING,
            playerColor: PlayerColor.ALABASTER,
          },
          from: { x: 0, y: -1 },
          movement: {
            to: { x: 0, y: 0 },
          },
        };

        // Act
        await agent
          .post(`/api/cyvasse/games/${gameId}/createPly`)
          .send(request)
          .expect(StatusCodes.OK);

        // Assert
        const updatedGame = await new CyvasseGameDataService().getGame(gameId);
        expect(updatedGame.action).to.eql(Action.PLAY);
        expect(updatedGame.actionTo).to.eql(PlayerColor.ONYX);
        expect(updatedGame.currentCoordinateMap).to.eql([
          {
            key: { x: 0, y: 0 },
            value: {
              piece: {
                pieceTypeId: PieceType.KING,
                playerColor: PlayerColor.ALABASTER,
              },
            },
          },
          {
            key: { x: 0, y: 1 },
            value: {
              piece: {
                pieceTypeId: PieceType.KING,
                playerColor: PlayerColor.ONYX,
              },
            },
          },
        ]);
        expect(updatedGame.plies).to.eql([request]);
      });
    });

    describe("in play, ply causes game to end", () => {
      let gameId: number;

      beforeEach(async () => {
        gameId = (
          await new CyvasseGameDataService().createGame({
            variantId,
            alabasterUserId: user1Id,
            onyxUserId: user2Id,
          })
        ).gameId;
        await new CyvasseGameService().updateGameSetup(user1Id, gameId, {
          pieceChange: {
            pieceTypeId: PieceType.KING,
            to: { x: 0, y: -1 },
          },
        });
        await new CyvasseGameService().updateGameSetup(user2Id, gameId, {
          pieceChange: {
            pieceTypeId: PieceType.KING,
            to: { x: 0, y: 1 },
          },
        });
        await new CyvasseGameService().completeGameSetup(user1Id, gameId);
        await new CyvasseGameService().completeGameSetup(user2Id, gameId);
        await new CyvasseGameService().createGamePly(user1Id, gameId, {
          piece: {
            pieceTypeId: PieceType.KING,
            playerColor: PlayerColor.ALABASTER,
          },
          from: { x: 0, y: -1 },
          movement: {
            to: { x: 0, y: 0 },
          },
        });
      });

      it("on success, updates state", async () => {
        // Arrange
        const agent = await loginTestUser(testServer.app, user2Credentials);
        const request: IGamePly = {
          piece: { pieceTypeId: PieceType.KING, playerColor: PlayerColor.ONYX },
          from: { x: 0, y: 1 },
          movement: {
            to: { x: 0, y: 0 },
            capturedPiece: {
              pieceTypeId: PieceType.KING,
              playerColor: PlayerColor.ALABASTER,
            },
          },
        };

        // Act
        await agent
          .post(`/api/cyvasse/games/${gameId}/createPly`)
          .send(request)
          .expect(StatusCodes.OK);

        // Assert
        const updatedGame = await new CyvasseGameDataService().getGame(gameId);
        expect(updatedGame.action).to.eql(Action.COMPLETE);
        expect(updatedGame.actionTo).to.eql(PlayerColor.ALABASTER);
        expect(updatedGame.currentCoordinateMap).to.eql([
          {
            key: { x: 0, y: 0 },
            value: {
              piece: {
                pieceTypeId: PieceType.KING,
                playerColor: PlayerColor.ONYX,
              },
            },
          },
        ]);
        expect(updatedGame.plies).to.eql([
          {
            piece: {
              pieceTypeId: PieceType.KING,
              playerColor: PlayerColor.ALABASTER,
            },
            from: { x: 0, y: -1 },
            movement: {
              to: { x: 0, y: 0 },
            },
          },
          request,
        ]);
      });
    });
  });
});
