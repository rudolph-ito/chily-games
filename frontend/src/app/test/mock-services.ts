import { ReplaySubject } from "rxjs";
import { AuthenticationService } from "../services/authentication.service";
import { IUser } from "../shared/dtos/authentication";

export interface IMockedAuthenticationService {
  userSubject: ReplaySubject<IUser | null>;
  service: Partial<AuthenticationService>;
}

export function getMockAuthenticationService(): IMockedAuthenticationService {
  const userSubject = new ReplaySubject<IUser | null>(1);
  userSubject.next(null);
  return {
    userSubject,
    service: {
      getUserSubject: () => userSubject,
      initUser: () => {},
    },
  };
}
