import { ComponentFixture, TestBed } from "@angular/core/testing";

import { VariantShowComponent } from "./variant-show.component";
import { VariantService } from "src/app/services/variant.service";
import { RouterTestingModule } from "@angular/router/testing";
import { AppModule } from "src/app/app.module";
import { of } from "rxjs";
import { BOARD_TYPE } from "src/app/shared/dtos/variant";

describe("VariantShowComponent", () => {
  let component: VariantShowComponent;
  let fixture: ComponentFixture<VariantShowComponent>;
  let mockVariantService: Partial<VariantService>;

  beforeEach(async () => {
    mockVariantService = {
      get: () =>
        of({
          variantId: 1,
          userId: 1,
          boardType: BOARD_TYPE.HEXAGONAL,
          boardSize: 5,
          pieceRanks: false
        })
    };
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, AppModule],
      providers: [{ provide: VariantService, useValue: mockVariantService }]
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
