import { ComponentFixture, TestBed } from "@angular/core/testing";

import { RummikubGamesIndexComponent } from "./rummikub-games-index.component";
import { RummikubGameService } from "src/app/services/rummikub/rummikub-game-service";
import { of } from "rxjs";
import { AppModule } from "src/app/app.module";

describe("RummikubGamesIndexComponent", () => {
  let component: RummikubGamesIndexComponent;
  let fixture: ComponentFixture<RummikubGamesIndexComponent>;
  let mockGameService: Partial<RummikubGameService>;

  beforeEach(async () => {
    mockGameService = {
      search: () => of({ data: [], total: 0 }),
    };
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [{ provide: RummikubGameService, useValue: mockGameService }],
    });
    fixture = TestBed.createComponent(RummikubGamesIndexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
