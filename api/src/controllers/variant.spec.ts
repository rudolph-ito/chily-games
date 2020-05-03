import { describe, it } from "mocha";
import { createExpressApp } from "./";
import { expect } from "chai";
import {
  resetDatabaseBeforeEach,
  loginAsTestUser
} from "../../test/test_helper";
import supertest from "supertest";
import { IVariantOptions, BOARD_TYPE } from "../shared/dtos/variant";

describe("VariantRoutes", () => {
  resetDatabaseBeforeEach();
  const app = createExpressApp({
    corsOrigins: [],
    sessionCookieSecure: false,
    sessionSecret: "test"
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
        total: 0
      });
    });
  });

  describe("create variant (POST /api/variants)", () => {
    const validRequest: IVariantOptions = {
      boardType: BOARD_TYPE.HEXAGONAL,
      boardSize: 6,
      pieceRanks: false
    };

    it("if not logged in, returns 401", async () => {
      // Arrange

      // Act
      await supertest(app)
        .post("/api/variants")
        .send(validRequest)
        .expect(401);

      // Assert
    });

    it("if validation errors, returns 424 with errors in body", async () => {
      // Arrange
      const { agent } = await loginAsTestUser(app);

      // Act
      const response = await agent
        .post("/api/variants")
        .send({})
        .expect(424);

      // Assert
      expect(response.body).to.eql({
        boardType: "Board type must be hexagonal or square."
      });
    });

    it("on success, returns created object", async () => {
      // Arrange
      const { agent } = await loginAsTestUser(app);

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
});
