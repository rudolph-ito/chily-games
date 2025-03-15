import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ChallengesIndexComponent } from "./challenges-index.component";
import { AppModule } from "src/app/app.module";
import { ChallengeService } from "src/app/services/cyvasse/challenge.service";
import { of } from "rxjs";

describe("ChallengesIndexComponent", () => {
  let component: ChallengesIndexComponent;
  let fixture: ComponentFixture<ChallengesIndexComponent>;
  let mockChallengeService: Partial<ChallengeService>;

  beforeEach(() => {
    mockChallengeService = {
      search: () => of({ data: [], total: 0 }),
    };
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [
        { provide: ChallengeService, useValue: mockChallengeService },
      ],
    });
    fixture = TestBed.createComponent(ChallengesIndexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
