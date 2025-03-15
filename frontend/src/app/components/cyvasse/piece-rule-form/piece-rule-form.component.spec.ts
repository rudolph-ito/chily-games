import { ComponentFixture, TestBed } from "@angular/core/testing";

import { PieceRuleFormComponent } from "./piece-rule-form.component";
import { AppModule } from "src/app/app.module";
import { VariantService } from "src/app/services/cyvasse/variant.service";
import { BoardType } from "src/app/shared/dtos/cyvasse/variant";
import { of } from "rxjs";

describe("PieceRuleFormComponent", () => {
  let component: PieceRuleFormComponent;
  let fixture: ComponentFixture<PieceRuleFormComponent>;
  let mockVariantService: Partial<VariantService>;

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
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [{ provide: VariantService, useValue: mockVariantService }],
    });
    fixture = TestBed.createComponent(PieceRuleFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
