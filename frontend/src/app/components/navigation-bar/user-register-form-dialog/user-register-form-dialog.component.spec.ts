import { ComponentFixture, TestBed } from "@angular/core/testing";

import { UserRegisterFormDialogComponent } from "./user-register-form-dialog.component";
import { AppModule } from "src/app/app.module";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { MatDialogRef } from "@angular/material/dialog";
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";

describe("UserRegisterFormDialogComponent", () => {
  let component: UserRegisterFormDialogComponent;
  let fixture: ComponentFixture<UserRegisterFormDialogComponent>;
  let matDialogRef: Partial<MatDialogRef<UserRegisterFormDialogComponent>>;

  beforeEach(() => {
    matDialogRef = {
      close: jest.fn(),
    };
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [
        { provide: MatDialogRef, useValue: matDialogRef },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    fixture = TestBed.createComponent(UserRegisterFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
