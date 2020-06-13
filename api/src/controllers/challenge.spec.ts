import {
  createTestVariant,
  createTestUser,
  createTestCredentials,
  resetDatabaseBeforeEach,
  createAndLoginTestUser,
  tempStatusChecker,
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

describe.only("ChallengeRoutes", () => {
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

    it("if not logged in, returns 401", async () => {
      // Arrange

      // Act
      await supertest(app)
        .post(`/api/challenges`)
        .send(challengeOptions)
        .expect(401);

      // Assert
    });

    it("on success, returns created object", async () => {
      // Arrange
      const { agent } = await createAndLoginTestUser(app, "user2");

      // Act
      const response = await agent
        .post(`/api/challenges`)
        .send(challengeOptions)
        .expect(tempStatusChecker(200));

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

    it("if not logged in, returns 401", async () => {
      // Arrange

      // Act
      await supertest(app).delete(`/api/challenges/${challengeId}`).expect(401);

      // Assert
    });

    it("if logged in as non-creator, returns 401", async () => {
      // Arrange
      const { agent } = await createAndLoginTestUser(app, "user2");

      // Act
      await agent.delete(`/api/challenges/${challengeId}`).expect(401);

      // Assert
    });

    it("if not found, returns 404", async () => {
      // Arrange
      const agent = await loginTestUser(app, user1Credentials);

      // Act
      await agent.delete(`/api/challenges/999`).expect(404);

      // Assert
    });

    it("on success, deletes the object", async () => {
      // Arrange
      const agent = await loginTestUser(app, user1Credentials);

      // Act
      await agent.delete(`/api/challenges/${challengeId}`).expect(200);

      // Assert
      const paginatedChallenges = await new ChallengeService().searchChallenges(
        { pagination: { pageSize: 10, pageIndex: 0 } }
      );
      expect(paginatedChallenges.total).to.equal(0);
    });
  });
});
