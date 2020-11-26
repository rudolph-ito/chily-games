import { HttpErrorResponse } from "@angular/common/http";
import { Component, NgZone, OnInit } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatTableDataSource } from "@angular/material/table";
import { Router } from "@angular/router";
import { Observable, of } from "rxjs";
import { map } from "rxjs/operators";
import { AuthenticationService } from "src/app/services/authentication.service";
import { YanivGameService } from "src/app/services/yaniv/yaniv-game.service";
import { ISearchedGame } from "../../../shared/dtos/yaniv/game";
import { doesHaveValue } from "../../../shared/utilities/value_checker";

@Component({
  selector: "app-yaniv-games-index",
  templateUrl: "./yaniv-games-index.component.html",
  styleUrls: ["./yaniv-games-index.component.styl"],
})
export class YanivGamesIndexComponent implements OnInit {
  loading: boolean;
  pageIndex: number;
  pageSize: number = 100;
  gamesDataSource = new MatTableDataSource<ISearchedGame>();
  total: number;
  displayedColumns: string[] = ["hostUserId", "state", "actions"];

  userLoggedInObservable: Observable<boolean> = of(false);

  constructor(
    private readonly gameService: YanivGameService,
    private readonly authenticationService: AuthenticationService,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.gameService
      .search({ pagination: { pageIndex: 0, pageSize: 100 } })
      .subscribe((result) => {
        this.loading = false;
        this.gamesDataSource.data = result.data;
        this.total = result.total;
      });
    this.userLoggedInObservable = this.authenticationService
      .getUserSubject()
      .pipe(map((x) => doesHaveValue(x)));
  }

  create(): void {
    this.gameService.create({ playTo: 100 }).subscribe((game) => {
      this.navigateToGame(game.gameId);
    });
  }

  join(gameId: number): void {
    this.gameService.join(gameId).subscribe(
      () => {
        this.navigateToGame(gameId);
      },
      (errorResponse: HttpErrorResponse) => {
        if (errorResponse.status === 422) {
          this.snackBar.open(errorResponse.error, null, {
            duration: 2500,
          });
        }
      }
    );
  }

  navigateToGame(gameId: number): void {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.router.navigate([`yaniv/games/${gameId}`]);
  }
}
