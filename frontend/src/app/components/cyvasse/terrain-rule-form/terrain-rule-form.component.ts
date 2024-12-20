import { Component, OnInit } from "@angular/core";
import {
  PIECES_EFFECTED_TYPE_OPTIONS,
  TERRAIN_TYPE_OPTIONS,
} from "src/app/models/terrain-rule";
import { PIECE_TYPE_OPTIONS } from "src/app/models/piece-rule";
import { UntypedFormControl } from "@angular/forms";
import {
  ITerrainRuleOptions,
  ITerrainRule,
  ITerrainRuleValidationErrors,
  PiecesEffectedType,
} from "../../../shared/dtos/cyvasse/terrain_rule";
import {
  doesHaveValue,
  valueOrDefault,
} from "../../../shared/utilities/value_checker";
import { Observable } from "rxjs";
import { ActivatedRoute, Router } from "@angular/router";
import { TerrainRuleService } from "src/app/services/cyvasse/terrain-rule.service";
import { setError } from "src/app/utils/form-control-helpers";

export interface ITerrainEffect {
  label: string;
  key: string;
}

export const TERRAIN_EFFECTS: ITerrainEffect[] = [
  { label: "Passable movement", key: "passableMovement" },
  { label: "Passable range", key: "passableRange" },
  { label: "Slows movement", key: "slowsMovement" },
  { label: "Stops movement", key: "stopsMovement" },
];

interface ITerrainEffectFormControls {
  for: UntypedFormControl;
  pieceTypeIds: UntypedFormControl;
}

interface ITerrainEffectByFormControls extends ITerrainEffectFormControls {
  by: UntypedFormControl;
}

interface ITerrainRuleFormControls {
  terrainTypeId: UntypedFormControl;
  count: UntypedFormControl;
  passableMovement: ITerrainEffectFormControls;
  passableRange: ITerrainEffectFormControls;
  slowsMovement: ITerrainEffectByFormControls;
  stopsMovement: ITerrainEffectFormControls;
}

@Component({
  selector: "app-terrain-rule-form",
  templateUrl: "./terrain-rule-form.component.html",
  styleUrls: ["./terrain-rule-form.component.scss"],
})
export class TerrainRuleFormComponent implements OnInit {
  loading = false;
  terrainTypeOptions = TERRAIN_TYPE_OPTIONS;
  terrainEffects = TERRAIN_EFFECTS;
  piecesEffectedTypeOptions = PIECES_EFFECTED_TYPE_OPTIONS;
  pieceTypeOptions = PIECE_TYPE_OPTIONS;
  controls: ITerrainRuleFormControls = {
    terrainTypeId: new UntypedFormControl(),
    count: new UntypedFormControl(),
    passableMovement: {
      for: new UntypedFormControl(),
      pieceTypeIds: new UntypedFormControl(),
    },
    passableRange: {
      for: new UntypedFormControl(),
      pieceTypeIds: new UntypedFormControl(),
    },
    slowsMovement: {
      for: new UntypedFormControl(),
      pieceTypeIds: new UntypedFormControl(),
      by: new UntypedFormControl(),
    },
    stopsMovement: {
      for: new UntypedFormControl(),
      pieceTypeIds: new UntypedFormControl(),
    },
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly terrainRuleService: TerrainRuleService
  ) {}

  ngOnInit(): void {
    if (this.isUpdatingExistingTerrainRule()) {
      this.loading = true;
      this.terrainRuleService
        .get(this.getVariantId(), this.getTerrainRuleId())
        .subscribe((pieceRule) => {
          this.loading = false;
          this.controls.terrainTypeId.setValue(pieceRule.terrainTypeId);
          this.controls.count.setValue(pieceRule.count);
          this.controls.passableMovement.for.setValue(
            pieceRule.passableMovement.for
          );
          this.controls.passableMovement.pieceTypeIds.setValue(
            pieceRule.passableMovement.pieceTypeIds
          );
          this.controls.passableRange.for.setValue(pieceRule.passableRange.for);
          this.controls.passableRange.pieceTypeIds.setValue(
            pieceRule.passableRange.pieceTypeIds
          );
          this.controls.slowsMovement.for.setValue(pieceRule.slowsMovement.for);
          this.controls.slowsMovement.pieceTypeIds.setValue(
            pieceRule.slowsMovement.pieceTypeIds
          );
          this.controls.slowsMovement.by.setValue(pieceRule.slowsMovement.by);
          this.controls.stopsMovement.for.setValue(pieceRule.stopsMovement.for);
          this.controls.stopsMovement.pieceTypeIds.setValue(
            pieceRule.stopsMovement.pieceTypeIds
          );
        });
    }
  }

