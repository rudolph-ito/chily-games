import { Component, OnInit } from "@angular/core";
import { VariantService } from "../../../services/cyvasse/variant.service";
import { IVariant } from "../../../shared/dtos/variant";
import { MatTableDataSource } from "@angular/material/table";
import { AuthenticationService } from "../../../services/authentication.service";
import { doesHaveValue } from "../../../shared/utilities/value_checker";
import { Observable, of } from "rxjs";
import { getBoardDescription } from "../../../formatters/variant.formatter";
import { map } from "rxjs/operators";
import { ChallengeService } from "src/app/services/cyvasse/challenge.service";
import { ChallengePlayAs } from "src/app/shared/dtos/challenge";

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
    private readonly challengeService: ChallengeService
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

  onCreateChallenge(variant: IVariant): void {
    this.challengeService
      .create({
        variantId: variant.variantId,
        creatorPlayAs: ChallengePlayAs.RANDOM,
      })
      .subscribe(() => {
        alert("Challenge created");
      });
  }
}
