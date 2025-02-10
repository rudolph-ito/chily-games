import { HttpErrorResponse } from "@angular/common/http";
import { Component, ViewChild } from "@angular/core";
import { UntypedFormControl } from "@angular/forms";
import { MatPaginator } from "@angular/material/paginator";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatTableDataSource } from "@angular/material/table";
import { Router } from "@angular/router";
import { Subscription, timer } from "rxjs";
import { AuthenticationService } from "src/app/services/authentication.service";
import { RummikubGameService } from "src/app/services/rummikub/rummikub-game-service";
import { IUser } from "src/app/shared/dtos/authentication";
import { GameState, ISearchedGame } from "src/app/shared/dtos/rummikub/game";

@Component({
  selector: "app-rummikub-games-index",
  templateUrl: "./rummikub-games-index.component.html",
  styleUrls: ["./rummikub-games-index.component.scss"],
})
export class RummikubGamesIndexComponent {
  loading: boolean;
  includeCompletedFormControl = new UntypedFormControl(false);
  gamesDataSource = new MatTableDataSource<ISearchedGame>();
  displayedColumns: string[] = ["hostUserId", "state", "created_at", "actions"];
  user: IUser | null;
  refreshSubscription: Subscription;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    private readonly gameService: RummikubGameService,
    private readonly authenticationService: AuthenticationService,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.authenticationService
      .getUserSubject()
      .subscribe((x) => (this.user = x));
  }

  ngAfterViewInit(): void {
    this.paginator.page.subscribe(() => {
      this.refreshGames();
    });
    this.includeCompletedFormControl.valueChanges.subscribe(() => {
      this.paginator.pageIndex = 0;
      this.refreshGames();
    });
    this.refreshSubscription = timer(0, 5000).subscribe(() =>
      this.refreshGames()
    );
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription != null) {
      this.refreshSubscription.unsubscribe();
    }
  }

  refreshGames(): void {
    this.loading = true;
    this.gameService
      .search({
        filter: { includeCompleted: this.includeCompletedFormControl.value },
        pagination: {
          pageIndex: this.paginator.pageIndex,
          pageSize: this.paginator.pageSize,
        },
      })
      .subscribe((result) => {
        this.loading = false;
        this.gamesDataSource.data = result.data;
        this.paginator.length = result.total;
      });
  }

  create(): void {
    this.gameService
      .create({ hideTileCount: false, playTo: 100 })
      .subscribe((game) => {
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
          this.snackBar.open(errorResponse.error, undefined, {
            duration: 2500,
          });
        }
      }
    );
  }

  navigateToGame(gameId: number): void {
    this.router.navigate([`rummikub/games/${gameId}`]);
  }

  getHostUsername(game: ISearchedGame): string {
    const player = game.players.find((x) => x.userId === game.hostUserId);
    if (player == null) {
      throw new Error("Unable to find host");
    }
    return player.displayName;
  }

  getState(game: ISearchedGame): string {
    if (game.state === GameState.PLAYERS_JOINING) {
      return "Joinable";
    }
    if (game.state === GameState.COMPLETE) {
      return "Complete";
    }
    if (game.state === GameState.ABORTED) {
      return "Aborted";
    }
    return "Playing";
  }

  getCreatedTimestamp(game: ISearchedGame): number {
    return new Date(game.createdAt).valueOf();
  }

  canJoin(game: ISearchedGame): boolean {
    return (
      this.user != null &&
      game.state === GameState.PLAYERS_JOINING &&
      game.players.every((x) => x.userId !== this.user?.userId)
    );
  }

  couldJoinIfLoggedIn(game: ISearchedGame): boolean {
    return this.user == null && game.state === GameState.PLAYERS_JOINING;
  }

  isInGame(game: ISearchedGame): boolean {
    return (
      this.user != null &&
      game.players.some((x) => x.userId === this.user?.userId)
    );
  }
}
