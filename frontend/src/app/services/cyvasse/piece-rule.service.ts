import { Injectable } from "@angular/core";
import { HttpClient, HttpResponse } from "@angular/common/http";
import { Observable } from "rxjs";
import {
  IPieceRule,
  IPieceRuleOptions,
} from "../../shared/dtos/cyvasse/piece_rule";

@Injectable({
  providedIn: "root",
})
export class PieceRuleService {
  constructor(private readonly http: HttpClient) {}

  create(
    variantId: number,
    request: IPieceRuleOptions
  ): Observable<IPieceRule> {
    return this.http.post<IPieceRule>(this.getRoutePrefix(variantId), request);
  }

  delete(
    variantId: number,
    pieceRuleId: number
  ): Observable<HttpResponse<Object>> {
    return this.http.delete(
      `${this.getRoutePrefix(variantId)}/${pieceRuleId}`,
      { observe: "response" }
    );
  }

  get(variantId: number, pieceRuleId: number): Observable<IPieceRule> {
    return this.http.get<IPieceRule>(
      `${this.getRoutePrefix(variantId)}/${pieceRuleId}`
    );
  }

  getAllForVariant(variantId: number): Observable<IPieceRule[]> {
    return this.http.get<IPieceRule[]>(this.getRoutePrefix(variantId));
  }

  update(
    variantId: number,
    pieceRuleId: number,
    request: IPieceRuleOptions
  ): Observable<IPieceRule> {
    return this.http.put<IPieceRule>(
      `${this.getRoutePrefix(variantId)}/${pieceRuleId}`,
      request
    );
  }

  private getRoutePrefix(variantId: number): string {
    return `/api/cyvasse/variants/${variantId}/pieceRules`;
  }
}
