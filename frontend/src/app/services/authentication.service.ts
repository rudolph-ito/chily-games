import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import {
  ILoginRequest,
  IRegisterRequest,
  IUser,
} from "../shared/dtos/authentication";
import { Observable, Subject, ReplaySubject, of } from "rxjs";
import { tap } from "rxjs/operators";

@Injectable({
  providedIn: "root",
})
export class AuthenticationService {
  private readonly routePrefix = "/api/auth";
  private readonly guestCredentialsLocalStorageKey = "guestCredentials";
  private readonly userSubscription: ReplaySubject<IUser | null>;

  constructor(private readonly http: HttpClient) {
    this.userSubscription = new ReplaySubject<IUser | null>(1);
  }

  getUserSubject(): Subject<IUser | null> {
    return this.userSubscription;
  }

  login(request: ILoginRequest): Observable<IUser> {
    return this.http
      .post<IUser>(`${this.routePrefix}/login`, request)
      .pipe(tap((user) => this.userSubscription.next(user)));
  }

  logout(): Observable<Object> {
    this.userSubscription.next(null);
    this.removeSavedGuestCredentials();
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
      (_) => {
        this.tryLoginWithSavedGuestCredentials().subscribe(
          (user) => this.userSubscription.next(user),
          (_) => this.userSubscription.next(null)
        );
      }
    );
  }

  registerAsGuest(username: string): Observable<IUser> {
    const password = this.generateGuestPassword();
    return this.register({
      username,
      password,
      passwordConfirmation: password,
    }).pipe(
      tap((_) =>
        localStorage.setItem(
          this.guestCredentialsLocalStorageKey,
          JSON.stringify({ username, password })
        )
      )
    );
  }

  private tryLoginWithSavedGuestCredentials(): Observable<IUser | null> {
    const guestCredentials = localStorage.getItem(
      this.guestCredentialsLocalStorageKey
    );
    if (guestCredentials == null) {
      return of(null);
    }
    const loginRequest = JSON.parse(guestCredentials);
    return this.login(loginRequest).pipe(
      tap({ error: () => this.removeSavedGuestCredentials() })
    );
  }

  private generateGuestPassword(): string {
    let output = "";
    for (let i = 0; i < 5; i++) {
      output += Math.random().toString(36).substring(2, 15);
    }
    return output;
  }

  private removeSavedGuestCredentials(): void {
    localStorage.removeItem(this.guestCredentialsLocalStorageKey);
  }
}
