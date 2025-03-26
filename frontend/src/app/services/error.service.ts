import { Injectable } from "@angular/core";
import { HttpClient, HttpResponse } from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class ErrorService {
  private readonly routePrefix = "/api/errors";

  constructor(private readonly http: HttpClient) {}

  log(message: any): Observable<HttpResponse<null>> {
    return this.http.post<null>(`${this.routePrefix}/log`, message, {
      observe: "response",
    });
  }
}
