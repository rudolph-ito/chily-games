import { Injectable } from "@angular/core";
import { HttpClient, HttpResponse } from "@angular/common/http";
import { Observable } from "rxjs";
import {
  IGame,
  IGameSetupChange,
  IGamePly,
  ISearchGamesRequest,
  IGameSetupRequirements,
} from "../shared/dtos/game";
import { IPaginatedResponse } from "../shared/dtos/search";

@Injectable({
  providedIn: "root",
})
export class GameService {
  constructor(private readonly http: HttpClient) {}

  get(gameId: number): Observable<IGame> {
    return this.http.get<IGame>(this.getRoutePrefix(gameId));
  }

  getSetupRequirements(gameId: number): Observable<IGameSetupRequirements> {
    return this.http.get<IGameSetupRequirements>(
      `${this.getRoutePrefix(gameId)}/setupRequirements`
    );
  }

  updateSetup(
    gameId: number,
    change: IGameSetupChange
  ): Observable<HttpResponse<Object>> {
    return this.http.post(
      `${this.getRoutePrefix(gameId)}/updateSetup`,
      change,
      { observe: "response" }
    );
  }

  completeSetup(gameId: number): Observable<HttpResponse<Object>> {
    return this.http.post(
      `${this.getRoutePrefix(gameId)}/completeSetup`,
      null,
      { observe: "response" }
    );
  }

  createPly(gameId: number, ply: IGamePly): Observable<HttpResponse<Object>> {
    return this.http.post(`${this.getRoutePrefix(gameId)}/createPly`, ply, {
      observe: "response",
    });
  }

  search(request: ISearchGamesRequest): Observable<IPaginatedResponse<IGame>> {
    return this.http.post<IPaginatedResponse<IGame>>(
      `/api/games/search`,
      request
    );
  }

  private getRoutePrefix(gameId: number): string {
    return `/api/games/${gameId}`;
  }
}
