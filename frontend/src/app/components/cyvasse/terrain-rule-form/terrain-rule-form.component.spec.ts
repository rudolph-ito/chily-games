import { ComponentFixture, TestBed } from "@angular/core/testing";

import { TerrainRuleFormComponent } from "./terrain-rule-form.component";
import { RouterTestingModule } from "@angular/router/testing";
import { AppModule } from "src/app/app.module";

describe("TerrainRuleFormComponent", () => {
  let component: TerrainRuleFormComponent;
  let fixture: ComponentFixture<TerrainRuleFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, AppModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TerrainRuleFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
