import { Injectable } from "@angular/core";
import { HttpClient, HttpResponse } from "@angular/common/http";
import { Observable } from "rxjs";
import { IPaginatedResponse } from "../../shared/dtos/search";
import {
  IGame,
  IDoneWithTurnResponse,
  IGameOptions,
  ISearchedGame,
  ISearchGamesRequest,
  IUpdateSets,
} from "../../shared/dtos/rummikub/game";
import { ITile } from "src/app/shared/dtos/rummikub/tile";

@Injectable({
  providedIn: "root",
})
export class RummikubGameService {
  constructor(private readonly http: HttpClient) {}

  abort(gameId: number): Observable<IGame> {
    return this.http.put<IGame>(`${this.getRoutePrefix(gameId)}/abort`, "");
  }

  create(options: IGameOptions): Observable<IGame> {
    return this.http.post<IGame>("/api/rummikub/games", options);
  }

  search(
    request: ISearchGamesRequest
  ): Observable<IPaginatedResponse<ISearchedGame>> {
    return this.http.post<IPaginatedResponse<ISearchedGame>>(
      `/api/rummikub/games/search`,
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

  doneWithTurn(gameId: number): Observable<IDoneWithTurnResponse> {
    return this.http.put<IDoneWithTurnResponse>(
      `${this.getRoutePrefix(gameId)}/done-with-turn`,
      null
    );
  }

  rematch(gameId: number, options: IGameOptions): Observable<IGame> {
    return this.http.post<IGame>(
      `${this.getRoutePrefix(gameId)}/rematch`,
      options
    );
  }

  rearrangeTiles(
    gameId: number,
    tiles: ITile[]
  ): Observable<HttpResponse<null>> {
    return this.http.put<null>(
      `${this.getRoutePrefix(gameId)}/rearrange-tiles`,
      tiles,
      { observe: "response" }
    );
  }

  updateSets(
    gameId: number,
    updateSets: IUpdateSets
  ): Observable<HttpResponse<null>> {
    return this.http.put<null>(
      `${this.getRoutePrefix(gameId)}/update-sets`,
      updateSets,
      { observe: "response" }
    );
  }

  revertToLastValidUpdateSets(gameId: number): Observable<IUpdateSets> {
    return this.http.put<IUpdateSets>(
      `${this.getRoutePrefix(gameId)}/revert-to-last-valid-update-sets`,
      null
    );
  }

  revertToStartOfTurn(gameId: number): Observable<IUpdateSets> {
    return this.http.put<IUpdateSets>(
      `${this.getRoutePrefix(gameId)}/revert-to-start-of-turn`,
      null
    );
  }

  private getRoutePrefix(gameId: number): string {
    return `/api/rummikub/games/${gameId}`;
  }
}
