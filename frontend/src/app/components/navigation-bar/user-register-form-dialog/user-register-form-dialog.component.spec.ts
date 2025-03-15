import { ComponentFixture, TestBed } from "@angular/core/testing";

import { UserRegisterFormDialogComponent } from "./user-register-form-dialog.component";
import { AppModule } from "src/app/app.module";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatDialogRef } from "@angular/material/dialog";

describe("UserRegisterFormDialogComponent", () => {
  let component: UserRegisterFormDialogComponent;
  let fixture: ComponentFixture<UserRegisterFormDialogComponent>;
  let matDialogRef: Partial<MatDialogRef<UserRegisterFormDialogComponent>>;

  beforeEach(() => {
    matDialogRef = {
      close: jest.fn(),
    };
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, AppModule],
      providers: [{ provide: MatDialogRef, useValue: matDialogRef }],
    });
    fixture = TestBed.createComponent(UserRegisterFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
