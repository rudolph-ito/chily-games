import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import {
  IVariant,
  ISearchVariantsRequest,
  IVariantOptions
} from "../shared/dtos/variant";
import { IPaginatedResponse } from "../shared/dtos/search";

@Injectable({
  providedIn: "root"
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
