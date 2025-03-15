import { ComponentFixture, TestBed } from "@angular/core/testing";

import { CyvasseGamesIndexComponent } from "./cyvasse-games-index.component";
import { AppModule } from "src/app/app.module";
import { CyvasseGameService } from "src/app/services/cyvasse/cvasse-game.service";
import { of } from "rxjs";

describe("CyvasseGamesIndexComponent", () => {
  let component: CyvasseGamesIndexComponent;
  let fixture: ComponentFixture<CyvasseGamesIndexComponent>;
  let mockGameService: Partial<CyvasseGameService>;

  beforeEach(() => {
    mockGameService = {
      search: () => of({ data: [], total: 0 }),
    };
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [{ provide: CyvasseGameService, useValue: mockGameService }],
    });
    fixture = TestBed.createComponent(CyvasseGamesIndexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
