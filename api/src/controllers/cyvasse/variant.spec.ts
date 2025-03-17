import {
  resetDatabaseBeforeEach,
  createTestUser,
  loginTestUser,
  IUserCredentials,
  createAndLoginTestUser,
  createTestVariant,
  createTestCredentials,
  createTestServer,
  ITestServer,
} from "../../../test/test_helper";
import supertest from "supertest";
import { IVariantOptions, BoardType } from "../../shared/dtos/cyvasse/variant";
import {
  PathType,
  CaptureType,
  PieceType,
  IPieceRuleOptions,
} from "../../shared/dtos/cyvasse/piece_rule";
import {
  IPreviewPieceRuleRequest,
  IPreviewPieceRuleResponse,
} from "../../shared/dtos/cyvasse/game";
import { StatusCodes } from "http-status-codes";

describe("CyvasseVariantRoutes", () => {
  resetDatabaseBeforeEach();
  let testServer: ITestServer;

  beforeAll(async () => {
    testServer = await createTestServer();
  });

  afterAll(async () => {
    await testServer.quit();
  });

  describe("get all variants (GET /api/cyvasse/variants)", () => {
    it("returns an empty list if there are no variants", async () => {
      // Arrange

      // Act
      const response = await supertest(testServer.app)
        .post("/api/cyvasse/variants/search")
        .send({ pagination: { pageIndex: 0, pageSize: 100 } })
        .expect(StatusCodes.OK);

      // Assert
      expect(response.body).toEqual({
        data: [],
        total: 0,
      });
    });
  });

  describe("create variant (POST /api/cyvasse/variants)", () => {
    const validRequest: IVariantOptions = {
      boardType: BoardType.HEXAGONAL,
      boardSize: 6,
      pieceRanks: false,
    };

    it("if not logged in, returns Unauthorized", async () => {
      // Arrange

      // Act
      await supertest(testServer.app)
        .post("/api/cyvasse/variants")
        .send(validRequest)
        .expect(StatusCodes.UNAUTHORIZED);

      // Assert
    });

    it("if validation errors, returns Unprocessable Entity", async () => {
      // Arrange
      const { agent } = await createAndLoginTestUser(testServer.app);

      // Act
      const response = await agent
        .post("/api/cyvasse/variants")
        .send({})
        .expect(StatusCodes.UNPROCESSABLE_ENTITY);

      // Assert
      expect(response.body).toEqual({
        boardType: "Board type must be hexagonal or square.",
      });
    });

    it("on success, returns created object", async () => {
      // Arrange
      const { agent } = await createAndLoginTestUser(testServer.app);

      // Act
      const response = await agent
        .post("/api/cyvasse/variants")
        .send(validRequest)
        .expect(StatusCodes.OK);

      // Assert
      expect(response.body).toBeDefined();
      expect(response.body.variantId).toBeDefined();
    });
  });

  describe("update variant (PUT /api/cyvasse/variants/<variant_id>)", () => {
    let creatorCredentials: IUserCredentials;
    let creatorId: number;
    let variantId: number;
    const updatedOptions: IVariantOptions = {
      boardType: BoardType.SQUARE,
      boardColumns: 4,
      boardRows: 4,
      pieceRanks: false,
    };

    beforeEach(async () => {
      creatorCredentials = createTestCredentials("test");
      creatorId = await createTestUser(creatorCredentials);
      variantId = await createTestVariant(creatorId);
    });

    it("if not logged in, returns Unauthorized", async () => {
      // Arrange

      // Act
      await supertest(testServer.app)
        .put(`/api/cyvasse/variants/${variantId}`)
        .send(updatedOptions)
        .expect(StatusCodes.UNAUTHORIZED);

      // Assert
    });

    it("if logged in as non-creator, returns Forbidden", async () => {
      // Arrange
      const { agent } = await createAndLoginTestUser(testServer.app, "user2");

      // Act
      await agent
        .put(`/api/cyvasse/variants/${variantId}`)
        .send(updatedOptions)
        .expect(StatusCodes.FORBIDDEN);

      // Assert
    });

    it("if invalid variant id, returns Not Found", async () => {
      // Arrange
      const agent = await loginTestUser(testServer.app, creatorCredentials);

      // Act
      await agent
        .put(`/api/cyvasse/variants/999`)
        .send(updatedOptions)
        .expect(StatusCodes.NOT_FOUND);

      // Assert
    });

    it("if validation errors, returns Unprocessable Entity", async () => {
      // Arrange
      const agent = await loginTestUser(testServer.app, creatorCredentials);

      // Act
      const response = await agent
        .put(`/api/cyvasse/variants/${variantId}`)
        .send({})
        .expect(StatusCodes.UNPROCESSABLE_ENTITY);

      // Assert
      expect(response.body).toEqual({
        boardType: "Board type must be hexagonal or square.",
      });
    });

    it("on success, returns created object", async () => {
      // Arrange
      const agent = await loginTestUser(testServer.app, creatorCredentials);

      // Act
      const response = await agent
        .put(`/api/cyvasse/variants/${variantId}`)
        .send(updatedOptions)
        .expect(StatusCodes.OK);

      // Assert
      expect(response.body).toBeDefined();
      expect(response.body.boardType).toEqual(BoardType.SQUARE);
    });
  });

  describe("preview piece rule (POST /api/cyvasse/variants/:variantId/preview/pieceRule)", () => {
    it("returns the coordinate map and valid plies", async () => {
      // Arrange
      const creatorCredentials = createTestCredentials("test");
      const creatorId = await createTestUser(creatorCredentials);
      const variantId = await createTestVariant(creatorId, {
        boardType: BoardType.HEXAGONAL,
        boardSize: 3,
      });
      const pieceRuleOptions: IPieceRuleOptions = {
        pieceTypeId: PieceType.CATAPULT,
        count: 1,
        movement: {
          type: PathType.ORTHOGONAL_LINE,
          minimum: 1,
          maximum: 1,
        },
        captureType: CaptureType.MOVEMENT,
      };
      const request: IPreviewPieceRuleRequest = {
        evaluationType: CaptureType.MOVEMENT,
        pieceRule: pieceRuleOptions,
      };

      // Act
      const response = await supertest(testServer.app)
        .post(`/api/cyvasse/variants/${variantId}/preview/pieceRule`)
        .send(request)
        .expect(StatusCodes.OK);

      // Assert
      expect(response.body).toBeDefined();
      const result: IPreviewPieceRuleResponse = response.body;
      expect(result.origin).toEqual({ x: 0, y: 0 });
      expect(result.validPlies.capturable).toEqual([]);
      expect(result.validPlies.free).toEqual([
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 },
        { x: 1, y: -1 },
        { x: -1, y: 1 },
      ]);
      expect(result.validPlies.reachable).toEqual([]);
    });
  });
});
