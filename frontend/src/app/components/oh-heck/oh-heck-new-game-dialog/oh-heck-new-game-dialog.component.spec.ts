import { ComponentFixture, TestBed } from "@angular/core/testing";

import { OhHeckNewGameDialogComponent } from "./oh-heck-new-game-dialog.component";

describe("OhHeckNewGameDialogComponent", () => {
  let component: OhHeckNewGameDialogComponent;
  let fixture: ComponentFixture<OhHeckNewGameDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OhHeckNewGameDialogComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OhHeckNewGameDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
