import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from "@angular/core";
import {
  IVariantOptions,
  IVariantValidationErrors,
  IVariant,
  BoardType,
  SupportType,
} from "../../../shared/dtos/cyvasse/variant";
import { UntypedFormControl } from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { VariantService } from "src/app/services/cyvasse/variant.service";
import { setError } from "src/app/utils/form-control-helpers";
import { doesHaveValue } from "../../../shared/utilities/value_checker";
import { Observable } from "rxjs";
import { BaseBoard } from "src/app/game/board/base_board";
import { buildBoard } from "src/app/game/board/board_builder";
import { ISelectOption } from "src/app/models/form";
import { PlayerColor } from "../../../shared/dtos/cyvasse/game";

const BOARD_TYPE_OPTIONS: ISelectOption[] = [
  { label: "Hexagonal", value: BoardType.HEXAGONAL },
  { label: "Square", value: BoardType.SQUARE },
];

const SUPPORT_TYPE_OPTIONS: ISelectOption[] = [
  { label: "None", value: SupportType.NONE },
  { label: "Binary", value: SupportType.BINARY },
  { label: "Sum", value: SupportType.SUM },
];

interface IVariantFormControls {
  boardType: UntypedFormControl;
  boardSize: UntypedFormControl;
  boardRows: UntypedFormControl;
  boardColumns: UntypedFormControl;
  pieceRanks: UntypedFormControl;
  supportType: UntypedFormControl;
}

interface IVariantBoardPreviewControls {
  showCoordinates: UntypedFormControl;
  viewpoint: UntypedFormControl;
}

@Component({
  selector: "app-variant-form",
  templateUrl: "./variant-form.component.html",
  styleUrls: ["./variant-form.component.scss"],
})
export class VariantFormComponent implements OnInit, AfterViewInit {
  loading = false;
  generalError?: string;
  boardTypeOptions = BOARD_TYPE_OPTIONS;
  supportTypeOptions = SUPPORT_TYPE_OPTIONS;
  controls: IVariantFormControls = {
    boardType: new UntypedFormControl(),
    boardSize: new UntypedFormControl(6),
    boardColumns: new UntypedFormControl(8),
    boardRows: new UntypedFormControl(8),
    pieceRanks: new UntypedFormControl(false),
    supportType: new UntypedFormControl(),
  };

  boardPreviewControls: IVariantBoardPreviewControls = {
    showCoordinates: new UntypedFormControl(false),
    viewpoint: new UntypedFormControl(PlayerColor.ALABASTER),
  };

  board: BaseBoard | null;

  @ViewChild("boardContainer") boardContainer: ElementRef;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly variantService: VariantService
  ) {}

  ngOnInit(): void {
    if (this.isUpdatingExistingVariant()) {
      this.loading = true;
      this.variantService.get(this.getVariantId()).subscribe((variant) => {
        this.loading = false;
        this.controls.boardType.setValue(variant.boardType);
        this.controls.boardSize.setValue(variant.boardSize);
        this.controls.boardRows.setValue(variant.boardRows);
        this.controls.boardColumns.setValue(variant.boardColumns);
        this.controls.pieceRanks.setValue(variant.pieceRanks);
        this.controls.supportType.setValue(variant.supportType);
      });
    }
  }

  ngAfterViewInit(): void {
    this.controls.boardType.valueChanges.subscribe(this.drawPreview.bind(this));
    this.controls.boardColumns.valueChanges.subscribe(
      this.drawPreview.bind(this)
    );
    this.controls.boardRows.valueChanges.subscribe(this.drawPreview.bind(this));
    this.controls.boardSize.valueChanges.subscribe(this.drawPreview.bind(this));
    this.boardPreviewControls.showCoordinates.valueChanges.subscribe(
      this.drawPreview.bind(this)
    );
    this.boardPreviewControls.viewpoint.valueChanges.subscribe(
      this.drawPreview.bind(this)
    );
    this.drawPreview();
  }

  drawPreview(): void {
    if (this.board != null) {
      this.board.destroy();
      this.board = null;
    }
    if (this.isBoardTypeHexagonal() || this.isBoardTypeSquare()) {
      const color = this.boardPreviewControls.viewpoint.value;
      this.board = buildBoard({
        element: this.boardContainer.nativeElement,
        color,
        variant: {
          boardType: this.controls.boardType.value,
          boardSize: this.controls.boardSize.value,
          boardColumns: this.controls.boardColumns.value,
          boardRows: this.controls.boardRows.value,
          pieceRanks: this.controls.pieceRanks.value,
        },
      });
    }
    if (this.board != null) {
      this.board.addSpaces(this.boardPreviewControls.showCoordinates.value);
    }
  }

  isUpdatingExistingVariant(): boolean {
    return doesHaveValue(this.getVariantId());
  }

  getVariantId(): number {
    return this.route.snapshot.params.variantId;
  }

  isBoardTypeHexagonal(): boolean {
    return this.controls.boardType.value === BoardType.HEXAGONAL;
  }

  isBoardTypeSquare(): boolean {
    return this.controls.boardType.value === BoardType.SQUARE;
  }

  hasPieceRanks(): boolean {
    return this.controls.pieceRanks.value === true;
  }

  isBoardPreviewShowingCoordinates(): boolean {
    return this.boardPreviewControls.showCoordinates.value === true;
  }

  goBack(): void {
    if (this.isUpdatingExistingVariant()) {
      this.router.navigate([`/cyvasse/variants/${this.getVariantId()}`]);
    } else {
      this.router.navigate(["/cyvasse/variants"]);
    }
  }

  save(request: IVariantOptions): Observable<IVariant> {
    if (this.isUpdatingExistingVariant()) {
      return this.variantService.update(this.getVariantId(), request);
    }
    return this.variantService.create(request);
  }

  submit(): void {
    const request: IVariantOptions = {
      boardType: this.controls.boardType.value,
      boardSize: this.controls.boardSize.value,
      boardColumns: this.controls.boardColumns.value,
      boardRows: this.controls.boardRows.value,
      pieceRanks: this.controls.pieceRanks.value,
      supportType: this.controls.supportType.value,
    };
    this.loading = true;
    this.save(request).subscribe(
      () => {
        this.goBack();
      },
      (errorResponse) => {
        if (errorResponse.status === 422) {
          const errors: IVariantValidationErrors = errorResponse.error;
          setError(this.controls.boardType, errors.boardType);
          setError(this.controls.boardSize, errors.boardSize);
          setError(this.controls.boardRows, errors.boardRows);
          setError(this.controls.boardColumns, errors.boardColumns);
          setError(this.controls.pieceRanks, errors.pieceRanks);
          setError(this.controls.supportType, errors.supportType);
          this.generalError = errors.general;
        } else {
          // TODO better handling
          alert(errorResponse.error);
        }
        this.loading = false;
      }
    );
  }
}
