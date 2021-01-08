import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { AppModule } from "src/app/app.module";
import { GameState, IGame } from "../../../shared/dtos/yaniv/game";

import { YanivGameScoreboardDialogComponent } from "./yaniv-game-scoreboard-dialog.component";

function buildTestGame(): IGame {
  return {
    gameId: 1,
    hostUserId: 1,
    options: { playTo: 100 },
    playerStates: [],
    state: GameState.ROUND_ACTIVE,
    roundScores: [],
    actionToUserId: 1,
    cardsOnTopOfDiscardPile: [],
  };
}

describe("YanivGameScoreboardDialogComponent", () => {
  let component: YanivGameScoreboardDialogComponent;
  let fixture: ComponentFixture<YanivGameScoreboardDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: { game: buildTestGame() },
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(YanivGameScoreboardDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
