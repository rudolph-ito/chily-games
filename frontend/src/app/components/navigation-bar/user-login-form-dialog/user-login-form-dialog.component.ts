import { Component, OnInit } from "@angular/core";
import { UntypedFormControl } from "@angular/forms";
import { ILoginRequest } from "src/app/shared/dtos/authentication";
import { AuthenticationService } from "src/app/services/authentication.service";
import { HttpErrorResponse } from "@angular/common/http";
import { MatDialogRef } from "@angular/material/dialog";
import { setError } from "src/app/utils/form-control-helpers";

interface IUserLoginControls {
  username: UntypedFormControl;
  password: UntypedFormControl;
}

@Component({
  selector: "app-user-login-form-dialog",
  templateUrl: "./user-login-form-dialog.component.html",
  styleUrls: ["./user-login-form-dialog.component.scss"],
})
export class UserLoginFormDialogComponent implements OnInit {
  controls: IUserLoginControls = {
    username: new UntypedFormControl(),
    password: new UntypedFormControl(),
  };

  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly matDialogRef: MatDialogRef<UserLoginFormDialogComponent>
  ) {}

  ngOnInit(): void {}

  submit(): void {
    const request: ILoginRequest = {
      username: this.controls.username.value,
      password: this.controls.password.value,
    };
    this.authenticationService.login(request).subscribe(
      () => {
        this.matDialogRef.close(true);
      },
      (errorResponse: HttpErrorResponse) => {
        if (errorResponse.status === 400 || errorResponse.status === 401) {
          setError(this.controls.password, "Invalid username or password");
        } else {
          // TODO better handling
          alert(errorResponse.error);
        }
      }
    );
  }
}
