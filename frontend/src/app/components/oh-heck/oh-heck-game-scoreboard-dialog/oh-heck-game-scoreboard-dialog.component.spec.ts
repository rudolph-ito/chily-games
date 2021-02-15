import { ComponentFixture, TestBed } from "@angular/core/testing";

import { OhHeckScoreboardDialogComponent } from "./oh-heck-game-scoreboard-dialog.component";

describe("OhHeckScoreboardDialogComponent", () => {
  let component: OhHeckScoreboardDialogComponent;
  let fixture: ComponentFixture<OhHeckScoreboardDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OhHeckScoreboardDialogComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OhHeckScoreboardDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
