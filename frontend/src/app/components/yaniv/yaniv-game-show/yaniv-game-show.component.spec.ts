import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AppModule } from "src/app/app.module";
import { YanivGameShowComponent } from "./yaniv-game-show.component";

describe("YanivGameShowComponent", () => {
  let component: YanivGameShowComponent;
  let fixture: ComponentFixture<YanivGameShowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppModule],
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
