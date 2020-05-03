import {
  IVariantOptions,
  IVariant,
  IVariantValidationErrors,
  ISearchVariantsRequest
} from "../shared/dtos/variant";
import { doesHaveValue } from "../shared/utilities/value_checker";
import {
  IVariantDataService,
  VariantDataService
} from "../database/services/variant_data_service";
import { validateVariantOptions } from "./validators/variant_validator";
import {
  IPaginatedResponse,
  ISearchValidationErrors
} from "../shared/dtos/search";

export interface ICreateVariantError {
  validationErrors?: IVariantValidationErrors;
}

export interface ICreateVariantResponse {
  error?: ICreateVariantError;
  variant?: IVariant;
}

export interface IDeleteVariantError {
  notFoundError?: string;
  authorizationError?: string;
}

export interface IDeleteVariantResponse {
  error?: IDeleteVariantError;
}

export interface IGetVariantError {
  notFoundError?: string;
}

export interface IGetVariantResponse {
  error?: IGetVariantError;
  variant?: IVariant;
}

export interface ISearchVariantsError {
  validationErrors?: ISearchValidationErrors;
}

export interface ISearchVariantsResponse {
  error?: ISearchVariantsError;
  paginatedVariants?: IPaginatedResponse<IVariant>;
}

export interface IUpdateVariantError {
  notFoundError?: string;
  authorizationError?: string;
  validationErrors?: IVariantValidationErrors;
}

export interface IUpdateVariantResponse {
  error?: IUpdateVariantError;
  variant?: IVariant;
}

export interface IVariantService {
  createVariant(
    userId: number,
    options: IVariantOptions
  ): Promise<ICreateVariantResponse>;
  getVariant(variantId: number): Promise<IGetVariantResponse>;
  deleteVariant(
    userId: number,
    variantId: number
  ): Promise<IDeleteVariantResponse>;
  searchVariants(
    request: ISearchVariantsRequest
  ): Promise<ISearchVariantsResponse>;
  updateVariant(
    userId: number,
    variantId: number,
    options: IVariantOptions
  ): Promise<IUpdateVariantResponse>;
}

export class VariantService implements IVariantService {
  constructor(
    private readonly dataService: IVariantDataService = new VariantDataService()
  ) {}

  private authorizationError(action: string): string {
    return `Only the creator can ${action} their variants`;
  }

  private notFoundError(variantId: number): string {
    return `Variant does not exist with id: ${variantId}`;
  }

  async createVariant(
    userId: number,
    options: IVariantOptions
  ): Promise<ICreateVariantResponse> {
    const validationErrors = validateVariantOptions(options);
    if (doesHaveValue(validationErrors)) {
      return { error: { validationErrors } };
    }
    const variant = await this.dataService.createVariant(options, userId);
    return { variant };
  }

  async searchVariants(
    request: ISearchVariantsRequest
  ): Promise<ISearchVariantsResponse> {
    // TODO validate request
    const paginatedVariants = await this.dataService.searchVariants(request);
    return { paginatedVariants };
  }

  async getVariant(variantId: number): Promise<IGetVariantResponse> {
    if (!(await this.dataService.hasVariant(variantId))) {
      return { error: { notFoundError: this.notFoundError(variantId) } };
    }
    const variant = await this.dataService.getVariant(variantId);
    return { variant };
  }

  async deleteVariant(
    userId: number,
    variantId: number
  ): Promise<IDeleteVariantResponse> {
    if (await this.dataService.hasVariant(variantId)) {
      return { error: { notFoundError: this.notFoundError(variantId) } };
    }
    const variant = await this.dataService.getVariant(variantId);
    if (userId !== variant.userId) {
      return {
        error: { authorizationError: this.authorizationError("delete") }
      };
    }
    await this.dataService.deleteVariant(variantId);
    return {};
  }

  async updateVariant(
    userId: number,
    variantId: number,
    options: IVariantOptions
  ): Promise<IUpdateVariantResponse> {
    if (!(await this.dataService.hasVariant(variantId))) {
      return { error: { notFoundError: this.notFoundError(variantId) } };
    }
    const variant = await this.dataService.getVariant(variantId);
    if (userId !== variant.userId) {
      return {
        error: { authorizationError: this.authorizationError("update") }
      };
    }
    const validationErrors = validateVariantOptions(options);
    if (doesHaveValue(validationErrors)) {
      return { error: { validationErrors } };
    }
    const updatedVariant = await this.dataService.updateVariant(
      variantId,
      options
    );
    return { variant: updatedVariant };
  }
}
