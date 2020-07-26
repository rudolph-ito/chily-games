import { ComponentFixture, TestBed } from "@angular/core/testing";

import { GameShowComponent } from "./game-show.component";
import { AppModule } from "src/app/app.module";
import { GameService } from "src/app/services/game.service";
import { of } from "rxjs";
import { Action } from "../../shared/dtos/game";
import { UserService } from "src/app/services/user.service";
import { VariantService } from "src/app/services/variant.service";
import { BoardType } from "src/app/shared/dtos/variant";

describe("GameShowComponent", () => {
  let component: GameShowComponent;
  let fixture: ComponentFixture<GameShowComponent>;
  let mockGameService: Partial<GameService>;
  let mockUserService: Partial<UserService>;
  let mockVariantService: Partial<VariantService>;

  beforeEach(async () => {
    mockGameService = {
      get: () =>
        of({
          gameId: 1,
          variantId: 2,
          alabasterUserId: 3,
          onyxUserId: 4,
          action: Action.SETUP,
          actionTo: null,
          alabasterSetupCoordinateMap: [],
          onyxSetupCoordinateMap: [],
          currentCoordinateMap: [],
          plies: [],
        }),
      getSetupRequirements: () =>
        of({
          pieces: [],
          terrains: [],
          territories: {
            alabaster: [],
            neutral: [],
            onyx: [],
          },
        }),
    };
    mockUserService = {
      get: () => of({ userId: 1, username: "test" }),
    };
    mockVariantService = {
      get: () =>
        of({
          variantId: 1,
          userId: 1,
          boardType: BoardType.HEXAGONAL,
          boardSize: 5,
          pieceRanks: false,
        }),
    };
    await TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [
        { provide: GameService, useValue: mockGameService },
        { provide: UserService, useValue: mockUserService },
        { provide: VariantService, useValue: mockVariantService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GameShowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
