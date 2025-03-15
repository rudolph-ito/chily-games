import { ComponentFixture, TestBed } from "@angular/core/testing";

import { VariantShowComponent } from "./variant-show.component";
import { VariantService } from "src/app/services/cyvasse/variant.service";
import { AppModule } from "src/app/app.module";
import { of } from "rxjs";
import { BoardType } from "src/app/shared/dtos/cyvasse/variant";
import { PieceRuleService } from "src/app/services/cyvasse/piece-rule.service";
import {
  PieceType,
  PathType,
  CaptureType,
} from "src/app/shared/dtos/cyvasse/piece_rule";
import { TerrainRuleService } from "src/app/services/cyvasse/terrain-rule.service";
import {
  TerrainType,
  PiecesEffectedType,
} from "src/app/shared/dtos/cyvasse/terrain_rule";

describe("VariantShowComponent", () => {
  let component: VariantShowComponent;
  let fixture: ComponentFixture<VariantShowComponent>;
  let mockVariantService: Partial<VariantService>;
  let mockPieceRuleService: Partial<PieceRuleService>;
  let mockTerrainRuleService: Partial<TerrainRuleService>;

  beforeEach(() => {
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
    mockPieceRuleService = {
      getAllForVariant: () =>
        of([
          {
            pieceRuleId: 1,
            variantId: 1,
            pieceTypeId: PieceType.CATAPULT,
            count: 1,
            movement: {
              type: PathType.ORTHOGONAL_WITH_TURNS,
              minimum: 1,
              maximum: null,
            },
            captureType: CaptureType.MOVEMENT,
          },
        ]),
    };
    mockTerrainRuleService = {
      getAllForVariant: () =>
        of([
          {
            terrainRuleId: 1,
            variantId: 1,
            terrainTypeId: TerrainType.FOREST,
            count: 1,
            passableMovement: {
              for: PiecesEffectedType.ALL,
              pieceTypeIds: [],
            },
            passableRange: {
              for: PiecesEffectedType.ALL,
              pieceTypeIds: [],
            },
            slowsMovement: {
              for: PiecesEffectedType.NONE,
              pieceTypeIds: [],
            },
            stopsMovement: {
              for: PiecesEffectedType.NONE,
              pieceTypeIds: [],
            },
          },
        ]),
    };
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [
        { provide: VariantService, useValue: mockVariantService },
        { provide: PieceRuleService, useValue: mockPieceRuleService },
        { provide: TerrainRuleService, useValue: mockTerrainRuleService },
      ],
    });
    fixture = TestBed.createComponent(VariantShowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
