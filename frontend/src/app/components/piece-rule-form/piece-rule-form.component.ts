import { Component, OnInit } from "@angular/core";
import {
  IPieceRuleOptions,
  IPieceRule,
  IPieceRuleValidationErrors,
} from "src/app/shared/dtos/piece_rule";
import { ISelectOption } from "src/app/models/form";
import { FormControl } from "@angular/forms";
import { Observable } from "rxjs";
import { PieceRuleService } from "src/app/services/piece-rule.service";
import { ActivatedRoute, Router } from "@angular/router";
import { doesHaveValue } from "../../shared/utilities/value_checker";
import { setError } from "src/app/utils/form-control-helpers";
import {
  PIECE_TYPE_OPTIONS,
  PATH_TYPE_OPTIONS,
  CAPTURE_TYPE_OPTIONS,
} from "src/app/models/piece-rule";

interface IPieceRuleFormControls {
  pieceTypeId: FormControl;
  count: FormControl;
  movementType: FormControl;
  movementMinimum: FormControl;
  movementMaximum: FormControl;
  captureType: FormControl;
}

@Component({
  selector: "app-piece-rule-form",
  templateUrl: "./piece-rule-form.component.html",
  styleUrls: ["./piece-rule-form.component.styl"],
})
export class PieceRuleFormComponent implements OnInit {
  loading = false;
  pieceTypeOptions: ISelectOption[] = PIECE_TYPE_OPTIONS;
  movementTypeOptions: ISelectOption[] = PATH_TYPE_OPTIONS;
  captureTypeOptions: ISelectOption[] = CAPTURE_TYPE_OPTIONS;
  controls: IPieceRuleFormControls = {
    pieceTypeId: new FormControl(),
    count: new FormControl(),
    movementType: new FormControl(),
    movementMinimum: new FormControl(),
    movementMaximum: new FormControl(),
    captureType: new FormControl(),
  };

  generalError: string;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly pieceRuleService: PieceRuleService
  ) {}

  ngOnInit(): void {
    if (this.isUpdatingExistingPieceRule()) {
      this.loading = true;
      this.pieceRuleService
        .get(this.getVariantId(), this.getPieceRuleId())
        .subscribe((pieceRule) => {
          this.loading = false;
          this.controls.pieceTypeId.setValue(pieceRule.pieceTypeId);
          this.controls.count.setValue(pieceRule.count);
          this.controls.movementType.setValue(pieceRule.movement.type);
          this.controls.movementMinimum.setValue(pieceRule.movement.minimum);
          this.controls.movementMaximum.setValue(pieceRule.movement.maximum);
          this.controls.captureType.setValue(pieceRule.captureType);
        });
    }
  }

  isUpdatingExistingPieceRule(): boolean {
    return doesHaveValue(this.getPieceRuleId());
  }

  getVariantId(): number {
    return this.route.snapshot.params.variantId;
  }

  getPieceRuleId(): number {
    return this.route.snapshot.params.pieceRuleId;
  }

  save(request: IPieceRuleOptions): Observable<IPieceRule> {
    if (this.isUpdatingExistingPieceRule()) {
      return this.pieceRuleService.update(
        this.getVariantId(),
        this.getPieceRuleId(),
        request
      );
    }
    return this.pieceRuleService.create(this.getVariantId(), request);
  }

  submit(): void {
    const request: IPieceRuleOptions = {
      pieceTypeId: this.controls.pieceTypeId.value,
      count: this.controls.count.value,
      movement: {
        type: this.controls.movementType.value,
        minimum: this.controls.movementMinimum.value,
        maximum: this.controls.movementMaximum.value,
      },
      captureType: this.controls.captureType.value,
    };
    this.loading = true;
    this.save(request).subscribe(
      () => {
        this.goToVariant();
      },
      (errorResponse) => {
        if (errorResponse.status === 422) {
          const errors: IPieceRuleValidationErrors = errorResponse.error;
          setError(this.controls.pieceTypeId, errors.pieceTypeId);
          setError(this.controls.count, errors.count);
          if (doesHaveValue(errors.movement)) {
            setError(this.controls.movementType, errors.movement.type);
            setError(this.controls.movementMinimum, errors.movement.minimum);
            setError(this.controls.movementMaximum, errors.movement.maximum);
          }
          setError(this.controls.captureType, errors.captureType);
          this.generalError = errors.general;
        } else {
          // TODO better handling
          alert(errorResponse.error);
        }
        this.loading = false;
      }
    );
  }

  goToVariant(): void {
    this.router.navigate([`variants/${this.getVariantId()}`]); // eslint-disable-line @typescript-eslint/no-floating-promises
  }
}
