import { ComponentFixture, TestBed } from "@angular/core/testing";

import { RummikubGamesIndexComponent } from "./rummikub-games-index.component";

describe("RummikubGamesIndexComponent", () => {
  let component: RummikubGamesIndexComponent;
  let fixture: ComponentFixture<RummikubGamesIndexComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RummikubGamesIndexComponent],
    });
    fixture = TestBed.createComponent(RummikubGamesIndexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
