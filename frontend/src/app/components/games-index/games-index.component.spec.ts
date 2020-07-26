import { ComponentFixture, TestBed } from "@angular/core/testing";

import { GamesIndexComponent } from "./games-index.component";
import { AppModule } from "src/app/app.module";
import { GameService } from "src/app/services/game.service";
import { of } from "rxjs";

describe("GamesIndexComponent", () => {
  let component: GamesIndexComponent;
  let fixture: ComponentFixture<GamesIndexComponent>;
  let mockGameService: Partial<GameService>;

  beforeEach(async () => {
    mockGameService = {
      search: () => of({ data: [], total: 0 }),
    };
    await TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [{ provide: GameService, useValue: mockGameService }],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GamesIndexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
