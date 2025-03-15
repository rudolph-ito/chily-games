import {
  ICyvasseVariantDataService,
  CyvasseVariantDataService,
} from "./data/cyvasse_variant_data_service";
import {
  ICyvasseTerrainRuleDataService,
  CyvasseTerrainRuleDataService,
} from "./data/cyvasse_terrain_rule_data_service";
import {
  ITerrainRuleOptions,
  ITerrainRule,
  TerrainType,
} from "../../shared/dtos/cyvasse/terrain_rule";
import { validateTerrainRuleOptions } from "./validators/cyvasse_terrain_rule_validator";
import {
  ValidationError,
  NotFoundError,
  variantAuthorizationError,
} from "../shared/exceptions";

export interface ICyvasseTerrainRuleService {
  createTerrainRule: (
    userId: number,
    variantId: number,
    options: ITerrainRuleOptions
  ) => Promise<ITerrainRule>;
  deleteTerrainRule: (
    userId: number,
    variantId: number,
    terrainRuleId: number
  ) => Promise<void>;
  getTerrainRule: (
    variantId: number,
    terrainRuleId: number
  ) => Promise<ITerrainRule>;
  getTerrainRules: (variantId: number) => Promise<ITerrainRule[]>;
  updateTerrainRule: (
    userId: number,
    variantId: number,
    terrainRuleId: number,
    options: ITerrainRuleOptions
  ) => Promise<ITerrainRule>;
}

export class CyvasseTerrainRuleService implements ICyvasseTerrainRuleService {
  constructor(
    private readonly terrainRuleDataService: ICyvasseTerrainRuleDataService = new CyvasseTerrainRuleDataService(),
    private readonly variantDataService: ICyvasseVariantDataService = new CyvasseVariantDataService()
  ) {}

  async createTerrainRule(
    userId: number,
    variantId: number,
    options: ITerrainRuleOptions
  ): Promise<ITerrainRule> {
    const variant = await this.variantDataService.getVariant(variantId);
    if (userId !== variant.userId) {
      throw variantAuthorizationError("create terrain rules");
    }
    const existingTerrainTypeMap = await this.getTerrainTypeMap(variantId);
    const errors = validateTerrainRuleOptions(options, existingTerrainTypeMap);
    if (errors != null) {
      throw new ValidationError(errors);
    }
    return await this.terrainRuleDataService.createTerrainRule(
      options,
      variantId
    );
  }

  async deleteTerrainRule(
    userId: number,
    variantId: number,
    terrainRuleId: number
  ): Promise<void> {
    await this.getTerrainRule(variantId, terrainRuleId);
    const variant = await this.variantDataService.getVariant(variantId);
    if (userId !== variant.userId) {
      throw variantAuthorizationError("delete terrain rules");
    }
    return await this.terrainRuleDataService.deleteTerrainRule(terrainRuleId);
  }

  async getTerrainRule(
    variantId: number,
    terrainRuleId: number
  ): Promise<ITerrainRule> {
    if (
      !(await this.terrainRuleDataService.hasTerrainRule(
        terrainRuleId,
        variantId
      ))
    ) {
      this.throwTerrainRuleNotFoundError(terrainRuleId, variantId);
    }
    return await this.terrainRuleDataService.getTerrainRule(terrainRuleId);
  }

  async getTerrainRules(variantId: number): Promise<ITerrainRule[]> {
    return await this.terrainRuleDataService.getTerrainRules(variantId);
  }

  async updateTerrainRule(
    userId: number,
    variantId: number,
    terrainRuleId: number,
    options: ITerrainRuleOptions
  ): Promise<ITerrainRule> {
    await this.getTerrainRule(variantId, terrainRuleId);
    const variant = await this.variantDataService.getVariant(variantId);
    if (userId !== variant.userId) {
      throw variantAuthorizationError("delete terrain rules");
    }
    const existingTerrainTypeMap = await this.getTerrainTypeMap(variantId);
    const errors = validateTerrainRuleOptions(
      options,
      existingTerrainTypeMap,
      terrainRuleId
    );
    if (errors != null) {
      throw new ValidationError(errors);
    }
    return await this.terrainRuleDataService.updateTerrainRule(
      terrainRuleId,
      options
    );
  }

  private async getTerrainTypeMap(
    variantId: number
  ): Promise<Map<TerrainType, number>> {
    const result = new Map<TerrainType, number>();
    const terrainRules =
      await this.terrainRuleDataService.getTerrainRules(variantId);
    terrainRules.forEach((pr) =>
      result.set(pr.terrainTypeId, pr.terrainRuleId)
    );
    return result;
  }

  private throwTerrainRuleNotFoundError(
    terrainRuleId: number,
    variantId: number
  ): void {
    throw new NotFoundError(
      `TerrainRule does not exist with id: ${terrainRuleId} and variant id: ${variantId}`
    );
  }
}
