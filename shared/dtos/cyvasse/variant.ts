import { IPaginationRequest } from "../search";

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
  boardRows?: number | null;
  boardColumns?: number | null;
  boardSize?: number | null;
  pieceRanks: boolean;
  supportType?: SupportType | null;
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
