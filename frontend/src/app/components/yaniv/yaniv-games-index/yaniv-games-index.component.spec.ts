import { ComponentFixture, TestBed } from "@angular/core/testing";
import { YanivGamesIndexComponent } from "./yaniv-games-index.component";

describe("YanivGamesIndexComponent", () => {
  let component: YanivGamesIndexComponent;
  let fixture: ComponentFixture<YanivGamesIndexComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [YanivGamesIndexComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(YanivGamesIndexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
