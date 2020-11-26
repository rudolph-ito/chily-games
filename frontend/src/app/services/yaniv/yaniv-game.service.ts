import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { IPaginatedResponse } from "../../shared/dtos/search";
import {
  IGame,
  IGameActionRequest,
  IGameOptions,
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

  search(request: ISearchGamesRequest): Observable<IPaginatedResponse<IGame>> {
    return this.http.post<IPaginatedResponse<IGame>>(
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

  play(gameId: number, action: IGameActionRequest): Observable<IGame> {
    return this.http.put<IGame>(`${this.getRoutePrefix(gameId)}/play`, action);
  }

  private getRoutePrefix(gameId: number): string {
    return `/api/yaniv/games/${gameId}`;
  }
}
