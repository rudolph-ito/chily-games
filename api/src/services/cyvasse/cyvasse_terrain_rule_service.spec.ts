import { CyvasseTerrainRuleService } from "./cyvasse_terrain_rule_service";
import { describe, it } from "mocha";
import {
  createTestVariant,
  createTestUser,
  createTestCredentials,
  resetDatabaseBeforeEach,
  createTestTerrainRule,
} from "../../../test/test_helper";
import { expect } from "chai";
import { ValidationError } from "../shared/exceptions";
import {
  TerrainType,
  PiecesEffectedType,
} from "../../shared/dtos/cyvasse/terrain_rule";

describe("CyvasseTerrainRuleService", () => {
  resetDatabaseBeforeEach();

  let service: CyvasseTerrainRuleService;
  beforeEach(() => {
    service = new CyvasseTerrainRuleService();
  });

  describe("createTerrainRule", () => {
    it("does not allow user to create two terrain rules with the same terrain type", async () => {
      // Arrange
      const userCreds = createTestCredentials("test");
      const userId = await createTestUser(userCreds);
      const variantId = await createTestVariant(userId);
      await createTestTerrainRule(TerrainType.FOREST, variantId);

      // Act
      let error: any;
      try {
        await service.createTerrainRule(userId, variantId, {
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
            by: null,
          },
          stopsMovement: {
            for: PiecesEffectedType.NONE,
            pieceTypeIds: [],
          },
        });
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).to.be.instanceOf(ValidationError);
      expect((error as ValidationError).errors).to.eql({
        terrainTypeId: "A terrain rule already exists for this terrain type",
      });
    });
  });

  describe("updateTerrainRule", () => {
    it("does not allow user to update a terrain rule's terrain type to a duplicate", async () => {
      // Arrange
      const userCreds = createTestCredentials("test");
      const userId = await createTestUser(userCreds);
      const variantId = await createTestVariant(userId);
      await createTestTerrainRule(TerrainType.FOREST, variantId);
      const terrainRuleId = await createTestTerrainRule(
        TerrainType.MOUNTAIN,
        variantId
      );

      // Act
      let error: any;
      try {
        await service.updateTerrainRule(userId, variantId, terrainRuleId, {
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
            by: null
          },
          stopsMovement: {
            for: PiecesEffectedType.NONE,
            pieceTypeIds: [],
          },
        });
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).to.be.instanceOf(ValidationError);
      expect((error as ValidationError).errors).to.eql({
        terrainTypeId: "A terrain rule already exists for this terrain type",
      });
    });
  });
});
