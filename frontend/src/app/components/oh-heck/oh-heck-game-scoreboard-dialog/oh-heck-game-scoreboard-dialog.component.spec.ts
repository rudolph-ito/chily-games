import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { AppModule } from "src/app/app.module";
import { getMockGame } from "src/app/test/oh-heck/mock-data";

import { OhHeckGameScoreboardDialogComponent } from "./oh-heck-game-scoreboard-dialog.component";

describe("OhHeckGameScoreboardDialogComponent", () => {
  let component: OhHeckGameScoreboardDialogComponent;
  let fixture: ComponentFixture<OhHeckGameScoreboardDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: { game: getMockGame() },
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OhHeckGameScoreboardDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
