import { IPaginationRequest } from "./search";

export enum BOARD_TYPE {
  SQUARE = "square",
  HEXAGONAL = "hexagonal"
}

export enum SUPPORT_TYPE {
  NONE = "none",
  BINARY = "binary",
  SUM = "sum"
}

export interface IVariantOptions {
  boardType: BOARD_TYPE;
  boardRows?: number;
  boardColumns?: number;
  boardSize?: number;
  pieceRanks: boolean;
  supportType?: SUPPORT_TYPE;
}

export interface IVariant extends IVariantOptions {
  userId: number;
  variantId: number;
}

export interface IVariantValidationErrors {
  general?: string;
  boardType?: string;
  boardRows?: string;
  boardColumns?: string;
  boardSize?: string;
  pieceRanks?: string;
  supportType?: string;
}

export interface ISearchVariantsRequest {
  pagination: IPaginationRequest;
}
