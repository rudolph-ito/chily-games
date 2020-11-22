import { ComponentFixture, TestBed } from "@angular/core/testing";

import { CyvasseGamesIndexComponent } from "./cyvasse-games-index.component";
import { AppModule } from "src/app/app.module";
import { GameService } from "src/app/services/cyvasse/game.service";
import { of } from "rxjs";

describe("CyvasseGamesIndexComponent", () => {
  let component: CyvasseGamesIndexComponent;
  let fixture: ComponentFixture<CyvasseGamesIndexComponent>;
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
    fixture = TestBed.createComponent(CyvasseGamesIndexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
