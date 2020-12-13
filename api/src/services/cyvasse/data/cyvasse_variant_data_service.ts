import {
  ISearchVariantsRequest,
  IVariant,
  IVariantOptions,
} from "../../../shared/dtos/cyvasse/variant";
import { CyvasseVariant } from "../../../database/models";
import { IPaginatedResponse } from "../../../shared/dtos/search";
import { doesNotHaveValue } from "../../../shared/utilities/value_checker";
import { UserDataService } from "../../shared/data/user_data_service";
import { variantNotFoundError } from "../../shared/exceptions";

export interface ICyvasseVariantDataService {
  createVariant: (
    options: IVariantOptions,
    userId: number
  ) => Promise<IVariant>;
  deleteVariant: (variantId: number) => Promise<void>;
  getVariant: (variantId: number) => Promise<IVariant>;
  searchVariants: (
    request: ISearchVariantsRequest
  ) => Promise<IPaginatedResponse<IVariant>>;
  hasVariant: (variantId: number) => Promise<boolean>;
  updateVariant: (
    variantId: number,
    options: IVariantOptions
  ) => Promise<IVariant>;
}

export class CyvasseVariantDataService implements ICyvasseVariantDataService {
  constructor(
    private readonly userDataService: UserDataService = new UserDataService()
  ) {}

  async createVariant(
    options: IVariantOptions,
    userId: number
  ): Promise<IVariant> {
    const variant = CyvasseVariant.build({
      boardType: options.boardType,
      boardRows: options.boardRows,
      boardColumns: options.boardColumns,
      boardSize: options.boardSize,
      pieceRanks: options.pieceRanks,
      supportType: options.supportType,
      userId,
    });
    await variant.save();
    return variant.serialize();
  }

  async deleteVariant(variantId: number): Promise<void> {
    await CyvasseVariant.destroy({ where: { variantId } });
  }

  async searchVariants(
    request: ISearchVariantsRequest
  ): Promise<IPaginatedResponse<IVariant>> {
    if (doesNotHaveValue(request.pagination)) {
      request.pagination = { pageIndex: 0, pageSize: 100 };
    }
    const result = await CyvasseVariant.findAndCountAll({
      offset: request.pagination.pageIndex * request.pagination.pageSize,
      limit: request.pagination.pageSize,
    });
    return {
      data: result.rows,
      total: result.count,
    };
  }

  async getVariant(variantId: number): Promise<IVariant> {
    const variant = await CyvasseVariant.findByPk(variantId);
    if (variant == null) {
      throw variantNotFoundError(variantId);
    }
    return variant.serialize();
  }

  async hasVariant(variantId: number): Promise<boolean> {
    const count = await CyvasseVariant.count({ where: { variantId } });
    return count === 1;
  }

  async updateVariant(
    variantId: number,
    options: IVariantOptions
  ): Promise<IVariant> {
    const variant = await CyvasseVariant.findByPk(variantId);
    if (variant == null) {
      throw variantNotFoundError(variantId);
    }
    variant.boardType = options.boardType;
    variant.boardRows = options.boardRows ?? null;
    variant.boardColumns = options.boardColumns ?? null;
    variant.boardSize = options.boardSize ?? null;
    variant.pieceRanks = options.pieceRanks;
    variant.supportType = options.supportType ?? null;
    await variant.save();
    return variant.serialize();
  }
}
