import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { VariantService } from "../../services/variant.service";
import { IVariant } from "../../shared/dtos/variant";
import { getBoardDescription } from "../../formatters/variant.formatter";
import { MatTableDataSource } from "@angular/material/table";
import { Observable, of, forkJoin } from "rxjs";
import { AuthenticationService } from "../../services/authentication.service";
import { doesHaveValue } from "../../shared/utilities/value_checker";
import { map } from "rxjs/operators";
import { IPieceRule } from "src/app/shared/dtos/piece_rule";
import { PieceRuleService } from "../../services/piece-rule.service";
import {
  getPathConfigurationDescription,
  getPieceTypeDescription,
  getCaptureTypeDescription,
} from "src/app/formatters/piece-rule.formatter";

export interface IField {
  label: string;
  value: string;
}

@Component({
  selector: "app-variant-show",
  templateUrl: "./variant-show.component.html",
  styleUrls: ["./variant-show.component.styl"],
})
export class VariantShowComponent implements OnInit {
  // formatters
  getPathConfigurationDescription = getPathConfigurationDescription;
  getPieceTypeDescription = getPieceTypeDescription;
  getCaptureTypeDescription = getCaptureTypeDescription;

  // state
  loading = false;
  variant: IVariant;
  fieldsDataSource = new MatTableDataSource<IField>([]);
  pieceRulesDisplayedColumns: string[] = [
    "pieceType",
    "count",
    "movementDescription",
    "captureDescription",
    "actions",
  ];

  pieceRulesDataSource = new MatTableDataSource<IPieceRule>([]);
  isLoggedInUserCreatorObservable: Observable<boolean> = of(false);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly variantService: VariantService,
    private readonly authenticationService: AuthenticationService,
    private readonly pieceRuleService: PieceRuleService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    forkJoin({
      variant: this.variantService.get(this.getVariantId()),
      pieceRules: this.pieceRuleService.getAllForVariant(this.getVariantId()),
    }).subscribe(({ pieceRules, variant }) => {
      this.loading = false;
      this.variant = variant;
      this.pieceRulesDataSource.data = pieceRules;
      this.updateFields();
      this.isLoggedInUserCreatorObservable = this.authenticationService
        .getUserSubject()
        .pipe(map((x) => doesHaveValue(x) && x.userId === this.variant.userId));
    });
  }

  getVariantId(): number {
    return this.route.snapshot.params.variantId;
  }

  updateFields(): void {
    this.fieldsDataSource.data = [
      {
        label: "Variant ID",
        value: this.variant.variantId.toString(),
      },
      {
        label: "Board Description",
        value: getBoardDescription(this.variant),
      },
    ];
  }
}
