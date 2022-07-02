import { Injectable } from "@angular/core";
import { HttpClient, HttpResponse } from "@angular/common/http";
import { Observable } from "rxjs";
import { IPaginatedResponse } from "../shared/dtos/search";
import { ICard } from "src/app/shared/dtos/card";
import {
  IDiscardEvent,
  IDiscardInput,
  IGame,
  IGameOptions,
  IMeldEvent,
  IMeldInput,
  IPickupEvent,
  IPickupInput,
  ISearchedGame,
  ISearchGamesRequest,
} from "../shared/dtos/rummy/game";

@Injectable({
  providedIn: "root",
})
export class RummyGameService {
  constructor(private readonly http: HttpClient) {}

  abort(gameId: number): Observable<IGame> {
    return this.http.put<IGame>(`${this.getRoutePrefix(gameId)}/abort`, "");
  }

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

  pickup(gameId: number, action: IPickupInput): Observable<IPickupEvent> {
    return this.http.put<IPickupEvent>(
      `${this.getRoutePrefix(gameId)}/pickup`,
      action
    );
  }

  meld(gameId: number, action: IMeldInput): Observable<IMeldEvent> {
    return this.http.put<IMeldEvent>(
      `${this.getRoutePrefix(gameId)}/meld`,
      action
    );
  }

  discard(gameId: number, action: IDiscardInput): Observable<IDiscardEvent> {
    return this.http.put<IDiscardEvent>(
      `${this.getRoutePrefix(gameId)}/discard`,
      action
    );
  }

  rematch(gameId: number, options: IGameOptions): Observable<IGame> {
    return this.http.post<IGame>(
      `${this.getRoutePrefix(gameId)}/rematch`,
      options
    );
  }

  rearrangeCards(
    gameId: number,
    cards: ICard[]
  ): Observable<HttpResponse<null>> {
    return this.http.put<null>(
      `${this.getRoutePrefix(gameId)}/rearrange-cards`,
      cards,
      { observe: "response" }
    );
  }

  private getRoutePrefix(gameId: number): string {
    return `/api/rummy/games/${gameId}`;
  }
}
