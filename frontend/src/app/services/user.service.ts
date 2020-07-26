import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { IUser } from "../shared/dtos/authentication";

@Injectable({
  providedIn: "root",
})
export class UserService {
  private readonly routePrefix = "/api/users";

  constructor(private readonly http: HttpClient) {}

  get(userId: number): Observable<IUser> {
    return this.http.get<IUser>(`${this.routePrefix}/${userId}`);
  }
}
