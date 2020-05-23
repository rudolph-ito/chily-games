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
});
