import {
  IPieceRuleOptions,
  IPieceRule,
} from "../../../shared/dtos/cyvasse/piece_rule";
import { CyvassePieceRule } from "../../../database/models";
import { valueOrDefault } from "../../../shared/utilities/value_checker";
import { NotFoundError } from "../../shared/exceptions";

export interface ICyvassePieceRuleDataService {
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

export class CyvassePieceRuleDataService
  implements ICyvassePieceRuleDataService
{
  async createPieceRule(
    options: IPieceRuleOptions,
    variantId: number
  ): Promise<IPieceRule> {
    const pieceRule = CyvassePieceRule.build({
      variantId,
    });
    this.assignPieceRule(pieceRule, options);
    await pieceRule.save();
    return pieceRule.serialize();
  }

  async deletePieceRule(pieceRuleId: number): Promise<void> {
    await CyvassePieceRule.destroy({ where: { pieceRuleId } });
  }

  async getPieceRule(pieceRuleId: number): Promise<IPieceRule> {
    const pieceRule = await CyvassePieceRule.findByPk(pieceRuleId);
    if (pieceRule == null) {
      throw new NotFoundError("Piece rule not found");
    } else {
      return pieceRule.serialize();
    }
  }

  async getPieceRules(variantId: number): Promise<IPieceRule[]> {
    const pieceRules: CyvassePieceRule[] = await CyvassePieceRule.findAll({
      where: { variantId },
    });
    return pieceRules.map((pieceRule) => pieceRule.serialize());
  }

  async hasPieceRule(pieceRuleId: number, variantId: number): Promise<boolean> {
    const count = await CyvassePieceRule.count({
      where: { pieceRuleId, variantId },
    });
    return count === 1;
  }

  async updatePieceRule(
    pieceRuleId: number,
    options: IPieceRuleOptions
  ): Promise<IPieceRule> {
    const pieceRule = await CyvassePieceRule.findByPk(pieceRuleId);
    if (pieceRule == null) {
      throw new NotFoundError("Piece rule not found");
    }
    this.assignPieceRule(pieceRule, options);
    await pieceRule.save();
    return pieceRule.serialize();
  }

  private assignPieceRule(
    obj: CyvassePieceRule,
    options: IPieceRuleOptions
  ): void {
    obj.pieceTypeId = options.pieceTypeId;
    obj.count = options.count;
    obj.movementType = options.movement.type;
    obj.movementMinimum = options.movement.minimum;
    obj.movementMaximum = options.movement.maximum ?? null;
    obj.captureType = options.captureType;
    obj.moveAndRangeCapture = valueOrDefault(
      options.moveAndRangeCapture,
      false
    );
    if (options.range != null) {
      obj.rangeType = options.range.type;
      obj.rangeMinimum = options.range.minimum;
      obj.rangeMaximum = options.range.maximum ?? null;
    }
    if (options.ranks != null) {
      obj.attackRank = options.ranks.attack;
      obj.defenseRank = options.ranks.defense;
    }
  }
}
