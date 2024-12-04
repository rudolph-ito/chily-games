import { ComponentFixture, TestBed } from "@angular/core/testing";

import { RummikubGameShowComponent } from "./rummikub-game-show.component";

describe("RummikubGameShowComponent", () => {
  let component: RummikubGameShowComponent;
  let fixture: ComponentFixture<RummikubGameShowComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RummikubGameShowComponent],
    });
    fixture = TestBed.createComponent(RummikubGameShowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
