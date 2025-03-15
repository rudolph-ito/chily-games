import { ComponentFixture, TestBed } from "@angular/core/testing";

import { RummikubGameScoreboardDialogComponent } from "./rummikub-game-scoreboard-dialog.component";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { AppModule } from "src/app/app.module";
import { getMockGame } from "src/app/test/rummikub/mock-data";

describe("RummikubGameScoreboardDialogComponent", () => {
  let component: RummikubGameScoreboardDialogComponent;
  let fixture: ComponentFixture<RummikubGameScoreboardDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: { game: getMockGame() },
        },
      ],
    });
    fixture = TestBed.createComponent(RummikubGameScoreboardDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
