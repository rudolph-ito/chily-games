import {
  IVariantOptions,
  IVariant,
  ISearchVariantsRequest,
} from "../shared/dtos/variant";
import { doesHaveValue } from "../shared/utilities/value_checker";
import {
  IVariantDataService,
  VariantDataService,
} from "./data/variant_data_service";
import { validateVariantOptions } from "./validators/variant_validator";
import { IPaginatedResponse } from "../shared/dtos/search";
import {
  throwVariantNotFoundError,
  throwVariantAuthorizationError,
  ValidationError,
} from "./exceptions";

export interface IVariantService {
  createVariant: (
    userId: number,
    options: IVariantOptions
  ) => Promise<IVariant>;
  getVariant: (variantId: number) => Promise<IVariant>;
  deleteVariant: (userId: number, variantId: number) => Promise<void>;
  searchVariants: (
    request: ISearchVariantsRequest
  ) => Promise<IPaginatedResponse<IVariant>>;
  updateVariant: (
    userId: number,
    variantId: number,
    options: IVariantOptions
  ) => Promise<IVariant>;
}

export class VariantService implements IVariantService {
  constructor(
    private readonly dataService: IVariantDataService = new VariantDataService()
  ) {}

  async createVariant(
    userId: number,
    options: IVariantOptions
  ): Promise<IVariant> {
    const validationErrors = validateVariantOptions(options);
    if (doesHaveValue(validationErrors)) {
      throw new ValidationError(validationErrors);
    }
    return await this.dataService.createVariant(options, userId);
  }

  async searchVariants(
    request: ISearchVariantsRequest
  ): Promise<IPaginatedResponse<IVariant>> {
    // TODO validate request
    return await this.dataService.searchVariants(request);
  }

  async getVariant(variantId: number): Promise<IVariant> {
    if (!(await this.dataService.hasVariant(variantId))) {
      throwVariantNotFoundError(variantId);
    }
    return await this.dataService.getVariant(variantId);
  }

  async deleteVariant(userId: number, variantId: number): Promise<void> {
    if (await this.dataService.hasVariant(variantId)) {
      throwVariantNotFoundError(variantId);
    }
    const variant = await this.dataService.getVariant(variantId);
    if (userId !== variant.userId) {
      throwVariantAuthorizationError("delete the variant");
    }
    await this.dataService.deleteVariant(variantId);
  }

  async updateVariant(
    userId: number,
    variantId: number,
    options: IVariantOptions
  ): Promise<IVariant> {
    if (!(await this.dataService.hasVariant(variantId))) {
      throwVariantNotFoundError(variantId);
    }
    const variant = await this.dataService.getVariant(variantId);
    if (userId !== variant.userId) {
      throwVariantAuthorizationError("update the variant");
    }
    const validationErrors = validateVariantOptions(options);
    if (doesHaveValue(validationErrors)) {
      throw new ValidationError(validationErrors);
    }
    return await this.dataService.updateVariant(variantId, options);
  }
}
