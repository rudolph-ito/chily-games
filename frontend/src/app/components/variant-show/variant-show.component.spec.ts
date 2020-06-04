import { ComponentFixture, TestBed } from "@angular/core/testing";

import { VariantShowComponent } from "./variant-show.component";
import { VariantService } from "src/app/services/variant.service";
import { RouterTestingModule } from "@angular/router/testing";
import { AppModule } from "src/app/app.module";
import { of } from "rxjs";
import { BoardType } from "src/app/shared/dtos/variant";
import { PieceRuleService } from "src/app/services/piece-rule.service";
import {
  PieceType,
  PathType,
  CaptureType,
} from "src/app/shared/dtos/piece_rule";

describe("VariantShowComponent", () => {
  let component: VariantShowComponent;
  let fixture: ComponentFixture<VariantShowComponent>;
  let mockVariantService: Partial<VariantService>;
  let mockPieceRuleService: Partial<PieceRuleService>;

  beforeEach(async () => {
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
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, AppModule],
      providers: [
        { provide: VariantService, useValue: mockVariantService },
        { provide: PieceRuleService, useValue: mockPieceRuleService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VariantShowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
