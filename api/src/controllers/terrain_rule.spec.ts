import { describe, it } from "mocha";
import { createExpressApp } from ".";
import { expect } from "chai";
import {
  resetDatabaseBeforeEach,
  createTestUser,
  loginTestUser,
  IUserCredentials,
  createAndLoginTestUser,
  createTestVariant,
  createTestCredentials,
  createTestTerrainRule,
} from "../../test/test_helper";
import supertest from "supertest";
import {
  ITerrainRuleOptions,
  TerrainType,
  ITerrainRule,
  PiecesEffectedType,
} from "../shared/dtos/terrain_rule";
import { TerrainRuleDataService } from "../services/data/terrain_rule_data_service";
import { TerrainRule } from "../database/models";
import HttpStatus from "http-status-codes";

describe("TerrainRuleRoutes", () => {
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

  describe("create terrain rule (POST /api/variants/:variantId/terrainRules)", () => {
    const terrainRuleOptions: ITerrainRuleOptions = {
      terrainTypeId: TerrainType.FOREST,
      count: 1,
      passableMovement: {
        for: PiecesEffectedType.ALL,
        pieceTypeIds: [],
      },
      passableRange: {
        for: PiecesEffectedType.ALL,
        pieceTypeIds: [],
      },
      slowsMovement: {
        for: PiecesEffectedType.NONE,
        pieceTypeIds: [],
      },
      stopsMovement: {
        for: PiecesEffectedType.NONE,
        pieceTypeIds: [],
      },
    };

    it("if not logged in, returns Unauthorized", async () => {
      // Arrange

      // Act
      await supertest(app)
        .post(`/api/variants/${variantId}/terrainRules`)
        .send(terrainRuleOptions)
        .expect(HttpStatus.UNAUTHORIZED);

      // Assert
    });

    it("if logged in as non-creator, returns Forbidden", async () => {
      // Arrange
      const { agent } = await createAndLoginTestUser(app, "user2");

      // Act
      await agent
        .post(`/api/variants/${variantId}/terrainRules`)
        .send(terrainRuleOptions)
        .expect(HttpStatus.FORBIDDEN);

      // Assert
    });

    it("if validation errors, returns Unprocessable Entity", async () => {
      // Arrange
      const agent = await loginTestUser(app, creatorCredentials);

      // Act
      const response = await agent
        .post(`/api/variants/${variantId}/terrainRules`)
        .send({})
        .expect(HttpStatus.UNPROCESSABLE_ENTITY);

      // Assert
      expect(response.body).to.eql({
        terrainTypeId: "Terrain type is required",
        count: "Count is required",
        passableMovement: {
          for: "Passable movement for is required",
          pieceTypeIds: "Passable movement piece types are required",
        },
        passableRange: {
          for: "Passable range for is required",
          pieceTypeIds: "Passable range piece types are required",
        },
        slowsMovement: {
          for: "Slows movement for is required",
          pieceTypeIds: "Slows movement piece types are required",
        },
        stopsMovement: {
          for: "Stops movement for is required",
          pieceTypeIds: "Stops movement piece types are required",
        },
      });
    });

    it("on success, returns created object", async () => {
      // Arrange
      const agent = await loginTestUser(app, creatorCredentials);

      // Act
      const response = await agent
        .post(`/api/variants/${variantId}/terrainRules`)
        .send(terrainRuleOptions)
        .expect(HttpStatus.OK);

      // Assert
      expect(response.body).to.exist();
      expect(response.body.terrainRuleId).to.exist();
    });
  });

  describe("delete terrain rule (DETELE /api/variants/:variantId/terrainRules/:terrainRuleId)", () => {
    let terrainRuleId: number;

    beforeEach(async () => {
      terrainRuleId = await createTestTerrainRule(
        TerrainType.FOREST,
        variantId
      );
    });

    it("if not logged in, returns Unauthorized", async () => {
      // Arrange

      // Act
      await supertest(app)
        .delete(`/api/variants/${variantId}/terrainRules/${terrainRuleId}`)
        .expect(HttpStatus.UNAUTHORIZED);

      // Assert
    });

    it("if logged in as non-creator, returns Forbidden", async () => {
      // Arrange
      const { agent } = await createAndLoginTestUser(app, "user2");

      // Act
      await agent
        .delete(`/api/variants/${variantId}/terrainRules/${terrainRuleId}`)
        .expect(HttpStatus.FORBIDDEN);

      // Assert
    });

    it("if not found, returns Not Found", async () => {
      // Arrange
      const agent = await loginTestUser(app, creatorCredentials);

      // Act
      await agent
        .delete(`/api/variants/${variantId}/terrainRules/999`)
        .expect(HttpStatus.NOT_FOUND);

      // Assert
    });

    it("on success, deletes the object", async () => {
      // Arrange
      const agent = await loginTestUser(app, creatorCredentials);

      // Act
      await agent
        .delete(`/api/variants/${variantId}/terrainRules/${terrainRuleId}`)
        .expect(HttpStatus.OK);

      // Assert
      const terrainRules = await new TerrainRuleDataService().getTerrainRules(
        variantId
      );
      expect(terrainRules).to.eql([]);
    });
  });

  describe("get terrain rules (GET /api/variants/:variantId/terrainRules)", () => {
    it("with default terrain rules, returns the king terrain rule", async () => {
      // Arrange
      const agent = await loginTestUser(app, creatorCredentials);

      // Act
      const response = await agent
        .get(`/api/variants/${variantId}/terrainRules`)
        .expect(HttpStatus.OK);

      // Assert
      expect(response.body).to.exist();
      const terrainRules: ITerrainRule[] = response.body;
      expect(terrainRules.map((pr) => pr.terrainTypeId)).to.eql([]);
    });

    it("with terrain rules, returns the list", async () => {
      // Arrange
      await createTestTerrainRule(TerrainType.FOREST, variantId);
      await createTestTerrainRule(TerrainType.MOUNTAIN, variantId);
      const agent = await loginTestUser(app, creatorCredentials);

      // Act
      const response = await agent
        .get(`/api/variants/${variantId}/terrainRules`)
        .expect(HttpStatus.OK);

      // Assert
      expect(response.body).to.exist();
      const terrainRules: TerrainRule[] = response.body;
      expect(terrainRules.length).to.eql(2);
      expect(terrainRules.map((x) => x.terrainTypeId)).to.have.members([
        TerrainType.FOREST,
        TerrainType.MOUNTAIN,
      ]);
    });
  });

  describe("update terrain rule (UPDATE /api/variants/:variantId/terrainRules/:terrainRuleId)", () => {
    let terrainRuleId: number;
    const updatedTerrainRuleOptions: ITerrainRuleOptions = {
      terrainTypeId: TerrainType.FOREST,
      count: 1,
      passableMovement: {
        for: PiecesEffectedType.ALL,
        pieceTypeIds: [],
      },
      passableRange: {
        for: PiecesEffectedType.NONE,
        pieceTypeIds: [],
      },
      slowsMovement: {
        for: PiecesEffectedType.NONE,
        pieceTypeIds: [],
      },
      stopsMovement: {
        for: PiecesEffectedType.NONE,
        pieceTypeIds: [],
      },
    };

    beforeEach(async () => {
      terrainRuleId = await createTestTerrainRule(
        TerrainType.FOREST,
        variantId
      );
    });

    it("if not logged in, returns Unauthorized", async () => {
      // Arrange

      // Act
      await supertest(app)
        .put(`/api/variants/${variantId}/terrainRules/${terrainRuleId}`)
        .send(updatedTerrainRuleOptions)
        .expect(HttpStatus.UNAUTHORIZED);

      // Assert
    });

    it("if logged in as non-creator, returns Forbidden", async () => {
      // Arrange
      const { agent } = await createAndLoginTestUser(app, "user2");

      // Act
      await agent
        .put(`/api/variants/${variantId}/terrainRules/${terrainRuleId}`)
        .send(updatedTerrainRuleOptions)
        .expect(HttpStatus.FORBIDDEN);

      // Assert
    });

    it("if not found, returns Not Found", async () => {
      // Arrange
      const agent = await loginTestUser(app, creatorCredentials);

      // Act
      await agent
        .put(`/api/variants/${variantId}/terrainRules/999`)
        .send(updatedTerrainRuleOptions)
        .expect(HttpStatus.NOT_FOUND);

      // Assert
    });

    it("if validation errors, returns Unprocessable Entity", async () => {
      // Arrange
      const agent = await loginTestUser(app, creatorCredentials);

      // Act
      const response = await agent
        .put(`/api/variants/${variantId}/terrainRules/${terrainRuleId}`)
        .send({})
        .expect(HttpStatus.UNPROCESSABLE_ENTITY);

      // Assert
      expect(response.body).to.eql({
        terrainTypeId: "Terrain type is required",
        count: "Count is required",
        passableMovement: {
          for: "Passable movement for is required",
          pieceTypeIds: "Passable movement piece types are required",
        },
        passableRange: {
          for: "Passable range for is required",
          pieceTypeIds: "Passable range piece types are required",
        },
        slowsMovement: {
          for: "Slows movement for is required",
          pieceTypeIds: "Slows movement piece types are required",
        },
        stopsMovement: {
          for: "Stops movement for is required",
          pieceTypeIds: "Stops movement piece types are required",
        },
      });
    });

    it("on success, returns the updated object", async () => {
      // Arrange
      const agent = await loginTestUser(app, creatorCredentials);

      // Act
      const response = await agent
        .put(`/api/variants/${variantId}/terrainRules/${terrainRuleId}`)
        .send(updatedTerrainRuleOptions)
        .expect(HttpStatus.OK);

      // Assert
      expect(response.body).to.exist();
      const result: ITerrainRule = response.body;
      expect(result.passableRange.for).to.eql(PiecesEffectedType.NONE);
    });
  });
});
