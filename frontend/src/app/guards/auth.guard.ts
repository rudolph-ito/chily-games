import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { AuthenticationService } from "../services/authentication.service";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { doesHaveValue } from "../shared/utilities/value_checker";

@Injectable({
  providedIn: "root",
})
export class AuthGuard {
  constructor(private readonly authenticationService: AuthenticationService) {}

  canActivate(
    _next: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authenticationService
      .getUserSubject()
      .pipe(map((x) => doesHaveValue(x)));
  }
}
