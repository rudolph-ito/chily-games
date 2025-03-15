import { ComponentFixture, TestBed } from "@angular/core/testing";

import { UserLoginFormDialogComponent } from "./user-login-form-dialog.component";
import { AppModule } from "src/app/app.module";
import { MatDialogRef } from "@angular/material/dialog";

describe("UserLoginFormDialogComponent", () => {
  let component: UserLoginFormDialogComponent;
  let fixture: ComponentFixture<UserLoginFormDialogComponent>;
  let matDialogRef: Partial<MatDialogRef<UserLoginFormDialogComponent>>;

  beforeEach(() => {
    matDialogRef = {
      close: jest.fn(),
    };
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [{ provide: MatDialogRef, useValue: matDialogRef }],
    });
    fixture = TestBed.createComponent(UserLoginFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
