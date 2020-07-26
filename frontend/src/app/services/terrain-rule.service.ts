import { Injectable } from "@angular/core";
import { HttpClient, HttpResponse } from "@angular/common/http";
import { Observable } from "rxjs";
import { ITerrainRule, ITerrainRuleOptions } from "../shared/dtos/terrain_rule";

@Injectable({
  providedIn: "root",
})
export class TerrainRuleService {
  constructor(private readonly http: HttpClient) {}

  create(
    variantId: number,
    request: ITerrainRuleOptions
  ): Observable<ITerrainRule> {
    return this.http.post<ITerrainRule>(
      this.getRoutePrefix(variantId),
      request
    );
  }

  delete(
    variantId: number,
    terrainRuleId: number
  ): Observable<HttpResponse<Object>> {
    return this.http.delete(
      `${this.getRoutePrefix(variantId)}/${terrainRuleId}`,
      { observe: "response" }
    );
  }

  get(variantId: number, terrainRuleId: number): Observable<ITerrainRule> {
    return this.http.get<ITerrainRule>(
      `${this.getRoutePrefix(variantId)}/${terrainRuleId}`
    );
  }

  getAllForVariant(variantId: number): Observable<ITerrainRule[]> {
    return this.http.get<ITerrainRule[]>(this.getRoutePrefix(variantId));
  }

  update(
    variantId: number,
    terrainRuleId: number,
    request: ITerrainRuleOptions
  ): Observable<ITerrainRule> {
    return this.http.put<ITerrainRule>(
      `${this.getRoutePrefix(variantId)}/${terrainRuleId}`,
      request
    );
  }

  private getRoutePrefix(variantId: number): string {
    return `/api/variants/${variantId}/terrainRules`;
  }
}
