import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { VariantService } from "../../../services/cyvasse/variant.service";
import { IVariant } from "../../../shared/dtos/variant";
import { getBoardDescription } from "../../../formatters/variant.formatter";
import { MatTableDataSource } from "@angular/material/table";
import { Observable, of, forkJoin } from "rxjs";
import { AuthenticationService } from "../../../services/authentication.service";
import { doesHaveValue } from "../../../shared/utilities/value_checker";
import { map } from "rxjs/operators";
import { IPieceRule, CaptureType } from "src/app/shared/dtos/piece_rule";
import { PieceRuleService } from "../../../services/cyvasse/piece-rule.service";
import {
  getPathConfigurationDescription,
  getPieceTypeDescription,
  getCaptureTypeDescription,
} from "src/app/formatters/piece-rule.formatter";
import { TerrainRuleService } from "src/app/services/cyvasse/terrain-rule.service";
import { ITerrainRule } from "src/app/shared/dtos/terrain_rule";
import {
  getPiecesEffectedDescription,
  getSlowsMovementDescription,
  getTerrainTypeDescription,
} from "src/app/formatters/terrain-rule.formatter";

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
  getPiecesEffectedDescription = getPiecesEffectedDescription;
  getSlowsMovementDescription = getSlowsMovementDescription;
  getTerrainTypeDescription = getTerrainTypeDescription;

  // state
  loading = false;
  variant: IVariant;
  fieldsDataSource = new MatTableDataSource<IField>([]);
  pieceRulesDisplayedColumns: string[] = [
    "pieceType",
    "count",
    "movementDescription",
    "captureDescription",
    "rangeDescription",
    "moveAndRangeCapture",
    "actions",
  ];

  terrainRulesDisplayedColumns: string[] = [
    "terrainType",
    "count",
    "passableMovementDescription",
    "passableRangeDescription",
    "slowsMovementDescription",
    "stopsMovementDescription",
    "actions",
  ];

  pieceRulesDataSource = new MatTableDataSource<IPieceRule>([]);
  terrainRulesDataSource = new MatTableDataSource<ITerrainRule>([]);
  isLoggedInUserCreatorObservable: Observable<boolean> = of(false);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly variantService: VariantService,
    private readonly authenticationService: AuthenticationService,
    private readonly pieceRuleService: PieceRuleService,
    private readonly terrainRuleService: TerrainRuleService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    forkJoin({
      variant: this.variantService.get(this.getVariantId()),
      pieceRules: this.pieceRuleService.getAllForVariant(this.getVariantId()),
      terrainRules: this.terrainRuleService.getAllForVariant(
        this.getVariantId()
      ),
    }).subscribe(({ pieceRules, terrainRules, variant }) => {
      this.loading = false;
      this.variant = variant;
      this.pieceRulesDataSource.data = pieceRules;
      this.terrainRulesDataSource.data = terrainRules;
      this.updateFields();
      this.isLoggedInUserCreatorObservable = this.authenticationService
        .getUserSubject()
        .pipe(map((x) => doesHaveValue(x) && x.userId === this.variant.userId));
    });
  }

  getVariantId(): number {
    return this.route.snapshot.params.variantId;
  }

  isPieceRuleCaptureTypeRange(pieceRule: IPieceRule): boolean {
    return pieceRule.captureType === CaptureType.RANGE;
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
