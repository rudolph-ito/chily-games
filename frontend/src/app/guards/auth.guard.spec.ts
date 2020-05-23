import { TestBed } from "@angular/core/testing";

import { AuthGuard } from "./auth.guard";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { RouterTestingModule } from "@angular/router/testing";

describe("AuthGuard", () => {
  let service: AuthGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
    });
    service = TestBed.inject(AuthGuard);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
