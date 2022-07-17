import { ComponentFixture, TestBed } from "@angular/core/testing";

import { RummyNewGameDialogComponent } from "./rummy-new-game-dialog.component";

describe("RummyNewGameDialogComponent", () => {
  let component: RummyNewGameDialogComponent;
  let fixture: ComponentFixture<RummyNewGameDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RummyNewGameDialogComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RummyNewGameDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
