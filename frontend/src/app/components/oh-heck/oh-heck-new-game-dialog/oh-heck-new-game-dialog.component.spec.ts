import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { AppModule } from "src/app/app.module";

import { OhHeckNewGameDialogComponent } from "./oh-heck-new-game-dialog.component";

describe("OhHeckNewGameDialogComponent", () => {
  let component: OhHeckNewGameDialogComponent;
  let fixture: ComponentFixture<OhHeckNewGameDialogComponent>;
  let matDialogRef: Partial<MatDialogRef<OhHeckNewGameDialogComponent>>;

  beforeEach(async () => {
    matDialogRef = {
      close: jest.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {},
        },
        { provide: MatDialogRef, useValue: matDialogRef },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OhHeckNewGameDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
