import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { AppModule } from "src/app/app.module";
import { OhHeckGameService } from "src/app/services/oh-heck/oh-heck-game-service";

import { OhHeckGamesIndexComponent } from "./oh-heck-games-index.component";

describe("OhHeckGamesIndexComponent", () => {
  let component: OhHeckGamesIndexComponent;
  let fixture: ComponentFixture<OhHeckGamesIndexComponent>;
  let mockGameService: Partial<OhHeckGameService>;

  beforeEach(() => {
    mockGameService = {
      search: () => of({ data: [], total: 0 }),
    };
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [{ provide: OhHeckGameService, useValue: mockGameService }],
    });
    fixture = TestBed.createComponent(OhHeckGamesIndexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
