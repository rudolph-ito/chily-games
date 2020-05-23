import { ComponentFixture, TestBed } from "@angular/core/testing";

import { VariantFormComponent } from "./variant-form.component";
import { RouterTestingModule } from "@angular/router/testing";
import { AppModule } from "src/app/app.module";
import { VariantService } from "src/app/services/variant.service";

describe("VariantFormComponent", () => {
  let component: VariantFormComponent;
  let fixture: ComponentFixture<VariantFormComponent>;
  let mockVariantService: Partial<VariantService>;

  beforeEach(async () => {
    mockVariantService = {};
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, AppModule],
      providers: [{ provide: VariantService, useValue: mockVariantService }],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VariantFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
