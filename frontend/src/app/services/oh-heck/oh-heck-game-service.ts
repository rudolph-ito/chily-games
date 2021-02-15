import { Injectable } from "@angular/core";
import { HttpClient, HttpResponse } from "@angular/common/http";
import { Observable } from "rxjs";
import { IPaginatedResponse } from "../../shared/dtos/search";
import { ICard } from "../../shared/dtos/card";
import { IBetEvent, IGame, IGameOptions, IPlaceBetInput, IPlayCardInput, ISearchedGame, ISearchGamesRequest, ITrickEvent } from "../../shared/dtos/oh_heck/game";

@Injectable({
  providedIn: "root",
})
export class OhHeckGameService {
  constructor(private readonly http: HttpClient) {}

  abort(gameId: number): Observable<IGame> {
    return this.http.put<IGame>(`${this.getRoutePrefix(gameId)}/abort`, "");
  }

  create(options: IGameOptions): Observable<IGame> {
    return this.http.post<IGame>("/api/oh-heck/games", options);
  }

  search(
    request: ISearchGamesRequest
  ): Observable<IPaginatedResponse<ISearchedGame>> {
    return this.http.post<IPaginatedResponse<ISearchedGame>>(
      `/api/oh-heck/games/search`,
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

  placeBet(
    gameId: number,
    input: IPlaceBetInput
  ): Observable<IBetEvent> {
    return this.http.put<IBetEvent>(
      `${this.getRoutePrefix(gameId)}/place-bet`,
      input
    );
  }

  playCard(
    gameId: number,
    input: IPlayCardInput
  ): Observable<ITrickEvent> {
    return this.http.put<ITrickEvent>(
      `${this.getRoutePrefix(gameId)}/play-card`,
      input
    );
  }

  rematch(gameId, options: IGameOptions): Observable<IGame> {
    return this.http.post<IGame>(
      `${this.getRoutePrefix(gameId)}/rematch`,
      options
    );
  }

  rearrangeCards(
    gameId: number,
    cards: ICard[]
  ): Observable<HttpResponse<Object>> {
    return this.http.put<HttpResponse<Object>>(
      `${this.getRoutePrefix(gameId)}/rearrange-cards`,
      cards,
      { observe: "response" }
    );
  }

  private getRoutePrefix(gameId: number): string {
    return `/api/oh-heck/games/${gameId}`;
  }
}
