import { ComponentFixture, TestBed } from "@angular/core/testing";

import { YanivGameScoreboardDialogComponent } from "./yaniv-game-scoreboard-dialog.component";

describe("YanivGameScoreboardDialogComponent", () => {
  let component: YanivGameScoreboardDialogComponent;
  let fixture: ComponentFixture<YanivGameScoreboardDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [YanivGameScoreboardDialogComponent],
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
