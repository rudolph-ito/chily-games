import { TestBed } from "@angular/core/testing";

import { AuthGuard } from "./auth.guard";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";

describe("AuthGuard", () => {
  let service: AuthGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AuthGuard);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
