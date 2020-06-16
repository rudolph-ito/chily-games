import {
  createTestVariant,
  createTestUser,
  createTestCredentials,
  resetDatabaseBeforeEach,
  createAndLoginTestUser,
  createTestChallenge,
  IUserCredentials,
  loginTestUser,
} from "../../test/test_helper";
import { createExpressApp } from ".";
import supertest from "supertest";
import { IChallengeOptions, ChallengePlayAs } from "../shared/dtos/challenge";
import { expect } from "chai";
import { describe, it } from "mocha";
import { ChallengeService } from "../services/challenge_service";
import { IGame } from "../shared/dtos/game";
import HttpStatus from "http-status-codes";

describe("ChallengeRoutes", () => {
  resetDatabaseBeforeEach();
  const app = createExpressApp({
    corsOrigins: [],
    sessionCookieSecure: false,
    sessionSecret: "test",
  });
  let user1Credentials: IUserCredentials;
  let user1Id: number;
  let variantId: number;

  beforeEach(async () => {
    user1Credentials = createTestCredentials("test");
    user1Id = await createTestUser(user1Credentials);
    variantId = await createTestVariant(user1Id);
  });

  describe("create challenge (POST /api/challenges/)", () => {
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
      await supertest(app)
        .post(`/api/challenges`)
        .send(challengeOptions)
        .expect(HttpStatus.UNAUTHORIZED);

      // Assert
    });

    it("on success, returns created object", async () => {
      // Arrange
      const { agent } = await createAndLoginTestUser(app, "user2");

      // Act
      const response = await agent
        .post(`/api/challenges`)
        .send(challengeOptions)
        .expect(HttpStatus.OK);

      // Assert
      expect(response.body).to.exist();
      expect(response.body.challengeId).to.exist();
    });
  });

  describe("delete challenge (DELETE /api/challenges/:challengeId)", () => {
    let challengeId: number;
    beforeEach(async () => {
      challengeId = await createTestChallenge(user1Id, variantId);
    });

    it("if not logged in, returns Unauthorized", async () => {
      // Arrange

      // Act
      await supertest(app)
        .delete(`/api/challenges/${challengeId}`)
        .expect(HttpStatus.UNAUTHORIZED);

      // Assert
    });

    it("if logged in as non-creator, returns Forbidden", async () => {
      // Arrange
      const { agent } = await createAndLoginTestUser(app, "user2");

      // Act
      await agent
        .delete(`/api/challenges/${challengeId}`)
        .expect(HttpStatus.FORBIDDEN);

      // Assert
    });

    it("if not found, returns Not Found", async () => {
      // Arrange
      const agent = await loginTestUser(app, user1Credentials);

      // Act
      await agent.delete(`/api/challenges/999`).expect(HttpStatus.NOT_FOUND);

      // Assert
    });

    it("on success, deletes the object", async () => {
      // Arrange
      const agent = await loginTestUser(app, user1Credentials);

      // Act
      await agent
        .delete(`/api/challenges/${challengeId}`)
        .expect(HttpStatus.OK);

      // Assert
      const paginatedChallenges = await new ChallengeService().searchChallenges(
        { pagination: { pageSize: 10, pageIndex: 0 } }
      );
      expect(paginatedChallenges.total).to.equal(0);
    });
  });

  describe("accept challenge (POST /api/challenges/:challengeId/accept)", () => {
    it("if not found, returns Not Found", async () => {
      // Arrange
      const agent = await loginTestUser(app, user1Credentials);

      // Act
      await agent
        .post(`/api/challenges/999/accept`)
        .expect(HttpStatus.NOT_FOUND);

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
        await supertest(app)
          .post(`/api/challenges/${challengeId}/accept`)
          .expect(HttpStatus.UNAUTHORIZED);

        // Assert
      });

      it("if logged in creator, returns Unprocessable Entity", async () => {
        // Arrange
        const agent = await loginTestUser(app, user1Credentials);

        // Act
        const response = await agent
          .post(`/api/challenges/${challengeId}/accept`)
          .expect(HttpStatus.UNPROCESSABLE_ENTITY);

        // Assert
        expect(response.body).to.eql({
          challengeId: "Cannot accept your own challenge",
        });
      });

      it("on success, deletes the object and creates a game", async () => {
        // Arrange
        const user2Credentials = createTestCredentials("user2");
        const user2Id = await createTestUser(user2Credentials);
        const agent = await loginTestUser(app, user2Credentials);

        // Act
        const response = await agent
          .post(`/api/challenges/${challengeId}/accept`)
          .expect(HttpStatus.OK);

        // Assert
        expect(response.body).to.exist();
        const game: IGame = response.body;
        expect(game.alabasterUserId).to.eql(user1Id);
        expect(game.onyxUserId).to.eql(user2Id);
        const paginatedChallenges = await new ChallengeService().searchChallenges(
          { pagination: { pageSize: 10, pageIndex: 0 } }
        );
        expect(paginatedChallenges.total).to.equal(0);
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
        await supertest(app)
          .post(`/api/challenges/${challengeId}/accept`)
          .expect(HttpStatus.UNAUTHORIZED);

        // Assert
      });

      it("if logged in creator, returns Unprocessable Entity", async () => {
        // Arrange
        const agent = await loginTestUser(app, user1Credentials);

        // Act
        const response = await agent
          .post(`/api/challenges/${challengeId}/accept`)
          .expect(HttpStatus.UNPROCESSABLE_ENTITY);

        // Assert
        expect(response.body).to.eql({
          challengeId: "Cannot accept your own challenge",
        });
      });

      it("if logged in as non-opponent, returns Unprocessable Entity", async () => {
        // Arrange
        const { agent } = await createAndLoginTestUser(app, "user3");

        // Act
        const response = await agent
          .post(`/api/challenges/${challengeId}/accept`)
          .expect(HttpStatus.UNPROCESSABLE_ENTITY);

        // Assert
        expect(response.body).to.eql({
          challengeId: "Cannot accept challenge for other user",
        });
      });

      it("on success, deletes the object and creates a game", async () => {
        // Arrange
        const agent = await loginTestUser(app, user2Credentials);

        // Act
        const response = await agent
          .post(`/api/challenges/${challengeId}/accept`)
          .expect(HttpStatus.OK);

        // Assert
        expect(response.body).to.exist();
        const game: IGame = response.body;
        expect(game.alabasterUserId).to.eql(user1Id);
        expect(game.onyxUserId).to.eql(user2Id);
        const paginatedChallenges = await new ChallengeService().searchChallenges(
          { pagination: { pageSize: 10, pageIndex: 0 } }
        );
        expect(paginatedChallenges.total).to.equal(0);
      });
    });
  });
});
