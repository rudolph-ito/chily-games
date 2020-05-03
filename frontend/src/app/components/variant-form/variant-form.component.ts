import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit
} from "@angular/core";
import {
  BOARD_TYPE,
  SUPPORT_TYPE,
  IVariantOptions,
  IVariantValidationErrors,
  IVariant
} from "../../shared/dtos/variant";
import { FormControl } from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { VariantService } from "src/app/services/variant.service";
import { setError } from "src/app/utils/form-control-helpers";
import { doesHaveValue } from "../../shared/utilities/value_checker";
import { Observable } from "rxjs";
import { BaseBoard, PlayerColor } from "src/app/game/board/base_board";
import { SquareBoard } from "src/app/game/board/square_board";
import { HexagonalBoard } from "src/app/game/board/hexagonal_board";

interface IBoardTypeOption {
  name: string;
  value: BOARD_TYPE;
}

const BOARD_TYPE_OPTIONS: IBoardTypeOption[] = [
  { name: "Hexagonal", value: BOARD_TYPE.HEXAGONAL },
  { name: "Square", value: BOARD_TYPE.SQUARE }
];

interface ISupportTypeOption {
  name: string;
  value: SUPPORT_TYPE;
}

const SUPPORT_TYPE_OPTIONS: ISupportTypeOption[] = [
  { name: "None", value: SUPPORT_TYPE.NONE },
  { name: "Binary", value: SUPPORT_TYPE.BINARY },
  { name: "Sum", value: SUPPORT_TYPE.SUM }
];

interface IVariantFormControls {
  boardType: FormControl;
  boardSize: FormControl;
  boardRows: FormControl;
  boardColumns: FormControl;
  pieceRanks: FormControl;
  supportType: FormControl;
}

@Component({
  selector: "app-variant-form",
  templateUrl: "./variant-form.component.html",
  styleUrls: ["./variant-form.component.styl"]
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
    supportType: new FormControl()
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
      this.variantService
        .get(this.route.snapshot.params.id)
        .subscribe(variant => {
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
    this.drawPreview();
  }

  drawPreview(): void {
    if (doesHaveValue(this.board)) {
      this.board.clear();
      this.board = null;
    }
    if (this.isBoardTypeSquare()) {
      this.board = new SquareBoard(this.boardContainer.nativeElement, {
        layout: {
          boardColumns: this.controls.boardColumns.value,
          boardRows: this.controls.boardRows.value
        },
        color: PlayerColor.ONYX
      });
      this.board.draw();
    }
    if (this.isBoardTypeHexagonal()) {
      this.board = new HexagonalBoard(this.boardContainer.nativeElement, {
        layout: {
          boardSize: this.controls.boardSize.value
        },
        color: PlayerColor.ONYX
      });
      this.board.draw();
    }
  }

  isUpdatingExistingVariant(): boolean {
    return doesHaveValue(this.getVariantId());
  }

  getVariantId(): number {
    return this.route.snapshot.params.id;
  }

  isBoardTypeHexagonal(): boolean {
    return this.controls.boardType.value === BOARD_TYPE.HEXAGONAL;
  }

  isBoardTypeSquare(): boolean {
    return this.controls.boardType.value === BOARD_TYPE.SQUARE;
  }

  hasPieceRanks(): boolean {
    return this.controls.pieceRanks.value === true;
  }

  goToVariants(): void {
    this.router.navigate(["variants"]); // eslint-disable-line @typescript-eslint/no-floating-promises
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
      supportType: this.controls.supportType.value
    };
    this.loading = true;
    this.save(request).subscribe(
      () => {
        this.goToVariants();
      },
      errorResponse => {
        if (errorResponse.status === 424) {
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
