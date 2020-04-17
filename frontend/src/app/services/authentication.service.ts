import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import {
  ILoginRequest,
  IRegisterRequest,
  IRegisterResponse,
  IUser
} from "../shared/dtos/authentication";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root"
})
export class AuthenticationService {
  routePrefix = "/api/auth";

  constructor(private readonly http: HttpClient) {}

  getUser(): Observable<IUser> {
    return this.http.get<IUser>(`${this.routePrefix}/user`);
  }

  login(request: ILoginRequest): Observable<string> {
    return this.http.post<string>(`${this.routePrefix}/login`, request);
  }

  logout(): Observable<Object> {
    return this.http.delete(`${this.routePrefix}/logout`);
  }

  register(request: IRegisterRequest): Observable<IRegisterResponse> {
    return this.http.post<IRegisterResponse>(
      `${this.routePrefix}/register`,
      request
    );
  }
}
