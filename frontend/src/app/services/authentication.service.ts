import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import {
  ILoginRequest,
  IRegisterRequest,
  IUser,
} from "../shared/dtos/authentication";
import { Observable, Subject, ReplaySubject } from "rxjs";
import { tap } from "rxjs/operators";

@Injectable({
  providedIn: "root",
})
export class AuthenticationService {
  private readonly routePrefix = "/api/auth";
  private readonly userSubscription: ReplaySubject<IUser>;

  constructor(private readonly http: HttpClient) {
    this.userSubscription = new ReplaySubject<IUser>(1);
  }

  getUserSubject(): Subject<IUser> {
    return this.userSubscription;
  }

  login(request: ILoginRequest): Observable<IUser> {
    return this.http
      .post<IUser>(`${this.routePrefix}/login`, request)
      .pipe(tap((user) => this.userSubscription.next(user)));
  }

  logout(): Observable<Object> {
    this.userSubscription.next(null);
    return this.http.delete(`${this.routePrefix}/logout`);
  }

  register(request: IRegisterRequest): Observable<IUser> {
    return this.http
      .post<IUser>(`${this.routePrefix}/register`, request)
      .pipe(tap((user) => this.userSubscription.next(user)));
  }

  initUser(): void {
    this.http.get<IUser>(`${this.routePrefix}/user`).subscribe(
      (user) => this.userSubscription.next(user),
      (_) => this.userSubscription.next(null)
    );
  }
}
