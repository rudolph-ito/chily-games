import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import {
  IVariant,
  ISearchVariantsRequest,
  IVariantOptions,
} from "../shared/dtos/variant";
import { IPaginatedResponse } from "../shared/dtos/search";
import { IPieceRuleOptions, CaptureType } from "../shared/dtos/piece_rule";
import {
  IPreviewPieceRuleResponse,
  IPreviewPieceRuleRequest,
} from "../shared/dtos/game";

@Injectable({
  providedIn: "root",
})
export class VariantService {
  routePrefix = "/api/variants";

  constructor(private readonly http: HttpClient) {}

  create(request: IVariantOptions): Observable<IVariant> {
    return this.http.post<IVariant>(`${this.routePrefix}`, request);
  }

  get(variantId: number): Observable<IVariant> {
    return this.http.get<IVariant>(`${this.routePrefix}/${variantId}`);
  }

  previewPieceRule(
    variantId: number,
    evaluationType: CaptureType,
    pieceRuleOptions: IPieceRuleOptions
  ): Observable<IPreviewPieceRuleResponse> {
    const request: IPreviewPieceRuleRequest = {
      evaluationType,
      pieceRule: pieceRuleOptions,
    };
    return this.http.post<IPreviewPieceRuleResponse>(
      `${this.routePrefix}/${variantId}/preview/pieceRule`,
      request
    );
  }

  update(variantId: number, request: IVariantOptions): Observable<IVariant> {
    return this.http.put<IVariant>(`${this.routePrefix}/${variantId}`, request);
  }

  search(
    request: ISearchVariantsRequest
  ): Observable<IPaginatedResponse<IVariant>> {
    return this.http.post<IPaginatedResponse<IVariant>>(
      `${this.routePrefix}/search`,
      request
    );
  }
}
