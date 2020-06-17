import {
  createTestVariant,
  createTestUser,
  createTestCredentials,
  resetDatabaseBeforeEach,
  IUserCredentials,
  loginTestUser,
} from "../../test/test_helper";
import { createExpressApp } from ".";
import { describe, it } from "mocha";
import HttpStatus from "http-status-codes";
import { GameDataService } from "../services/data/game_data_service";
import { GameService } from "../services/game_service";
import { PieceType } from "../shared/dtos/piece_rule";

describe("GameRoutes", () => {
  resetDatabaseBeforeEach();
  const app = createExpressApp({
    corsOrigins: [],
    sessionCookieSecure: false,
    sessionSecret: "test",
  });
  let user1Credentials: IUserCredentials;
  let user1Id: number;
  let user2Credentials: IUserCredentials;
  let user2Id: number;
  let variantId: number;

  beforeEach(async () => {
    user1Credentials = createTestCredentials("user1");
    user1Id = await createTestUser(user1Credentials);
    user2Credentials = createTestCredentials("user2");
    user2Id = await createTestUser(user2Credentials);
    variantId = await createTestVariant(user1Id);
  });

  describe("get game (GET /api/games/:gameId)", () => {
    it("if not found, returns Not Found", async () => {
      // Arrange
      const agent = await loginTestUser(app, user1Credentials);

      // Act
      await agent.get(`/api/games/999`).expect(HttpStatus.NOT_FOUND);

      // Assert
    });

    describe("in setup", () => {
      let gameId: number;

      beforeEach(async () => {
        gameId = (
          await new GameDataService().createGame({
            variantId,
            alabasterUserId: user1Id,
            onyxUserId: user2Id,
          })
        ).gameId;
        await new GameService().updateGameSetup(user1Id, gameId, {
          pieceChange: {
            pieceTypeId: PieceType.KING,
            to: { x: 0, y: 1 },
          },
        });
        await new GameService().updateGameSetup(user2Id, gameId, {
          pieceChange: {
            pieceTypeId: PieceType.KING,
            to: { x: 0, y: -1 },
          },
        });
      });

      it("on success for alabaster user, returns only the alabaster setup", () => {
        // Arrange
        // Act
        // Assert
      });

      it("on success for onyx user, returns only the onyx setup", () => {});

      it("on success for spectator, returns no setup", () => {});
    });

    describe("in any other state", () => {
      it("on success, returns the game", () => {});
    });
  });
});
