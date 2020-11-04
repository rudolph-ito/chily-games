import {
  ITerrainRuleOptions,
  ITerrainRule,
} from "../../shared/dtos/terrain_rule";
import { CyvasseTerrainRule } from "../../database/models";

export interface ITerrainRuleDataService {
  createTerrainRule: (
    options: ITerrainRuleOptions,
    variantId: number
  ) => Promise<ITerrainRule>;
  deleteTerrainRule: (terrainRuleId: number) => Promise<void>;
  getTerrainRule: (terrainRuleId: number) => Promise<ITerrainRule>;
  getTerrainRules: (variantId: number) => Promise<ITerrainRule[]>;
  hasTerrainRule: (
    variantId: number,
    terrainRuleId: number
  ) => Promise<boolean>;
  updateTerrainRule: (
    terrainRuleId: number,
    options: ITerrainRuleOptions
  ) => Promise<ITerrainRule>;
}

export class TerrainRuleDataService implements ITerrainRuleDataService {
  async createTerrainRule(
    options: ITerrainRuleOptions,
    variantId: number
  ): Promise<ITerrainRule> {
    const terrainRule = CyvasseTerrainRule.build({
      variantId,
    });
    this.assignTerrainRule(terrainRule, options);
    await terrainRule.save();
    return terrainRule.serialize();
  }

  async deleteTerrainRule(terrainRuleId: number): Promise<void> {
    await CyvasseTerrainRule.destroy({ where: { terrainRuleId } });
  }

  async getTerrainRule(terrainRuleId: number): Promise<ITerrainRule> {
    const terrainRule = await CyvasseTerrainRule.findByPk(terrainRuleId);
    return terrainRule.serialize();
  }

  async getTerrainRules(variantId: number): Promise<ITerrainRule[]> {
    const terrainRules: CyvasseTerrainRule[] = await CyvasseTerrainRule.findAll({
      where: { variantId },
    });
    return terrainRules.map((terrainRule) => terrainRule.serialize());
  }

  async hasTerrainRule(
    terrainRuleId: number,
    variantId: number
  ): Promise<boolean> {
    const count = await CyvasseTerrainRule.count({
      where: { terrainRuleId, variantId },
    });
    return count === 1;
  }

  async updateTerrainRule(
    terrainRuleId: number,
    options: ITerrainRuleOptions
  ): Promise<ITerrainRule> {
    const terrainRule = await CyvasseTerrainRule.findByPk(terrainRuleId);
    this.assignTerrainRule(terrainRule, options);
    await terrainRule.save();
    return terrainRule.serialize();
  }

  private assignTerrainRule(
    obj: CyvasseTerrainRule,
    options: ITerrainRuleOptions
  ): void {
    obj.terrainTypeId = options.terrainTypeId;
    obj.count = options.count;
    obj.passableMovementFor = options.passableMovement.for;
    obj.passableMovementPieceTypeIds = options.passableMovement.pieceTypeIds;
    obj.passableRangeFor = options.passableRange.for;
    obj.passableRangePieceTypeIds = options.passableRange.pieceTypeIds;
    obj.slowsMovementBy = options.slowsMovement.by;
    obj.slowsMovementFor = options.slowsMovement.for;
    obj.slowsMovementPieceTypeIds = options.slowsMovement.pieceTypeIds;
    obj.stopsMovementFor = options.stopsMovement.for;
    obj.stopsMovementPieceTypeIds = options.stopsMovement.pieceTypeIds;
  }
}
