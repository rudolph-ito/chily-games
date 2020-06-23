import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { GamesIndexComponent } from "./games-index.component";

describe("GamesIndexComponent", () => {
  let component: GamesIndexComponent;
  let fixture: ComponentFixture<GamesIndexComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [GamesIndexComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GamesIndexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
