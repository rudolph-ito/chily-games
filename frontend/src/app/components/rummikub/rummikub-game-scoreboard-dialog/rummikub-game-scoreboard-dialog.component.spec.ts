import { ComponentFixture, TestBed } from "@angular/core/testing";

import { RummikubGameScoreboardDialogComponent } from "./rummikub-game-scoreboard-dialog.component";

describe("RummikubGameScoreboardDialogComponent", () => {
  let component: RummikubGameScoreboardDialogComponent;
  let fixture: ComponentFixture<RummikubGameScoreboardDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RummikubGameScoreboardDialogComponent],
    });
    fixture = TestBed.createComponent(RummikubGameScoreboardDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
