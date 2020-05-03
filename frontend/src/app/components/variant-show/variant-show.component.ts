import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { VariantService } from "../../services/variant.service";
import { IVariant } from "../../shared/dtos/variant";
import { getBoardDescription } from "../../formatters/variant.formatter";
import { MatTableDataSource } from "@angular/material/table";
import { Observable, of } from "rxjs";
import { AuthenticationService } from "../../services/authentication.service";
import { doesHaveValue } from "../../shared/utilities/value_checker";
import { map } from "rxjs/operators";

export interface IField {
  label: string;
  value: string;
}

@Component({
  selector: "app-variant-show",
  templateUrl: "./variant-show.component.html",
  styleUrls: ["./variant-show.component.styl"]
})
export class VariantShowComponent implements OnInit {
  loading = false;
  variant: IVariant;
  fieldsDataSource = new MatTableDataSource<IField>([]);
  isLoggedInUserCreatorObservable: Observable<boolean> = of(false);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly variantService: VariantService,
    private readonly authenticationService: AuthenticationService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.variantService.get(this.getVariantId()).subscribe(variant => {
      this.loading = false;
      this.variant = variant;
      this.updateFields();
      this.isLoggedInUserCreatorObservable = this.authenticationService
        .getUserSubject()
        .pipe(map(x => doesHaveValue(x) && x.userId === this.variant.userId));
    });
  }

  getVariantId(): number {
    return this.route.snapshot.params.id;
  }

  updateFields(): void {
    this.fieldsDataSource.data = [
      {
        label: "Variant ID",
        value: this.variant.variantId.toString()
      },
      {
        label: "Board Description",
        value: getBoardDescription(this.variant)
      }
    ];
  }
}
