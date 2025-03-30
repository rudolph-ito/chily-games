import {
  resetDatabaseBeforeEach,
  createTestUser,
  loginTestUser,
  IUserCredentials,
  createAndLoginTestUser,
  createTestVariant,
  createTestCredentials,
  createTestTerrainRule,
  createTestServer,
  ITestServer,
} from "../../../test/test_helper";
import supertest from "supertest";
import {
  ITerrainRuleOptions,
  TerrainType,
  ITerrainRule,
  PiecesEffectedType,
} from "../../shared/dtos/cyvasse/terrain_rule";
import { CyvasseTerrainRuleDataService } from "../../services/cyvasse/data/cyvasse_terrain_rule_data_service";
import { StatusCodes } from "http-status-codes";

describe("CyvasseTerrainRuleRoutes", () => {
  resetDatabaseBeforeEach();
  let testServer: ITestServer;
  let creatorCredentials: IUserCredentials;
  let creatorId: number;
  let variantId: number;

  beforeAll(async () => {
    testServer = await createTestServer();
  });

  afterAll(async () => {
    await testServer.quit();
  });

  beforeEach(async () => {
    creatorCredentials = createTestCredentials("test");
    creatorId = await createTestUser(creatorCredentials);
    variantId = await createTestVariant(creatorId);
  });

  describe("create terrain rule (POST /api/cyvasse/variants/:variantId/terrainRules)", () => {
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
      await supertest(testServer.app)
        .post(`/api/cyvasse/variants/${variantId}/terrainRules`)
        .send(terrainRuleOptions)
        .expect(StatusCodes.UNAUTHORIZED);

      // Assert
    });

    it("if logged in as non-creator, returns Forbidden", async () => {
      // Arrange
      const { agent } = await createAndLoginTestUser(testServer.app, "user2");

      // Act
      await agent
        .post(`/api/cyvasse/variants/${variantId}/terrainRules`)
        .send(terrainRuleOptions)
        .expect(StatusCodes.FORBIDDEN);

      // Assert
    });

    it("if validation errors, returns Unprocessable Entity", async () => {
      // Arrange
      const agent = await loginTestUser(testServer.app, creatorCredentials);

      // Act
      const response = await agent
        .post(`/api/cyvasse/variants/${variantId}/terrainRules`)
        .send({})
        .expect(StatusCodes.UNPROCESSABLE_ENTITY);

      // Assert
      expect(response.body).toEqual({
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
      const agent = await loginTestUser(testServer.app, creatorCredentials);

      // Act
      const response = await agent
        .post(`/api/cyvasse/variants/${variantId}/terrainRules`)
        .send(terrainRuleOptions)
        .expect(StatusCodes.OK);

      // Assert
      expect(response.body).toBeDefined();
      expect(response.body.terrainRuleId).toBeDefined();
    });
  });

  describe("delete terrain rule (DETELE /api/cyvasse/variants/:variantId/terrainRules/:terrainRuleId)", () => {
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
      await supertest(testServer.app)
        .delete(
          `/api/cyvasse/variants/${variantId}/terrainRules/${terrainRuleId}`
        )
        .expect(StatusCodes.UNAUTHORIZED);

      // Assert
    });

    it("if logged in as non-creator, returns Forbidden", async () => {
      // Arrange
      const { agent } = await createAndLoginTestUser(testServer.app, "user2");

      // Act
      await agent
        .delete(
          `/api/cyvasse/variants/${variantId}/terrainRules/${terrainRuleId}`
        )
        .expect(StatusCodes.FORBIDDEN);

      // Assert
    });

    it("if not found, returns Not Found", async () => {
      // Arrange
      const agent = await loginTestUser(testServer.app, creatorCredentials);

      // Act
      await agent
        .delete(`/api/cyvasse/variants/${variantId}/terrainRules/999`)
        .expect(StatusCodes.NOT_FOUND);

      // Assert
    });

    it("on success, deletes the object", async () => {
      // Arrange
      const agent = await loginTestUser(testServer.app, creatorCredentials);

      // Act
      await agent
        .delete(
          `/api/cyvasse/variants/${variantId}/terrainRules/${terrainRuleId}`
        )
        .expect(StatusCodes.OK);

      // Assert
      const terrainRules =
        await new CyvasseTerrainRuleDataService().getTerrainRules(variantId);
      expect(terrainRules).toEqual([]);
    });
  });

  describe("get terrain rules (GET /api/cyvasse/variants/:variantId/terrainRules)", () => {
    it("with default terrain rules, returns the king terrain rule", async () => {
      // Arrange
      const agent = await loginTestUser(testServer.app, creatorCredentials);

      // Act
      const response = await agent
        .get(`/api/cyvasse/variants/${variantId}/terrainRules`)
        .expect(StatusCodes.OK);

      // Assert
      expect(response.body).toBeDefined();
      const terrainRules: ITerrainRule[] = response.body;
      expect(terrainRules.map((pr) => pr.terrainTypeId)).toEqual([]);
    });

    it("with terrain rules, returns the list", async () => {
      // Arrange
      await createTestTerrainRule(TerrainType.FOREST, variantId);
      await createTestTerrainRule(TerrainType.MOUNTAIN, variantId);
      const agent = await loginTestUser(testServer.app, creatorCredentials);

      // Act
      const response = await agent
        .get(`/api/cyvasse/variants/${variantId}/terrainRules`)
        .expect(StatusCodes.OK);

      // Assert
      expect(response.body).toBeDefined();
      const terrainRules: ITerrainRule[] = response.body;
      expect(terrainRules.length).toEqual(2);
      expect(terrainRules.map((x) => x.terrainTypeId)).toEqual([
        TerrainType.FOREST,
        TerrainType.MOUNTAIN,
      ]);
    });
  });

  describe("update terrain rule (UPDATE /api/cyvasse/variants/:variantId/terrainRules/:terrainRuleId)", () => {
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
      await supertest(testServer.app)
        .put(`/api/cyvasse/variants/${variantId}/terrainRules/${terrainRuleId}`)
        .send(updatedTerrainRuleOptions)
        .expect(StatusCodes.UNAUTHORIZED);

      // Assert
    });

    it("if logged in as non-creator, returns Forbidden", async () => {
      // Arrange
      const { agent } = await createAndLoginTestUser(testServer.app, "user2");

      // Act
      await agent
        .put(`/api/cyvasse/variants/${variantId}/terrainRules/${terrainRuleId}`)
        .send(updatedTerrainRuleOptions)
        .expect(StatusCodes.FORBIDDEN);

      // Assert
    });

    it("if not found, returns Not Found", async () => {
      // Arrange
      const agent = await loginTestUser(testServer.app, creatorCredentials);

      // Act
      await agent
        .put(`/api/cyvasse/variants/${variantId}/terrainRules/999`)
        .send(updatedTerrainRuleOptions)
        .expect(StatusCodes.NOT_FOUND);

      // Assert
    });

    it("if validation errors, returns Unprocessable Entity", async () => {
      // Arrange
      const agent = await loginTestUser(testServer.app, creatorCredentials);

      // Act
      const response = await agent
        .put(`/api/cyvasse/variants/${variantId}/terrainRules/${terrainRuleId}`)
        .send({})
        .expect(StatusCodes.UNPROCESSABLE_ENTITY);

      // Assert
      expect(response.body).toEqual({
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
      const agent = await loginTestUser(testServer.app, creatorCredentials);

      // Act
      const response = await agent
        .put(`/api/cyvasse/variants/${variantId}/terrainRules/${terrainRuleId}`)
        .send(updatedTerrainRuleOptions)
        .expect(StatusCodes.OK);

      // Assert
      expect(response.body).toBeDefined();
      const result: ITerrainRule = response.body;
      expect(result.passableRange.for).toEqual(PiecesEffectedType.NONE);
    });
  });
});
