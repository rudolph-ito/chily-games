import { ReplaySubject } from "rxjs";
import { AuthenticationService } from "../services/authentication.service";
import { IUser } from "../shared/dtos/authentication";

export interface IMockedAuthenticationService {
  userSubject: ReplaySubject<IUser>;
  service: Partial<AuthenticationService>;
}

export function getMockAuthenticationService(): IMockedAuthenticationService {
  const userSubject = new ReplaySubject<IUser>(1);
  userSubject.next(null);
  return {
    userSubject,
    service: {
      getUserSubject: () => userSubject,
      initUser: () => {}
    }
  };
}
