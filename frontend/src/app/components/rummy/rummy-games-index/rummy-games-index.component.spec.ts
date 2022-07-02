import { ComponentFixture, TestBed } from "@angular/core/testing";

import { RummyGamesIndexComponent } from "./rummy-games-index.component";

describe("RummyGamesIndexComponent", () => {
  let component: RummyGamesIndexComponent;
  let fixture: ComponentFixture<RummyGamesIndexComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RummyGamesIndexComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RummyGamesIndexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
