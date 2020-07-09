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
} from "../../shared/dtos/variant";
import { FormControl } from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { VariantService } from "src/app/services/variant.service";
import { setError } from "src/app/utils/form-control-helpers";
import { doesHaveValue } from "../../shared/utilities/value_checker";
import { Observable } from "rxjs";
import { BaseBoard } from "src/app/game/board/base_board";
import { buildBoard } from "src/app/game/board/board_builder";
import { ISelectOption } from "src/app/models/form";
import { PlayerColor } from "../../shared/dtos/game";

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
  boardType: FormControl;
  boardSize: FormControl;
  boardRows: FormControl;
  boardColumns: FormControl;
  pieceRanks: FormControl;
  supportType: FormControl;
}

interface IVariantBoardPreviewControls {
  showCoordinates: FormControl;
  viewpoint: FormControl;
}

@Component({
  selector: "app-variant-form",
  templateUrl: "./variant-form.component.html",
  styleUrls: ["./variant-form.component.styl"],
})
export class VariantFormComponent implements OnInit, AfterViewInit {
  loading = false;
  generalError: string = null;
  boardTypeOptions = BOARD_TYPE_OPTIONS;
  supportTypeOptions = SUPPORT_TYPE_OPTIONS;
  controls: IVariantFormControls = {
    boardType: new FormControl(),
    boardSize: new FormControl(6),
    boardColumns: new FormControl(8),
    boardRows: new FormControl(8),
    pieceRanks: new FormControl(false),
    supportType: new FormControl(),
  };

  boardPreviewControls: IVariantBoardPreviewControls = {
    showCoordinates: new FormControl(false),
    viewpoint: new FormControl(PlayerColor.ALABASTER),
  };

  board: BaseBoard;

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
    if (doesHaveValue(this.board)) {
      this.board.destroy();
      this.board = null;
    }
    if (this.isBoardTypeHexagonal() || this.isBoardTypeSquare()) {
      const color = this.boardPreviewControls.viewpoint.value;
      this.board = buildBoard(this.boardContainer.nativeElement, color, {
        boardType: this.controls.boardType.value,
        boardSize: this.controls.boardSize.value,
        boardColumns: this.controls.boardColumns.value,
        boardRows: this.controls.boardRows.value,
        pieceRanks: this.controls.pieceRanks.value,
      });
    }
    if (doesHaveValue(this.board)) {
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
      this.router.navigate([`variants/${this.getVariantId()}`]); // eslint-disable-line @typescript-eslint/no-floating-promises
    } else {
      this.router.navigate(["variants"]); // eslint-disable-line @typescript-eslint/no-floating-promises
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
