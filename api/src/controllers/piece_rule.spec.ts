import { describe, it } from "mocha";
import { createExpressApp } from "./";
import { expect } from "chai";
import {
  resetDatabaseBeforeEach,
  createTestUser,
  loginTestUser,
  IUserCredentials,
  createAndLoginTestUser,
  createTestVariant,
  createTestCredentials,
  createTestPieceRule,
} from "../../test/test_helper";
import supertest from "supertest";
import {
  IPieceRuleOptions,
  PieceType,
  PathType,
  CaptureType,
  IPieceRule,
} from "../shared/dtos/piece_rule";
import { PieceRuleDataService } from "../services/data/piece_rule_data_service";
import { PieceRule } from "../database/models";

describe("PieceRuleRoutes", () => {
  resetDatabaseBeforeEach();
  const app = createExpressApp({
    corsOrigins: [],
    sessionCookieSecure: false,
    sessionSecret: "test",
  });
  let creatorCredentials: IUserCredentials;
  let creatorId: number;
  let variantId: number;

  beforeEach(async () => {
    creatorCredentials = createTestCredentials("test");
    creatorId = await createTestUser(creatorCredentials);
    variantId = await createTestVariant(creatorId);
  });

  describe("create piece rule (POST /api/variants/:variantId/pieceRules)", () => {
    const pieceRuleOptions: IPieceRuleOptions = {
      pieceTypeId: PieceType.RABBLE,
      count: 1,
      movement: {
        type: PathType.ORTHOGONAL_WITH_TURNS,
        minimum: 1,
        maximum: 1,
      },
      captureType: CaptureType.MOVEMENT,
    };

    it("if not logged in, returns 401", async () => {
      // Arrange

      // Act
      await supertest(app)
        .post(`/api/variants/${variantId}/pieceRules`)
        .send(pieceRuleOptions)
        .expect(401);

      // Assert
    });

    it("if logged in as non-creator, returns 401", async () => {
      // Arrange
      const { agent } = await createAndLoginTestUser(app, "user2");

      // Act
      await agent
        .post(`/api/variants/${variantId}/pieceRules`)
        .send(pieceRuleOptions)
        .expect(401);

      // Assert
    });

    it("if validation errors, returns 422 with errors in body", async () => {
      // Arrange
      const agent = await loginTestUser(app, creatorCredentials);

      // Act
      const response = await agent
        .post(`/api/variants/${variantId}/pieceRules`)
        .send({})
        .expect(422);

      // Assert
      expect(response.body).to.eql({
        pieceTypeId: "Piece type is required",
        count: "Count is required",
        movement: {
          type: "Movement type is required",
          minimum: "Movement minimum is required",
        },
      });
    });

    it("on success, returns created object", async () => {
      // Arrange
      const agent = await loginTestUser(app, creatorCredentials);

      // Act
      const response = await agent
        .post(`/api/variants/${variantId}/pieceRules`)
        .send(pieceRuleOptions)
        .expect(200);

      // Assert
      expect(response.body).to.exist();
      expect(response.body.pieceRuleId).to.exist();
    });
  });

  describe("delete piece rule (DETELE /api/variants/:variantId/pieceRules/:pieceRuleId)", () => {
    let pieceRuleId: number;

    beforeEach(async () => {
      pieceRuleId = await createTestPieceRule(PieceType.RABBLE, variantId);
    });

    it("if not logged in, returns 401", async () => {
      // Arrange

      // Act
      await supertest(app)
        .delete(`/api/variants/${variantId}/pieceRules/${pieceRuleId}`)
        .expect(401);

      // Assert
    });

    it("if logged in as non-creator, returns 401", async () => {
      // Arrange
      const { agent } = await createAndLoginTestUser(app, "user2");

      // Act
      await agent
        .delete(`/api/variants/${variantId}/pieceRules/${pieceRuleId}`)
        .expect(401);

      // Assert
    });

    it("if not found, returns 404", async () => {
      // Arrange
      const agent = await loginTestUser(app, creatorCredentials);

      // Act
      await agent
        .delete(`/api/variants/${variantId}/pieceRules/999`)
        .expect(404);

      // Assert
    });

    it("on success, deletes the object", async () => {
      // Arrange
      const agent = await loginTestUser(app, creatorCredentials);

      // Act
      await agent
        .delete(`/api/variants/${variantId}/pieceRules/${pieceRuleId}`)
        .expect(200);

      // Assert
      const pieceRules = await new PieceRuleDataService().getPieceRules(
        variantId
      );
      expect(pieceRules.map((pr) => pr.pieceTypeId)).to.eql([PieceType.KING]);
    });
  });

  describe("get piece rules (GET /api/variants/:variantId/pieceRules)", () => {
    it("with default piece rules, returns the king piece rule", async () => {
      // Arrange
      const agent = await loginTestUser(app, creatorCredentials);

      // Act
      const response = await agent
        .get(`/api/variants/${variantId}/pieceRules`)
        .expect(200);

      // Assert
      expect(response.body).to.exist();
      const pieceRules: IPieceRule[] = response.body;
      expect(pieceRules.map((pr) => pr.pieceTypeId)).to.eql([PieceType.KING]);
    });

    it("with piece rules, returns the list", async () => {
      // Arrange
      await createTestPieceRule(PieceType.RABBLE, variantId);
      await createTestPieceRule(PieceType.SPEAR, variantId);
      const agent = await loginTestUser(app, creatorCredentials);

      // Act
      const response = await agent
        .get(`/api/variants/${variantId}/pieceRules`)
        .expect(200);

      // Assert
      expect(response.body).to.exist();
      const pieceRules: PieceRule[] = response.body;
      expect(pieceRules.length).to.eql(3);
      expect(pieceRules.map((x) => x.pieceTypeId)).to.have.members([
        PieceType.KING,
        PieceType.RABBLE,
        PieceType.SPEAR,
      ]);
    });
  });

  describe("update piece rule (UPDATE /api/variants/:variantId/pieceRules/:pieceRuleId)", () => {
    let pieceRuleId: number;
    const updatedPieceRuleOptions: IPieceRuleOptions = {
      pieceTypeId: PieceType.RABBLE,
      count: 1,
      movement: {
        type: PathType.DIAGONAL_LINE,
        minimum: 1,
        maximum: 1,
      },
      captureType: CaptureType.MOVEMENT,
    };

    beforeEach(async () => {
      pieceRuleId = await createTestPieceRule(PieceType.RABBLE, variantId);
    });

    it("if not logged in, returns 401", async () => {
      // Arrange

      // Act
      await supertest(app)
        .put(`/api/variants/${variantId}/pieceRules/${pieceRuleId}`)
        .send(updatedPieceRuleOptions)
        .expect(401);

      // Assert
    });

    it("if logged in as non-creator, returns 401", async () => {
      // Arrange
      const { agent } = await createAndLoginTestUser(app, "user2");

      // Act
      await agent
        .put(`/api/variants/${variantId}/pieceRules/${pieceRuleId}`)
        .send(updatedPieceRuleOptions)
        .expect(401);

      // Assert
    });

    it("if not found, returns 404", async () => {
      // Arrange
      const agent = await loginTestUser(app, creatorCredentials);

      // Act
      await agent
        .put(`/api/variants/${variantId}/pieceRules/999`)
        .send(updatedPieceRuleOptions)
        .expect(404);

      // Assert
    });

    it("if validation errors, returns 422 with errors in body", async () => {
      // Arrange
      const agent = await loginTestUser(app, creatorCredentials);

      // Act
      const response = await agent
        .put(`/api/variants/${variantId}/pieceRules/${pieceRuleId}`)
        .send({})
        .expect(422);

      // Assert
      expect(response.body).to.eql({
        pieceTypeId: "Piece type is required",
        count: "Count is required",
        movement: {
          type: "Movement type is required",
          minimum: "Movement minimum is required",
        },
      });
    });

    it("on success, returns the updated object", async () => {
      // Arrange
      const agent = await loginTestUser(app, creatorCredentials);

      // Act
      const response = await agent
        .put(`/api/variants/${variantId}/pieceRules/${pieceRuleId}`)
        .send(updatedPieceRuleOptions)
        .expect(200);

      // Assert
      expect(response.body).to.exist();
      const result: IPieceRule = response.body;
      expect(result.movement.type).to.eql(PathType.DIAGONAL_LINE);
    });
  });
});
