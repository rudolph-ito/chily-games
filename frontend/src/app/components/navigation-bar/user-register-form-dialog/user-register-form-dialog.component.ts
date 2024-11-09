import { Component, OnInit } from "@angular/core";
import { FormControl } from "@angular/forms";
import { AuthenticationService } from "src/app/services/authentication.service";
import {
  IRegisterRequest,
  IRegisterErrors,
  IUser,
} from "src/app/shared/dtos/authentication";
import { HttpErrorResponse } from "@angular/common/http";
import { MatDialogRef } from "@angular/material/dialog";
import { setError } from "src/app/utils/form-control-helpers";
import { Observable } from "rxjs";

interface IUserRegisterControls {
  registrationType: FormControl;
  username: FormControl;
  displayName: FormControl;
  password: FormControl;
  passwordConfirmation: FormControl;
}

@Component({
  selector: "app-user-register-form-dialog",
  templateUrl: "./user-register-form-dialog.component.html",
  styleUrls: ["./user-register-form-dialog.component.scss"],
})
export class UserRegisterFormDialogComponent implements OnInit {
  controls: IUserRegisterControls = {
    registrationType: new FormControl("guest"),
    username: new FormControl(),
    displayName: new FormControl(),
    password: new FormControl(),
    passwordConfirmation: new FormControl(),
  };

  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly matDialogRef: MatDialogRef<UserRegisterFormDialogComponent>
  ) {}

  ngOnInit(): void {}

  submit(): void {
    let observable: Observable<IUser> | null = null;
    if (this.controls.registrationType.value === "guest") {
      observable = this.authenticationService.registerAsGuest(
        this.controls.displayName.value
      );
    } else if (this.controls.registrationType.value === "full") {
      const request: IRegisterRequest = {
        username: this.controls.username.value,
        displayName: this.controls.displayName.value,
        password: this.controls.password.value,
        passwordConfirmation: this.controls.passwordConfirmation.value,
      };
      observable = this.authenticationService.register(request);
    }
    if (observable == null) {
      throw new Error("Unexpected registrationType");
    }
    observable.subscribe(
      () => {
        this.matDialogRef.close(true);
      },
      (errorResponse: HttpErrorResponse) => {
        if (errorResponse.status === 422) {
          const errors: IRegisterErrors = errorResponse.error;
          setError(this.controls.username, errors.username);
          setError(this.controls.displayName, errors.displayName);
          setError(this.controls.password, errors.password);
          setError(
            this.controls.passwordConfirmation,
            errors.passwordConfirmation
          );
        } else {
          // TODO better handling
          alert(errorResponse.error);
        }
      }
    );
  }
}
