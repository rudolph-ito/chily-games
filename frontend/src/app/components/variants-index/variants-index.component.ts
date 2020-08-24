import { Component, OnInit } from "@angular/core";
import { VariantService } from "../../services/variant.service";
import { IVariant } from "../../shared/dtos/variant";
import { MatTableDataSource } from "@angular/material/table";
import { AuthenticationService } from "../../services/authentication.service";
import { doesHaveValue } from "../../shared/utilities/value_checker";
import { Observable, of } from "rxjs";
import { getBoardDescription } from "../../formatters/variant.formatter";
import { map } from "rxjs/operators";
import { ChallengeService } from "src/app/services/challenge.service";
import { ChallengePlayAs } from "src/app/shared/dtos/challenge";
import { MatSnackBar } from "@angular/material/snack-bar";

@Component({
  selector: "app-variants-index",
  templateUrl: "./variants-index.component.html",
  styleUrls: ["./variants-index.component.styl"],
})
export class VariantsIndexComponent implements OnInit {
  loading: boolean;
  pageIndex: number;
  pageSize: number = 100;
  variantsDataSource = new MatTableDataSource<IVariant>();
  total: number;
  displayedColumns: string[] = ["variantId", "boardDescription", "actions"];
  userLoggedInObservable: Observable<boolean> = of(false);
  getBoardDescription = getBoardDescription;

  constructor(
    private readonly variantService: VariantService,
    private readonly authenticationService: AuthenticationService,
    private readonly challengeService: ChallengeService,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.variantService
      .search({ pagination: { pageIndex: 0, pageSize: 100 } })
      .subscribe((result) => {
        this.loading = false;
        this.variantsDataSource.data = result.data;
        this.total = result.total;
      });
    this.userLoggedInObservable = this.authenticationService
      .getUserSubject()
      .pipe(map((x) => doesHaveValue(x)));
  }

  onCreateOpenChallenge(variant: IVariant): void {
    this.challengeService
      .create({
        variantId: variant.variantId,
        creatorPlayAs: ChallengePlayAs.RANDOM,
      })
      .subscribe(() => {
        this.snackBar.open("Challenge created", null, {
          duration: 2500,
        });
      });
  }
}
