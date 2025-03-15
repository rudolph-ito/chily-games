import { ComponentFixture, TestBed } from "@angular/core/testing";

import { VariantsIndexComponent } from "./variants-index.component";
import { AppModule } from "../../../app.module";
import { VariantService } from "src/app/services/cyvasse/variant.service";
import { of } from "rxjs";

describe("VariantsIndexComponent", () => {
  let component: VariantsIndexComponent;
  let fixture: ComponentFixture<VariantsIndexComponent>;
  let mockVariantService: Partial<VariantService>;

  beforeEach(() => {
    mockVariantService = {
      search: () => of({ data: [], total: 0 }),
    };
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [{ provide: VariantService, useValue: mockVariantService }],
    });
    fixture = TestBed.createComponent(VariantsIndexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
