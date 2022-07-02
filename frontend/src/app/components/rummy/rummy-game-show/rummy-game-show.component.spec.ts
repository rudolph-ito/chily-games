import { ComponentFixture, TestBed } from "@angular/core/testing";

import { RummyGameShowComponent } from "./rummy-game-show.component";

describe("RummyGameShowComponent", () => {
  let component: RummyGameShowComponent;
  let fixture: ComponentFixture<RummyGameShowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RummyGameShowComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RummyGameShowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