  isUpdatingExistingTerrainRule(): boolean {
    return doesHaveValue(this.getTerrainRuleId());
  }

  getVariantId(): number {
    return this.route.snapshot.params.variantId;
  }

  getTerrainRuleId(): number {
    return this.route.snapshot.params.terrainRuleId;
  }

  shouldShowPieceTypesInput(key: string): boolean {
    return [PiecesEffectedType.ALL_EXCEPT, PiecesEffectedType.ONLY].includes(
      this.controls[key].for.value
    );
  }

  doesEffectApplyToSomePieces(key: string): boolean {
    return [
      PiecesEffectedType.ALL,
      PiecesEffectedType.ALL_EXCEPT,
      PiecesEffectedType.ONLY,
    ].includes(this.controls[key].for.value);
  }

  save(request: ITerrainRuleOptions): Observable<ITerrainRule> {
    if (this.isUpdatingExistingTerrainRule()) {
      return this.terrainRuleService.update(
        this.getVariantId(),
        this.getTerrainRuleId(),
        request
      );
    }
    return this.terrainRuleService.create(this.getVariantId(), request);
  }

  buildRequest(): ITerrainRuleOptions {
    return {
      terrainTypeId: this.controls.terrainTypeId.value,
      count: this.controls.count.value,
      passableMovement: {
        for: this.controls.passableMovement.for.value,
        pieceTypeIds: valueOrDefault(
          this.controls.passableMovement.pieceTypeIds.value,
          []
        ),
      },
      passableRange: {
        for: this.controls.passableRange.for.value,
        pieceTypeIds: valueOrDefault(
          this.controls.passableRange.pieceTypeIds.value,
          []
        ),
      },
      slowsMovement: {
        for: this.controls.slowsMovement.for.value,
        pieceTypeIds: valueOrDefault(
          this.controls.slowsMovement.pieceTypeIds.value,
          []
        ),
        by: this.controls.slowsMovement.by.value,
      },
      stopsMovement: {
        for: this.controls.stopsMovement.for.value,
        pieceTypeIds: valueOrDefault(
          this.controls.stopsMovement.pieceTypeIds.value,
          []
        ),
      },
    };
  }

  submit(): void {
    this.loading = true;
    this.save(this.buildRequest()).subscribe(
      () => {
        this.goToVariant();
      },
      (errorResponse) => {
        if (errorResponse.status === 422) {
          const errors: ITerrainRuleValidationErrors = errorResponse.error;
          setError(this.controls.terrainTypeId, errors.terrainTypeId);
          setError(this.controls.count, errors.count);
          if (errors.passableMovement != null) {
            setError(
              this.controls.passableMovement.for,
              errors.passableMovement.for
            );
            setError(
              this.controls.passableMovement.pieceTypeIds,
              errors.passableMovement.pieceTypeIds
            );
          }
          if (errors.passableRange != null) {
            setError(this.controls.passableRange.for, errors.passableRange.for);
            setError(
              this.controls.passableRange.pieceTypeIds,
              errors.passableRange.pieceTypeIds
            );
          }
          if (errors.slowsMovement != null) {
            setError(this.controls.slowsMovement.for, errors.slowsMovement.for);
            setError(
              this.controls.slowsMovement.pieceTypeIds,
              errors.slowsMovement.pieceTypeIds
            );
            setError(this.controls.slowsMovement.by, errors.slowsMovement.by);
          }
          if (errors.stopsMovement != null) {
            setError(this.controls.stopsMovement.for, errors.stopsMovement.for);
            setError(
              this.controls.stopsMovement.pieceTypeIds,
              errors.stopsMovement.pieceTypeIds
            );
          }
        } else {
          // TODO better handling
          alert(errorResponse.error);
        }
        this.loading = false;
      }
    );
  }

  goToVariant(): void {
    this.router.navigate([`/cyvasse/variants/${this.getVariantId()}`]);
  }
}
