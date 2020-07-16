import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ChallengesIndexComponent } from "./challenges-index.component";
import { AppModule } from "src/app/app.module";

describe("ChallengesIndexComponent", () => {
  let component: ChallengesIndexComponent;
  let fixture: ComponentFixture<ChallengesIndexComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChallengesIndexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
