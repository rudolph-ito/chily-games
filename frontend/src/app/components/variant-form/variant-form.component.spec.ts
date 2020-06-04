import { ComponentFixture, TestBed } from "@angular/core/testing";

import { VariantFormComponent } from "./variant-form.component";
import { RouterTestingModule } from "@angular/router/testing";
import { AppModule } from "src/app/app.module";

describe("VariantFormComponent", () => {
  let component: VariantFormComponent;
  let fixture: ComponentFixture<VariantFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, AppModule],
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
