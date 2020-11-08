import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import {
  IPieceRuleOptions,
  IPieceRule,
  IPieceRuleValidationErrors,
  CaptureType,
} from "src/app/shared/dtos/cyvasse/piece_rule";
import { ISelectOption } from "src/app/models/form";
import { FormControl } from "@angular/forms";
import { Observable } from "rxjs";
import { PieceRuleService } from "src/app/services/cyvasse/piece-rule.service";
import { ActivatedRoute, Router } from "@angular/router";
import {
  doesHaveValue,
  doesNotHaveValue,
} from "../../../shared/utilities/value_checker";
import { setError } from "src/app/utils/form-control-helpers";
import {
  PIECE_TYPE_OPTIONS,
  PATH_TYPE_OPTIONS,
  CAPTURE_TYPE_OPTIONS,
} from "src/app/models/piece-rule";
import { VariantService } from "src/app/services/cyvasse/variant.service";
import { BaseBoard } from "src/app/game/board/base_board";
import { PlayerColor } from "src/app/shared/dtos/cyvasse/game";
import { buildBoard } from "src/app/game/board/board_builder";

interface IPieceRuleFormControls {
  pieceTypeId: FormControl;
  count: FormControl;
  movementType: FormControl;
  movementMinimum: FormControl;
  movementMaximum: FormControl;
  captureType: FormControl;
  rangeType: FormControl;
  rangeMinimum: FormControl;
  rangeMaximum: FormControl;
  moveAndRangeCapture: FormControl;
}

interface IPieceRuleBoardPreviewControls {
  evaluationType: FormControl;
}

@Component({
  selector: "app-piece-rule-form",
  templateUrl: "./piece-rule-form.component.html",
  styleUrls: ["./piece-rule-form.component.styl"],
})
export class PieceRuleFormComponent implements OnInit {
  loading = false;
  pieceTypeOptions: ISelectOption[] = PIECE_TYPE_OPTIONS;
  pathTypeOptions: ISelectOption[] = PATH_TYPE_OPTIONS;
  captureTypeOptions: ISelectOption[] = CAPTURE_TYPE_OPTIONS;
  controls: IPieceRuleFormControls = {
    pieceTypeId: new FormControl(),
    count: new FormControl(),
    movementType: new FormControl(),
    movementMinimum: new FormControl(),
    movementMaximum: new FormControl(),
    captureType: new FormControl(),
    rangeType: new FormControl(),
    rangeMinimum: new FormControl(),
    rangeMaximum: new FormControl(),
    moveAndRangeCapture: new FormControl(),
  };

  boardPreviewControls: IPieceRuleBoardPreviewControls = {
    evaluationType: new FormControl(CaptureType.MOVEMENT),
  };

  generalError: string;
  board: BaseBoard;

  @ViewChild("boardContainer") boardContainer: ElementRef;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly pieceRuleService: PieceRuleService,
    private readonly variantService: VariantService
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
          this.controls.rangeType.setValue(pieceRule.range.type);
          this.controls.rangeMinimum.setValue(pieceRule.range.minimum);
          this.controls.rangeMaximum.setValue(pieceRule.range.maximum);
          this.controls.moveAndRangeCapture.setValue(
            pieceRule.moveAndRangeCapture
          );
        });
    }
  }

  ngAfterViewInit(): void {
    const formControlsTriggeringPreviewUpdate: FormControl[] = [
      this.controls.pieceTypeId,
      this.controls.movementType,
      this.controls.movementMinimum,
      this.controls.movementMaximum,
      this.controls.rangeType,
      this.controls.rangeMinimum,
      this.controls.rangeMaximum,
      this.boardPreviewControls.evaluationType,
    ];
    formControlsTriggeringPreviewUpdate.forEach((formControl) => {
      formControl.valueChanges.subscribe(this.drawPreview.bind(this));
    });
    this.variantService.get(this.getVariantId()).subscribe((variant) => {
      this.board = buildBoard({
        element: this.boardContainer.nativeElement,
        color: PlayerColor.ONYX,
        variant,
      });
      this.board.addSpaces(false);
      this.drawPreview();
    });
  }

  drawPreview(): void {
    if (doesNotHaveValue(this.board)) {
      return;
    }
    this.board.clearPieces();
    this.board.clearHighlight();
    const request = this.buildRequest();
    if (
      doesNotHaveValue(request.pieceTypeId) ||
      doesNotHaveValue(request.movement.type) ||
      doesNotHaveValue(request.movement.minimum)
    ) {
      return;
    }
    let evaluationType = CaptureType.MOVEMENT;
    if (this.controls.captureType.value === CaptureType.RANGE) {
      evaluationType = this.boardPreviewControls.evaluationType.value;
    }
    this.variantService
      .previewPieceRule(this.getVariantId(), evaluationType, request)
      .subscribe((result) => {
        this.board.addPieceAtCoordinate(
          {
            pieceTypeId: request.pieceTypeId,
            playerColor: PlayerColor.ALABASTER,
          },
          result.origin
        );
        this.board.highlightValidPlies({
          origin: result.origin,
          evaluationType,
          validPlies: result.validPlies,
        });
      });
  }

  isUpdatingExistingPieceRule(): boolean {
    return doesHaveValue(this.getPieceRuleId());
  }

  isCaptureTypeRange(): boolean {
    return this.controls.captureType.value === CaptureType.RANGE;
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

  buildRequest(): IPieceRuleOptions {
    return {
      pieceTypeId: this.controls.pieceTypeId.value,
      count: this.controls.count.value,
      movement: {
        type: this.controls.movementType.value,
        minimum: this.controls.movementMinimum.value,
        maximum: this.controls.movementMaximum.value,
      },
      captureType: this.controls.captureType.value,
      range: {
        type: this.controls.rangeType.value,
        minimum: this.controls.rangeMinimum.value,
        maximum: this.controls.rangeMaximum.value,
      },
      moveAndRangeCapture: this.controls.moveAndRangeCapture.value,
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
          const errors: IPieceRuleValidationErrors = errorResponse.error;
          setError(this.controls.pieceTypeId, errors.pieceTypeId);
          setError(this.controls.count, errors.count);
          if (doesHaveValue(errors.movement)) {
            setError(this.controls.movementType, errors.movement.type);
            setError(this.controls.movementMinimum, errors.movement.minimum);
            setError(this.controls.movementMaximum, errors.movement.maximum);
          }
          setError(this.controls.captureType, errors.captureType);
          if (doesHaveValue(errors.range)) {
            setError(this.controls.rangeType, errors.range.type);
            setError(this.controls.rangeMinimum, errors.range.minimum);
            setError(this.controls.rangeMaximum, errors.range.maximum);
          }
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
    this.router.navigate([`/cyvasse/variants/${this.getVariantId()}`]); // eslint-disable-line @typescript-eslint/no-floating-promises
  }
}
