import { ComponentFixture, TestBed } from "@angular/core/testing";

import { RummikubNewGameDialogComponent } from "./rummikub-new-game-dialog.component";
import { AppModule } from "src/app/app.module";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

describe("RummikubNewGameDialogComponent", () => {
  let component: RummikubNewGameDialogComponent;
  let fixture: ComponentFixture<RummikubNewGameDialogComponent>;
  let matDialogRef: Partial<MatDialogRef<RummikubNewGameDialogComponent>>;

  beforeEach(() => {
    matDialogRef = {
      close: jest.fn(),
    };
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {},
        },
        { provide: MatDialogRef, useValue: matDialogRef },
      ],
    });
    fixture = TestBed.createComponent(RummikubNewGameDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
