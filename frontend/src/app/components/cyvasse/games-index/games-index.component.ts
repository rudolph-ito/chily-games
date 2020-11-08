import { Component, OnInit } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { Observable, of } from "rxjs";
import { IUser } from "src/app/shared/dtos/authentication";
import { IGame } from "src/app/shared/dtos/game";
import { GameService } from "src/app/services/cyvasse/game.service";
import { AuthenticationService } from "src/app/services/authentication.service";

@Component({
  selector: "app-games-index",
  templateUrl: "./games-index.component.html",
  styleUrls: ["./games-index.component.styl"],
})
export class GamesIndexComponent implements OnInit {
  loading: boolean;
  pageIndex: number;
  pageSize: number = 100;
  gamesDataSource = new MatTableDataSource<IGame>();
  total: number;
  displayedColumns: string[] = [
    "alabasterUserId",
    "onyxUserId",
    "variantId",
    "actions",
  ];

  userObservable: Observable<IUser> = of(null);

  constructor(
    private readonly gameService: GameService,
    private readonly authenticationService: AuthenticationService
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
    this.userObservable = this.authenticationService.getUserSubject();
  }
}
