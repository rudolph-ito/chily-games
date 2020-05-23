import { Component, OnInit } from "@angular/core";
import { FormControl } from "@angular/forms";
import { AuthenticationService } from "src/app/services/authentication.service";
import {
  IRegisterRequest,
  IRegisterErrors,
} from "src/app/shared/dtos/authentication";
import { HttpErrorResponse } from "@angular/common/http";
import { MatDialogRef } from "@angular/material/dialog";
import { setError } from "src/app/utils/form-control-helpers";

interface IUserRegisterControls {
  username: FormControl;
  password: FormControl;
  passwordConfirmation: FormControl;
}

@Component({
  selector: "app-user-register-form-dialog",
  templateUrl: "./user-register-form-dialog.component.html",
  styleUrls: ["./user-register-form-dialog.component.styl"],
})
export class UserRegisterFormDialogComponent implements OnInit {
  controls: IUserRegisterControls = {
    username: new FormControl(),
    password: new FormControl(),
    passwordConfirmation: new FormControl(),
  };

  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly matDialogRef: MatDialogRef<UserRegisterFormDialogComponent>
  ) {}

  ngOnInit(): void {}

  submit(): void {
    const request: IRegisterRequest = {
      username: this.controls.username.value,
      password: this.controls.password.value,
      passwordConfirmation: this.controls.passwordConfirmation.value,
    };
    this.authenticationService.register(request).subscribe(
      () => {
        this.matDialogRef.close(true);
      },
      (errorResponse: HttpErrorResponse) => {
        if (errorResponse.status === 422) {
          const errors: IRegisterErrors = errorResponse.error;
          setError(this.controls.username, errors.username);
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
