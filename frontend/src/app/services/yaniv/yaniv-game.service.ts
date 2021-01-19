import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { IPaginatedResponse } from "../../shared/dtos/search";
import {
  IGame,
  IGameActionRequest,
  IGameActionResponse,
  IGameOptions,
  ISearchedGame,
  ISearchGamesRequest,
} from "../../shared/dtos/yaniv/game";

@Injectable({
  providedIn: "root",
})
export class YanivGameService {
  constructor(private readonly http: HttpClient) {}

  create(options: IGameOptions): Observable<IGame> {
    return this.http.post<IGame>("/api/yaniv/games", options);
  }

  search(
    request: ISearchGamesRequest
  ): Observable<IPaginatedResponse<ISearchedGame>> {
    return this.http.post<IPaginatedResponse<ISearchedGame>>(
      `/api/yaniv/games/search`,
      request
    );
  }

  get(gameId: number): Observable<IGame> {
    return this.http.get<IGame>(this.getRoutePrefix(gameId));
  }

  join(gameId: number): Observable<IGame> {
    return this.http.put<IGame>(`${this.getRoutePrefix(gameId)}/join`, "");
  }

  startRound(gameId: number): Observable<IGame> {
    return this.http.put<IGame>(
      `${this.getRoutePrefix(gameId)}/start-round`,
      ""
    );
  }

  play(
    gameId: number,
    action: IGameActionRequest
  ): Observable<IGameActionResponse> {
    return this.http.put<IGameActionResponse>(
      `${this.getRoutePrefix(gameId)}/play`,
      action
    );
  }

  rematch(gameId, options: IGameOptions): Observable<IGame> {
    return this.http.post<IGame>(`${this.getRoutePrefix(gameId)}/rematch`, options);
  }

  private getRoutePrefix(gameId: number): string {
    return `/api/yaniv/games/${gameId}`;
  }
}
