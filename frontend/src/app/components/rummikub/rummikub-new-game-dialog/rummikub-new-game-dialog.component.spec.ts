import { ComponentFixture, TestBed } from "@angular/core/testing";

import { RummikubNewGameDialogComponent } from "./rummikub-new-game-dialog.component";

describe("RummikubNewGameDialogComponent", () => {
  let component: RummikubNewGameDialogComponent;
  let fixture: ComponentFixture<RummikubNewGameDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RummikubNewGameDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RummikubNewGameDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
