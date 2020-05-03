export interface IPaginationRequest {
  pageIndex: number;
  pageSize: number;
}

export interface IPaginatedResponse<T> {
  data: T[];
  total: number;
}

export interface ISearchPaginationValidationErrors {
  pageIndex: string;
  pageSize: string;
}

export interface ISearchValidationErrors {
  pagination: ISearchPaginationValidationErrors;
}
