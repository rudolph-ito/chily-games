import { IPieceRuleOptions, IPieceRule } from "../../shared/dtos/piece_rule";
import { PieceRule } from "../../database/models";
import {
  doesHaveValue,
  valueOrDefault,
} from "../../shared/utilities/value_checker";

export interface IPieceRuleDataService {
  createPieceRule: (
    options: IPieceRuleOptions,
    variantId: number
  ) => Promise<IPieceRule>;
  deletePieceRule: (pieceRuleId: number) => Promise<void>;
  getPieceRule: (pieceRuleId: number) => Promise<IPieceRule>;
  getPieceRules: (variantId: number) => Promise<IPieceRule[]>;
  hasPieceRule: (variantId: number, pieceRuleId: number) => Promise<boolean>;
  updatePieceRule: (
    pieceRuleId: number,
    options: IPieceRuleOptions
  ) => Promise<IPieceRule>;
}

export class PieceRuleDataService implements IPieceRuleDataService {
  async createPieceRule(
    options: IPieceRuleOptions,
    variantId: number
  ): Promise<IPieceRule> {
    const pieceRule = PieceRule.build({
      variantId,
    });
    this.assignPieceRule(pieceRule, options);
    await pieceRule.save();
    return pieceRule.serialize();
  }

  async deletePieceRule(pieceRuleId: number): Promise<void> {
    await PieceRule.destroy({ where: { pieceRuleId } });
  }

  async getPieceRule(pieceRuleId: number): Promise<IPieceRule> {
    const pieceRule = await PieceRule.findByPk(pieceRuleId);
    return pieceRule.serialize();
  }

  async getPieceRules(variantId: number): Promise<IPieceRule[]> {
    const pieceRules: PieceRule[] = PieceRule.findAll({ where: { variantId } });
    return pieceRules.map((pieceRule) => pieceRule.serialize());
  }

  async hasPieceRule(pieceRuleId: number, variantId: number): Promise<boolean> {
    const count = await PieceRule.count({ where: { pieceRuleId, variantId } });
    return count === 1;
  }

  async updatePieceRule(
    pieceRuleId: number,
    options: IPieceRuleOptions
  ): Promise<IPieceRule> {
    const pieceRule = await PieceRule.findByPk(pieceRuleId);
    this.assignPieceRule(pieceRule, options);
    await pieceRule.save();
    return pieceRule.serialize();
  }

  private assignPieceRule(obj: PieceRule, options: IPieceRuleOptions): void {
    obj.pieceTypeId = options.pieceTypeId;
    obj.count = options.count;
    obj.movementType = options.movement.type;
    obj.movementMinimum = options.movement.minimum;
    obj.movementMaximum = options.movement.maximum;
    obj.captureType = options.captureType;
    obj.moveAndRangeCapture = valueOrDefault(
      options.moveAndRangeCapture,
      false
    );
    if (doesHaveValue(options.range)) {
      obj.rangeType = options.range.type;
      obj.rangeMinimum = options.range.minimum;
      obj.rangeMaximum = options.range.maximum;
    }
    if (doesHaveValue(options.ranks)) {
      obj.attackRank = options.ranks.attack;
      obj.defenseRank = options.ranks.defense;
    }
  }
}
