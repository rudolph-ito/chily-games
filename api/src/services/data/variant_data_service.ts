import {
  ISearchVariantsRequest,
  IVariant,
  IVariantOptions,
} from "../../shared/dtos/variant";
import { CyvasseVariant } from "../../database/models";
import { IPaginatedResponse } from "../../shared/dtos/search";
import { doesNotHaveValue } from "../../shared/utilities/value_checker";
import { UserDataService } from "./user_data_service";

export interface IVariantDataService {
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

export class VariantDataService implements IVariantDataService {
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
    variant.boardType = options.boardType;
    variant.boardRows = options.boardRows;
    variant.boardColumns = options.boardColumns;
    variant.boardSize = options.boardSize;
    variant.pieceRanks = options.pieceRanks;
    variant.supportType = options.supportType;
    await variant.save();
    return variant.serialize();
  }
}
