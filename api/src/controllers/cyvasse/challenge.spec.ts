import {
  createTestVariant,
  createTestUser,
  createTestCredentials,
  resetDatabaseBeforeEach,
  createAndLoginTestUser,
  createTestChallenge,
  IUserCredentials,
  loginTestUser,
  createTestServer,
  ITestServer,
} from "../../../test/test_helper";
import supertest from "supertest";
import {
  IChallengeOptions,
  ChallengePlayAs,
} from "../../shared/dtos/cyvasse/challenge";

import { CyvasseChallengeService } from "../../services/cyvasse/cyvasse_challenge_service";
import { IGame } from "../../shared/dtos/cyvasse/game";
import { StatusCodes } from "http-status-codes";

describe("CyvasseChallengeRoutes", () => {
  resetDatabaseBeforeEach();
  let testServer: ITestServer;
  let user1Credentials: IUserCredentials;
  let user1Id: number;
  let variantId: number;

  beforeAll(async () => {
    testServer = await createTestServer();
  });

  afterAll(async () => {
    await testServer.quit();
  });

  beforeEach(async () => {
    user1Credentials = createTestCredentials("test");
    user1Id = await createTestUser(user1Credentials);
    variantId = await createTestVariant(user1Id);
  });

  describe("create challenge (POST /api/cyvasse/challenges/)", () => {
    let challengeOptions: IChallengeOptions;
    beforeEach(() => {
      challengeOptions = {
        creatorPlayAs: ChallengePlayAs.ALABASTER,
        variantId,
      };
    });

    it("if not logged in, returns Unauthorized", async () => {
      // Arrange

      // Act
      await supertest(testServer.app)
        .post(`/api/cyvasse/challenges`)
        .send(challengeOptions)
        .expect(StatusCodes.UNAUTHORIZED);

      // Assert
    });

    it("on success, returns created object", async () => {
      // Arrange
      const { agent } = await createAndLoginTestUser(testServer.app, "user2");

      // Act
      const response = await agent
        .post(`/api/cyvasse/challenges`)
        .send(challengeOptions)
        .expect(StatusCodes.OK);

      // Assert
      expect(response.body).toBeDefined();
      expect(response.body.challengeId).toBeDefined();
    });
  });

  describe("delete challenge (DELETE /api/cyvasse/challenges/:challengeId)", () => {
    let challengeId: number;
    beforeEach(async () => {
      challengeId = await createTestChallenge(user1Id, variantId);
    });

    it("if not logged in, returns Unauthorized", async () => {
      // Arrange

      // Act
      await supertest(testServer.app)
        .delete(`/api/cyvasse/challenges/${challengeId}`)
        .expect(StatusCodes.UNAUTHORIZED);

      // Assert
    });

    it("if logged in as non-creator, returns Forbidden", async () => {
      // Arrange
      const { agent } = await createAndLoginTestUser(testServer.app, "user2");

      // Act
      await agent
        .delete(`/api/cyvasse/challenges/${challengeId}`)
        .expect(StatusCodes.FORBIDDEN);

      // Assert
    });

    it("if not found, returns Not Found", async () => {
      // Arrange
      const agent = await loginTestUser(testServer.app, user1Credentials);

      // Act
      await agent
        .delete(`/api/cyvasse/challenges/999`)
        .expect(StatusCodes.NOT_FOUND);

      // Assert
    });

    it("on success, deletes the object", async () => {
      // Arrange
      const agent = await loginTestUser(testServer.app, user1Credentials);

      // Act
      await agent
        .delete(`/api/cyvasse/challenges/${challengeId}`)
        .expect(StatusCodes.OK);

      // Assert
      const paginatedChallenges =
        await new CyvasseChallengeService().searchChallenges({
          pagination: { pageSize: 10, pageIndex: 0 },
        });
      expect(paginatedChallenges.total).toEqual(0);
    });
  });

  describe("accept challenge (POST /api/cyvasse/challenges/:challengeId/accept)", () => {
    it("if not found, returns Not Found", async () => {
      // Arrange
      const agent = await loginTestUser(testServer.app, user1Credentials);

      // Act
      await agent
        .post(`/api/cyvasse/challenges/999/accept`)
        .expect(StatusCodes.NOT_FOUND);

      // Assert
    });

    describe("open challenge", () => {
      let challengeId: number;
      beforeEach(async () => {
        challengeId = await createTestChallenge(user1Id, variantId);
      });

      it("if not logged in, returns Unauthorized", async () => {
        // Arrange

        // Act
        await supertest(testServer.app)
          .post(`/api/cyvasse/challenges/${challengeId}/accept`)
          .expect(StatusCodes.UNAUTHORIZED);

        // Assert
      });

      it("if logged in creator, returns Unprocessable Entity", async () => {
        // Arrange
        const agent = await loginTestUser(testServer.app, user1Credentials);

        // Act
        const response = await agent
          .post(`/api/cyvasse/challenges/${challengeId}/accept`)
          .expect(StatusCodes.UNPROCESSABLE_ENTITY);

        // Assert
        expect(response.body).toEqual({
          challengeId: "Cannot accept your own challenge",
        });
      });

      it("on success, deletes the object and creates a game", async () => {
        // Arrange
        const user2Credentials = createTestCredentials("user2");
        const user2Id = await createTestUser(user2Credentials);
        const agent = await loginTestUser(testServer.app, user2Credentials);

        // Act
        const response = await agent
          .post(`/api/cyvasse/challenges/${challengeId}/accept`)
          .expect(StatusCodes.OK);

        // Assert
        expect(response.body).toBeDefined();
        const game: IGame = response.body;
        expect(game.alabasterUserId).toEqual(user1Id);
        expect(game.onyxUserId).toEqual(user2Id);
        const paginatedChallenges =
          await new CyvasseChallengeService().searchChallenges({
            pagination: { pageSize: 10, pageIndex: 0 },
          });
        expect(paginatedChallenges.total).toEqual(0);
      });
    });

    describe("challenging a specific user", () => {
      let user2Credentials: IUserCredentials;
      let user2Id: number;
      let challengeId: number;

      beforeEach(async () => {
        user2Credentials = createTestCredentials("user2");
        user2Id = await createTestUser(user2Credentials);
        challengeId = await createTestChallenge(user1Id, variantId, user2Id);
      });

      it("if not logged in, returns Unauthorized", async () => {
        // Arrange

        // Act
        await supertest(testServer.app)
          .post(`/api/cyvasse/challenges/${challengeId}/accept`)
          .expect(StatusCodes.UNAUTHORIZED);

        // Assert
      });

      it("if logged in creator, returns Unprocessable Entity", async () => {
        // Arrange
        const agent = await loginTestUser(testServer.app, user1Credentials);

        // Act
        const response = await agent
          .post(`/api/cyvasse/challenges/${challengeId}/accept`)
          .expect(StatusCodes.UNPROCESSABLE_ENTITY);

        // Assert
        expect(response.body).toEqual({
          challengeId: "Cannot accept your own challenge",
        });
      });

      it("if logged in as non-opponent, returns Unprocessable Entity", async () => {
        // Arrange
        const { agent } = await createAndLoginTestUser(testServer.app, "user3");

        // Act
        const response = await agent
          .post(`/api/cyvasse/challenges/${challengeId}/accept`)
          .expect(StatusCodes.UNPROCESSABLE_ENTITY);

        // Assert
        expect(response.body).toEqual({
          challengeId: "Cannot accept challenge for other user",
        });
      });

      it("on success, deletes the object and creates a game", async () => {
        // Arrange
        const agent = await loginTestUser(testServer.app, user2Credentials);

        // Act
        const response = await agent
          .post(`/api/cyvasse/challenges/${challengeId}/accept`)
          .expect(StatusCodes.OK);

        // Assert
        expect(response.body).toBeDefined();
        const game: IGame = response.body;
        expect(game.alabasterUserId).toEqual(user1Id);
        expect(game.onyxUserId).toEqual(user2Id);
        const paginatedChallenges =
          await new CyvasseChallengeService().searchChallenges({
            pagination: { pageSize: 10, pageIndex: 0 },
          });
        expect(paginatedChallenges.total).toEqual(0);
      });
    });
  });
});
