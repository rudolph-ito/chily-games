import { Injectable } from "@angular/core";
import { HttpClient, HttpResponse } from "@angular/common/http";
import { Observable } from "rxjs";
import { IChat } from "../shared/dtos/chat";

@Injectable({
  providedIn: "root",
})
export class ChatService {
  private readonly routePrefix = "/api/chats";

  constructor(private readonly http: HttpClient) {}

  get(chatId: string): Observable<IChat> {
    return this.http.get<IChat>(`${this.routePrefix}/${chatId}`);
  }

  addMessage(
    chatId: string,
    message: string
  ): Observable<HttpResponse<null>> {
    return this.http.post<null>(
      `${this.routePrefix}/${chatId}`,
      { message },
      { observe: "response" }
    );
  }
}
