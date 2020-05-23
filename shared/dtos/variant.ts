import { IPaginationRequest } from "./search";

export enum BoardType {
  SQUARE = "square",
  HEXAGONAL = "hexagonal",
}

export enum SupportType {
  NONE = "none",
  BINARY = "binary",
  SUM = "sum",
}

export interface IVariantOptions {
  boardType: BoardType;
  boardRows?: number;
  boardColumns?: number;
  boardSize?: number;
  pieceRanks: boolean;
  supportType?: SupportType;
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
