import { ComponentFixture, TestBed } from "@angular/core/testing";
import { YanivGameShowComponent } from "./yaniv-game-show.component";

describe("YanivGameShowComponent", () => {
  let component: YanivGameShowComponent;
  let fixture: ComponentFixture<YanivGameShowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [YanivGameShowComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(YanivGameShowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
