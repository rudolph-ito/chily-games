import { TestBed } from "@angular/core/testing";

import { VariantService } from "./variant.service";
import { HttpClientTestingModule } from "@angular/common/http/testing";

describe("VariantService", () => {
  let service: VariantService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(VariantService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
