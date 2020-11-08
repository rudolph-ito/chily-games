import { Injectable } from "@angular/core";
import { HttpClient, HttpResponse } from "@angular/common/http";
import { Observable } from "rxjs";
import { IGame } from "../../shared/dtos/cyvasse/game";
import {
  IChallengeOptions,
  IChallenge,
  ISearchChallengesRequest,
} from "../../shared/dtos/cyvasse/challenge";
import { IPaginatedResponse } from "../../shared/dtos/search";

@Injectable({
  providedIn: "root",
})
export class ChallengeService {
  private readonly routePrefix = "/api/cyvasse/challenges";

  constructor(private readonly http: HttpClient) {}

  create(request: IChallengeOptions): Observable<IChallenge> {
    return this.http.post<IChallenge>(this.routePrefix, request);
  }

  delete(challengeId: number): Observable<HttpResponse<Object>> {
    return this.http.delete(`${this.routePrefix}/${challengeId}`, {
      observe: "response",
    });
  }

  accept(challengeId: number): Observable<IGame> {
    return this.http.post<IGame>(
      `${this.routePrefix}/${challengeId}/accept`,
      null
    );
  }

  search(
    request: ISearchChallengesRequest
  ): Observable<IPaginatedResponse<IChallenge>> {
    return this.http.post<IPaginatedResponse<IChallenge>>(
      `${this.routePrefix}/search`,
      request
    );
  }
}
