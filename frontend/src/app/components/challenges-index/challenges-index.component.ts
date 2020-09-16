import { Component, OnInit } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { IChallenge } from "../../shared/dtos/challenge";
import { Observable, of } from "rxjs";
import { ChallengeService } from "src/app/services/challenge.service";
import { AuthenticationService } from "src/app/services/authentication.service";
import { map } from "rxjs/operators";
import { doesHaveValue } from "../../shared/utilities/value_checker";
import { IUser } from "src/app/shared/dtos/authentication";
import { Router } from "@angular/router";
import { IGame } from "../../shared/dtos/game";
import { MatSnackBar } from "@angular/material/snack-bar";

@Component({
  selector: "app-challenges-index",
  templateUrl: "./challenges-index.component.html",
  styleUrls: ["./challenges-index.component.styl"],
})
export class ChallengesIndexComponent implements OnInit {
  loading: boolean;
  pageIndex: number;
  pageSize: number = 100;
  challengesDataSource = new MatTableDataSource<IChallenge>();
  total: number;
  displayedColumns: string[] = ["creatorId", "variantId", "actions"];
  userObservable: Observable<IUser> = of(null);

  constructor(
    private readonly challengeService: ChallengeService,
    private readonly authenticationService: AuthenticationService,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.refreshChallenges();
    this.userObservable = this.authenticationService.getUserSubject();
  }

  refreshChallenges(): void {
    this.loading = true;
    this.challengeService
      .search({ pagination: { pageIndex: 0, pageSize: 100 } })
      .subscribe((result) => {
        this.loading = false;
        this.challengesDataSource.data = result.data;
        this.total = result.total;
      });
  }

  onAcceptChallenge(challenge: IChallenge): void {
    this.challengeService
      .accept(challenge.challengeId)
      .subscribe((game: IGame) => {
        this.router.navigate([`games/${game.gameId}`]); // eslint-disable-line @typescript-eslint/no-floating-promises
      });
  }

  onDeleteChallenge(challenge: IChallenge): void {
    this.challengeService.delete(challenge.challengeId).subscribe(() => {
      this.refreshChallenges();
      this.snackBar.open("Challenge deleted", null, {
        duration: 2500,
      });
    });
  }

  canAcceptChallengeObservable(challenge: IChallenge): Observable<boolean> {
    return this.userObservable.pipe(
      map((user) => this.canAcceptChallenge(challenge, user))
    );
  }

  canDeclineChallengeObservable(challenge: IChallenge): Observable<boolean> {
    return this.userObservable.pipe(
      map((user) => this.canDeclineChallenge(challenge, user))
    );
  }

  canAcceptChallenge(challenge: IChallenge, currentUser: IUser): boolean {
    return (
      doesHaveValue(currentUser) &&
      ((doesHaveValue(challenge.opponentUser) &&
        currentUser.userId === challenge.opponentUser.userId) ||
        currentUser.userId !== challenge.creatorUser.userId)
    );
  }

  canDeclineChallenge(challenge: IChallenge, currentUser: IUser): boolean {
    return (
      doesHaveValue(currentUser) &&
      doesHaveValue(challenge.opponentUser) &&
      currentUser.userId === challenge.opponentUser.userId
    );
  }
}
