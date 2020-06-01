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
} from "../../test/test_helper";
import supertest from "supertest";
import { IVariantOptions, BoardType } from "../shared/dtos/variant";
import {
  PathType,
  CaptureType,
  PieceType,
  IPieceRuleOptions,
} from "../shared/dtos/piece_rule";
import {
  IPreviewBoardRequest,
  IPreviewPieceRuleRequest,
  IPreviewBoardResponse,
  IPreviewPieceRuleResponse,
} from "../shared/dtos/game";

describe("VariantRoutes", () => {
  resetDatabaseBeforeEach();
  const app = createExpressApp({
    corsOrigins: [],
    sessionCookieSecure: false,
    sessionSecret: "test",
  });

  describe("get all variants (GET /api/variants)", () => {
    it("returns an empty list if there are no variants", async () => {
      // Arrange

      // Act
      const response = await supertest(app)
        .post("/api/variants/search")
        .send({ pagination: { pageIndex: 0, pageSize: 100 } })
        .expect(200);

      // Assert
      expect(response.body).to.eql({
        data: [],
        total: 0,
      });
    });
  });

  describe("create variant (POST /api/variants)", () => {
    const validRequest: IVariantOptions = {
      boardType: BoardType.HEXAGONAL,
      boardSize: 6,
      pieceRanks: false,
    };

    it("if not logged in, returns 401", async () => {
      // Arrange

      // Act
      await supertest(app).post("/api/variants").send(validRequest).expect(401);

      // Assert
    });

    it("if validation errors, returns 422 with errors in body", async () => {
      // Arrange
      const { agent } = await createAndLoginTestUser(app);

      // Act
      const response = await agent.post("/api/variants").send({}).expect(422);

      // Assert
      expect(response.body).to.eql({
        boardType: "Board type must be hexagonal or square.",
      });
    });

    it("on success, returns created object", async () => {
      // Arrange
      const { agent } = await createAndLoginTestUser(app);

      // Act
      const response = await agent
        .post("/api/variants")
        .send(validRequest)
        .expect(200);

      // Assert
      expect(response.body).to.exist();
      expect(response.body.variantId).to.exist();
    });
  });

  describe("update variant (PUT /api/variants/<variant_id>)", () => {
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

    it("if not logged in, returns 401", async () => {
      // Arrange

      // Act
      await supertest(app)
        .put(`/api/variants/${variantId}`)
        .send(updatedOptions)
        .expect(401);

      // Assert
    });

    it("if logged in as non-creator, returns 401", async () => {
      // Arrange
      const { agent } = await createAndLoginTestUser(app, "user2");

      // Act
      await agent
        .put(`/api/variants/${variantId}`)
        .send(updatedOptions)
        .expect(401);

      // Assert
    });

    it("if invalid variant id, returns 404", async () => {
      // Arrange
      const agent = await loginTestUser(app, creatorCredentials);

      // Act
      await agent.put(`/api/variants/999`).send(updatedOptions).expect(404);

      // Assert
    });

    it("if validation errors, returns 422 with errors in body", async () => {
      // Arrange
      const agent = await loginTestUser(app, creatorCredentials);

      // Act
      const response = await agent
        .put(`/api/variants/${variantId}`)
        .send({})
        .expect(422);

      // Assert
      expect(response.body).to.eql({
        boardType: "Board type must be hexagonal or square.",
      });
    });

    it("on success, returns created object", async () => {
      // Arrange
      const agent = await loginTestUser(app, creatorCredentials);

      // Act
      const response = await agent
        .put(`/api/variants/${variantId}`)
        .send(updatedOptions)
        .expect(200);

      // Assert
      expect(response.body).to.exist();
      expect(response.body.boardType).to.eql(BoardType.SQUARE);
    });
  });

  describe("preview piece rule (POST /api/variants/:variantId/preview/pieceRule)", () => {
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
      const response = await supertest(app)
        .post(`/api/variants/${variantId}/preview/pieceRule`)
        .send(request)
        .expect(200);

      // Assert
      expect(response.body).to.exist();
      const result: IPreviewPieceRuleResponse = response.body;
      expect(result.serializedCoordinateMap).to.have.lengthOf(49);
      expect(result.serializedCoordinateMap).to.deep.contain({
        key: { x: 0, y: 0 },
        value: {
          piece: {
            pieceTypeId: "catapult",
            playerColor: "alabaster",
          },
        },
      });
      expect(result.validPlies.capturable).to.eql([]);
      expect(result.validPlies.free).to.have.deep.members([
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 },
        { x: 1, y: -1 },
        { x: -1, y: 1 },
      ]);
      expect(result.validPlies.reachable).to.eql([]);
    });
  });

  describe("preview board (POST /api/variants/preview/board)", () => {
    it("returns the coordinate map", async () => {
      // Arrange
      const variantOptions: IVariantOptions = {
        boardType: BoardType.HEXAGONAL,
        boardSize: 3,
        pieceRanks: false,
      };
      const request: IPreviewBoardRequest = { variant: variantOptions };

      // Act
      const response = await supertest(app)
        .post(`/api/variants/preview/board`)
        .send(request)
        .expect(200);

      // Assert
      expect(response.body).to.exist();
      const result: IPreviewBoardResponse = response.body;
      expect(result.serializedCoordinateMap).to.have.lengthOf(49);
      expect(result.serializedCoordinateMap).to.deep.contain({
        key: { x: 0, y: 0 },
        value: {},
      });
    });
  });
});
