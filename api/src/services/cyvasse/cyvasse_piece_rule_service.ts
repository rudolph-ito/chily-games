import {
  ICyvasseVariantDataService,
  CyvasseVariantDataService,
} from "./data/cyvasse_variant_data_service";
import {
  ICyvassePieceRuleDataService,
  CyvassePieceRuleDataService,
} from "./data/cyvasse_piece_rule_data_service";
import {
  IPieceRuleOptions,
  IPieceRule,
  PieceType,
} from "../../shared/dtos/cyvasse/piece_rule";
import { validatePieceRuleOptions } from "./validators/cyvasse_piece_rule_validator";
import {
  ValidationError,
  NotFoundError,
  variantAuthorizationError,
} from "../shared/exceptions";

export interface ICyvassePieceRuleService {
  createPieceRule: (
    userId: number,
    variantId: number,
    options: IPieceRuleOptions
  ) => Promise<IPieceRule>;
  deletePieceRule: (
    userId: number,
    variantId: number,
    pieceRuleId: number
  ) => Promise<void>;
  getPieceRule: (variantId: number, pieceRuleId: number) => Promise<IPieceRule>;
  getPieceRules: (variantId: number) => Promise<IPieceRule[]>;
  updatePieceRule: (
    userId: number,
    variantId: number,
    pieceRuleId: number,
    options: IPieceRuleOptions
  ) => Promise<IPieceRule>;
}

export class CyvassePieceRuleService implements ICyvassePieceRuleService {
  constructor(
    private readonly pieceRuleDataService: ICyvassePieceRuleDataService = new CyvassePieceRuleDataService(),
    private readonly variantDataService: ICyvasseVariantDataService = new CyvasseVariantDataService()
  ) {}

  async createPieceRule(
    userId: number,
    variantId: number,
    options: IPieceRuleOptions
  ): Promise<IPieceRule> {
    const variant = await this.variantDataService.getVariant(variantId);
    if (userId !== variant.userId) {
      throw variantAuthorizationError("create piece rules");
    }
    const existingPieceTypeMap = await this.getPieceTypeMap(variantId);
    const errors = validatePieceRuleOptions(options, existingPieceTypeMap);
    if (errors != null) {
      throw new ValidationError(errors);
    }
    return await this.pieceRuleDataService.createPieceRule(options, variantId);
  }

  async deletePieceRule(
    userId: number,
    variantId: number,
    pieceRuleId: number
  ): Promise<void> {
    const pieceRule = await this.getPieceRule(variantId, pieceRuleId);
    const variant = await this.variantDataService.getVariant(variantId);
    if (userId !== variant.userId) {
      throw variantAuthorizationError("delete piece rules");
    } else if (pieceRule.pieceTypeId === PieceType.KING) {
      throw new ValidationError({
        general:
          "Cannot delete the king as every variant must have exactly one.",
      });
    }
    return await this.pieceRuleDataService.deletePieceRule(pieceRuleId);
  }

  async getPieceRule(
    variantId: number,
    pieceRuleId: number
  ): Promise<IPieceRule> {
    if (
      !(await this.pieceRuleDataService.hasPieceRule(pieceRuleId, variantId))
    ) {
      this.throwPieceRuleNotFoundError(pieceRuleId, variantId);
    }
    return await this.pieceRuleDataService.getPieceRule(pieceRuleId);
  }

  async getPieceRules(variantId: number): Promise<IPieceRule[]> {
    return await this.pieceRuleDataService.getPieceRules(variantId);
  }

  async updatePieceRule(
    userId: number,
    variantId: number,
    pieceRuleId: number,
    options: IPieceRuleOptions
  ): Promise<IPieceRule> {
    await this.getPieceRule(variantId, pieceRuleId);
    const variant = await this.variantDataService.getVariant(variantId);
    if (userId !== variant.userId) {
      throw variantAuthorizationError("delete piece rules");
    }
    const existingPieceTypeMap = await this.getPieceTypeMap(variantId);
    const errors = validatePieceRuleOptions(
      options,
      existingPieceTypeMap,
      pieceRuleId
    );
    if (errors != null) {
      throw new ValidationError(errors);
    }
    return await this.pieceRuleDataService.updatePieceRule(
      pieceRuleId,
      options
    );
  }

  private async getPieceTypeMap(
    variantId: number
  ): Promise<Map<PieceType, number>> {
    const result = new Map<PieceType, number>();
    const pieceRules = await this.pieceRuleDataService.getPieceRules(variantId);
    pieceRules.forEach((pr) => result.set(pr.pieceTypeId, pr.pieceRuleId));
    return result;
  }

  private throwPieceRuleNotFoundError(
    pieceRuleId: number,
    variantId: number
  ): void {
    throw new NotFoundError(
      `PieceRule does not exist with id: ${pieceRuleId} and variant id: ${variantId}`
    );
  }
}
