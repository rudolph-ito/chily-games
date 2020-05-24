import {
  IVariantDataService,
  VariantDataService,
} from "./data/variant_data_service";
import {
  IPieceRuleDataService,
  PieceRuleDataService,
} from "./data/piece_rule_data_service";
import { IPieceRuleOptions, IPieceRule } from "../shared/dtos/piece_rule";
import { validatePieceRuleOptions } from "./validators/piece_rule_validator";
import { doesHaveValue } from "../shared/utilities/value_checker";
import {
  ValidationError,
  throwVariantAuthorizationError,
  throwVariantNotFoundError,
  NotFoundError,
} from "./exceptions";

export interface IPieceRuleService {
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

export class PieceRuleService implements IPieceRuleService {
  constructor(
    private readonly pieceRuleDataService: IPieceRuleDataService = new PieceRuleDataService(),
    private readonly variantDataService: IVariantDataService = new VariantDataService()
  ) {}

  async createPieceRule(
    userId: number,
    variantId: number,
    options: IPieceRuleOptions
  ): Promise<IPieceRule> {
    const errors = validatePieceRuleOptions(options);
    if (doesHaveValue(errors)) {
      throw new ValidationError(errors);
    }
    if (!(await this.variantDataService.hasVariant(variantId))) {
      throwVariantNotFoundError(variantId);
    }
    const variant = await this.variantDataService.getVariant(variantId);
    if (userId !== variant.userId) {
      throwVariantAuthorizationError("create piece rules");
    }
    // validate piece type does not already exist
    return await this.pieceRuleDataService.createPieceRule(options, variantId);
  }

  async deletePieceRule(
    userId: number,
    variantId: number,
    pieceRuleId: number
  ): Promise<void> {
    if (
      !(await this.pieceRuleDataService.hasPieceRule(pieceRuleId, variantId))
    ) {
      this.throwPieceRuleNotFoundError(pieceRuleId, variantId);
    }
    const variant = await this.variantDataService.getVariant(variantId);
    if (userId !== variant.userId) {
      throwVariantAuthorizationError("delete piece rules");
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
    const errors = validatePieceRuleOptions(options);
    if (doesHaveValue(errors)) {
      throw new ValidationError(errors);
    }
    if (
      !(await this.pieceRuleDataService.hasPieceRule(pieceRuleId, variantId))
    ) {
      this.throwPieceRuleNotFoundError(pieceRuleId, variantId);
    }
    const variant = await this.variantDataService.getVariant(variantId);
    if (userId !== variant.userId) {
      throwVariantAuthorizationError("delete piece rules");
    }
    // validate new piece type does not already exist
    return await this.pieceRuleDataService.updatePieceRule(
      pieceRuleId,
      options
    );
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
