import { Component, OnInit } from "@angular/core";
import { FormControl } from "@angular/forms";
import { AuthenticationService } from "src/app/services/authentication.service";
import {
  IRegisterRequest,
  IRegisterErrors
} from "src/app/shared/dtos/authentication";
import { HttpErrorResponse } from "@angular/common/http";
import { doesHaveValue } from "../../shared/utilities/value_checker";
import { MatDialogRef } from "@angular/material/dialog";

interface IUserRegisterControls {
  username: FormControl;
  password: FormControl;
  passwordConfirmation: FormControl;
}

@Component({
  selector: "app-user-register-form-dialog",
  templateUrl: "./user-register-form-dialog.component.html",
  styleUrls: ["./user-register-form-dialog.component.styl"]
})
export class UserRegisterFormDialogComponent implements OnInit {
  controls: IUserRegisterControls = {
    username: new FormControl(),
    password: new FormControl(),
    passwordConfirmation: new FormControl()
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
      passwordConfirmation: this.controls.passwordConfirmation.value
    };
    this.authenticationService.register(request).subscribe(
      () => {
        this.matDialogRef.close(true);
      },
      (errorResponse: HttpErrorResponse) => {
        if (errorResponse.status === 424) {
          const errors: IRegisterErrors = errorResponse.error;
          if (doesHaveValue(errors.username)) {
            this.controls.username.markAsTouched();
            this.controls.username.setErrors({ invalid: errors.username });
          }
          if (doesHaveValue(errors.password)) {
            this.controls.password.markAsTouched();
            this.controls.password.setErrors({ invalid: errors.password });
          }
          if (doesHaveValue(errors.passwordConfirmation)) {
            this.controls.passwordConfirmation.markAsTouched();
            this.controls.passwordConfirmation.setErrors({
              invalid: errors.passwordConfirmation
            });
          }
        } else {
          // TODO better handling
          alert(errorResponse.error);
        }
      }
    );
  }
}
