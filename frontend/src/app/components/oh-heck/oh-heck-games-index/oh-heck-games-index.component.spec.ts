import { ComponentFixture, TestBed } from "@angular/core/testing";

import { OhHeckGamesIndexComponent } from "./oh-heck-games-index.component";

describe("OhHeckGamesIndexComponent", () => {
  let component: OhHeckGamesIndexComponent;
  let fixture: ComponentFixture<OhHeckGamesIndexComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OhHeckGamesIndexComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OhHeckGamesIndexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
