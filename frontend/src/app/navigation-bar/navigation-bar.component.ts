import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { UserLoginFormDialogComponent } from "./user-login-form-dialog/user-login-form-dialog.component";
import { UserRegisterFormDialogComponent } from "./user-register-form-dialog/user-register-form-dialog.component";
import { AuthenticationService } from "../services/authentication.service";
import { IUser } from "../shared/dtos/authentication";

@Component({
  selector: "app-navigation-bar",
  templateUrl: "./navigation-bar.component.html",
  styleUrls: ["./navigation-bar.component.styl"]
})
export class NavigationBarComponent implements OnInit {
  loading: boolean = false;
  user: IUser = null;

  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadUser();
  }

  afterRegisterOrLogin(userLoggedIn: boolean): void {
    if (!userLoggedIn) {
      return;
    }
    this.loadUser();
  }

  doneLoading = (): void => {
    this.loading = false;
  };

  loadUser(): void {
    this.loading = true;
    this.authenticationService.getUser().subscribe(user => {
      this.user = user;
      this.doneLoading();
    }, this.doneLoading);
  }

  logout(): void {
    this.loading = true;
    this.user = null;
    this.authenticationService
      .logout()
      .subscribe(this.doneLoading, this.doneLoading);
  }

  showUserLoginForm(): void {
    this.dialog
      .open(UserLoginFormDialogComponent)
      .afterClosed()
      .subscribe(x => this.afterRegisterOrLogin(x));
  }

  showUserRegisterForm(): void {
    this.dialog
      .open(UserRegisterFormDialogComponent)
      .afterClosed()
      .subscribe(x => this.afterRegisterOrLogin(x));
  }
}
