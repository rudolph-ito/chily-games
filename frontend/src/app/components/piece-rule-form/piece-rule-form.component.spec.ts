import { ComponentFixture, TestBed } from "@angular/core/testing";

import { PieceRuleFormComponent } from "./piece-rule-form.component";
import { RouterTestingModule } from "@angular/router/testing";
import { AppModule } from "src/app/app.module";

describe("PieceRuleFormComponent", () => {
  let component: PieceRuleFormComponent;
  let fixture: ComponentFixture<PieceRuleFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, AppModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PieceRuleFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
