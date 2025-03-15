import { ComponentFixture, TestBed } from "@angular/core/testing";

import { CyvasseGameShowComponent } from "./cyvasse-game-show.component";
import { AppModule } from "src/app/app.module";
import { CyvasseGameService } from "src/app/services/cyvasse/cvasse-game.service";
import { of } from "rxjs";
import { Action } from "../../../shared/dtos/cyvasse/game";
import { UserService } from "src/app/services/user.service";
import { VariantService } from "src/app/services/cyvasse/variant.service";
import { BoardType } from "src/app/shared/dtos/cyvasse/variant";

describe("CyvasseGameShowComponent", () => {
  let component: CyvasseGameShowComponent;
  let fixture: ComponentFixture<CyvasseGameShowComponent>;
  let mockGameService: Partial<CyvasseGameService>;
  let mockUserService: Partial<UserService>;
  let mockVariantService: Partial<VariantService>;

  beforeEach(() => {
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
      getRules: () =>
        of({
          pieces: [],
          terrains: [],
          setupTerritories: {
            alabaster: [],
            neutral: [],
            onyx: [],
          },
        }),
    };
    mockUserService = {
      get: () => of({ userId: 1, username: "test", displayName: "test" }),
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
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [
        { provide: CyvasseGameService, useValue: mockGameService },
        { provide: UserService, useValue: mockUserService },
        { provide: VariantService, useValue: mockVariantService },
      ],
    });
    fixture = TestBed.createComponent(CyvasseGameShowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
