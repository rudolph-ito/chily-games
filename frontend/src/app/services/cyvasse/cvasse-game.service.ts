import { Injectable } from "@angular/core";
import { HttpClient, HttpResponse } from "@angular/common/http";
import { Observable } from "rxjs";
import {
  IGame,
  IGameSetupChange,
  IGamePly,
  ISearchGamesRequest,
  IGameRules,
  IGetGameValidPliesRequest,
  ValidPlies,
} from "../../shared/dtos/cyvasse/game";
import { IPaginatedResponse } from "../../shared/dtos/search";

@Injectable({
  providedIn: "root",
})
export class CyvasseGameService {
  constructor(private readonly http: HttpClient) {}

  get(gameId: number): Observable<IGame> {
    return this.http.get<IGame>(this.getRoutePrefix(gameId));
  }

  getRules(gameId: number): Observable<IGameRules> {
    return this.http.get<IGameRules>(`${this.getRoutePrefix(gameId)}/rules`);
  }

  getValidPlies(
    gameId: number,
    request: IGetGameValidPliesRequest
  ): Observable<ValidPlies> {
    return this.http.post<ValidPlies>(
      `${this.getRoutePrefix(gameId)}/validPlies`,
      request
    );
  }

  updateSetup(
    gameId: number,
    change: IGameSetupChange
  ): Observable<HttpResponse<null>> {
    return this.http.post<null>(
      `${this.getRoutePrefix(gameId)}/updateSetup`,
      change,
      { observe: "response" }
    );
  }

  completeSetup(gameId: number): Observable<HttpResponse<null>> {
    return this.http.post<null>(
      `${this.getRoutePrefix(gameId)}/completeSetup`,
      null,
      { observe: "response" }
    );
  }

  createPly(gameId: number, ply: IGamePly): Observable<HttpResponse<null>> {
    return this.http.post<null>(`${this.getRoutePrefix(gameId)}/createPly`, ply, {
      observe: "response",
    });
  }

  search(request: ISearchGamesRequest): Observable<IPaginatedResponse<IGame>> {
    return this.http.post<IPaginatedResponse<IGame>>(
      `/api/cyvasse/games/search`,
      request
    );
  }

  private getRoutePrefix(gameId: number): string {
    return `/api/cyvasse/games/${gameId}`;
  }
}
