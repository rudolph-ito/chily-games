import { CyvassePieceRuleService } from "./cyvasse_piece_rule_service";

import {
  createTestVariant,
  createTestUser,
  createTestCredentials,
  resetDatabaseBeforeEach,
  createTestPieceRule,
} from "../../../test/test_helper";

import { ValidationError } from "../shared/exceptions";
import {
  PieceType,
  PathType,
  CaptureType,
} from "../../shared/dtos/cyvasse/piece_rule";

describe("CyvassePieceRuleService", () => {
  resetDatabaseBeforeEach();

  let service: CyvassePieceRuleService;
  beforeEach(() => {
    service = new CyvassePieceRuleService();
  });

  describe("createPieceRule", () => {
    it("does not allow user to create two piece rules with the same piece type", async () => {
      // Arrange
      const userCreds = createTestCredentials("test");
      const userId = await createTestUser(userCreds);
      const variantId = await createTestVariant(userId);

      // Act
      let error: any;
      try {
        await service.createPieceRule(userId, variantId, {
          pieceTypeId: PieceType.KING,
          count: 1,
          movement: {
            type: PathType.ORTHOGONAL_LINE,
            minimum: 1,
            maximum: null,
          },
          captureType: CaptureType.MOVEMENT,
        });
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.errors).toEqual({
        pieceTypeId: "A piece rule already exists for this piece type",
      });
    });
  });

  describe("deletePieceRule", () => {
    it("does not allow user to delete the king piece rule", async () => {
      // Arrange
      const userCreds = createTestCredentials("test");
      const userId = await createTestUser(userCreds);
      const variantId = await createTestVariant(userId);
      const kingPieceRuleId = (await service.getPieceRules(variantId))[0]
        .pieceRuleId;

      // Act
      let error: any;
      try {
        await service.deletePieceRule(userId, variantId, kingPieceRuleId);
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).errors).toEqual({
        general:
          "Cannot delete the king as every variant must have exactly one.",
      });
    });
  });

  describe("updatePieceRule", () => {
    it("does not allow user to update the king piece rule's piece type id", async () => {
      // Arrange
      const userCreds = createTestCredentials("test");
      const userId = await createTestUser(userCreds);
      const variantId = await createTestVariant(userId);
      const kingPieceRuleId = (await service.getPieceRules(variantId))[0]
        .pieceRuleId;

      // Act
      let error: any;
      try {
        await service.updatePieceRule(userId, variantId, kingPieceRuleId, {
          pieceTypeId: PieceType.CATAPULT,
          count: 1,
          movement: {
            type: PathType.ORTHOGONAL_LINE,
            minimum: 1,
            maximum: null,
          },
          captureType: CaptureType.MOVEMENT,
        });
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.errors).toEqual({
        pieceTypeId:
          "Piece type is locked to 'King'. Every variant must have exactly one king.",
      });
    });

    it("does not allow user to update the king piece rule's count", async () => {
      // Arrange
      const userCreds = createTestCredentials("test");
      const userId = await createTestUser(userCreds);
      const variantId = await createTestVariant(userId);
      const kingPieceRuleId = (await service.getPieceRules(variantId))[0]
        .pieceRuleId;

      // Act
      let error: any;
      try {
        await service.updatePieceRule(userId, variantId, kingPieceRuleId, {
          pieceTypeId: PieceType.KING,
          count: 2,
          movement: {
            type: PathType.ORTHOGONAL_LINE,
            minimum: 1,
            maximum: null,
          },
          captureType: CaptureType.MOVEMENT,
        });
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).errors).toEqual({
        count:
          "Count is locked to 1. Every variant must have exactly one king.",
      });
    });

    it("does not allow user to update a piece rule's piece type to a duplicate", async () => {
      // Arrange
      const userCreds = createTestCredentials("test");
      const userId = await createTestUser(userCreds);
      const variantId = await createTestVariant(userId);
      const pieceRuleId = await createTestPieceRule(
        PieceType.CROSSBOW,
        variantId
      );

      // Act
      let error: any;
      try {
        await service.updatePieceRule(userId, variantId, pieceRuleId, {
          pieceTypeId: PieceType.KING,
          count: 2,
          movement: {
            type: PathType.ORTHOGONAL_LINE,
            minimum: 1,
            maximum: null,
          },
          captureType: CaptureType.MOVEMENT,
        });
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.errors).toEqual({
        pieceTypeId: "A piece rule already exists for this piece type",
      });
    });
  });
});
