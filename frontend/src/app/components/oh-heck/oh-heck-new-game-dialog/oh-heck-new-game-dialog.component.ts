import { Component, Inject } from "@angular/core";
import { FormControl } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { OhHeckGameService } from "src/app/services/oh-heck/oh-heck-game-service";

const HALF_GAME_ROUNDS = 7;

export interface IOhHeckNewGameDialogData {
  rematchForGameId: number | null;
}

@Component({
  selector: "app-oh-heck-new-game-dialog",
  templateUrl: "./oh-heck-new-game-dialog.component.html",
  styleUrls: ["./oh-heck-new-game-dialog.component.styl"],
})
export class OhHeckNewGameDialogComponent {
  controls = {
    gameRounds: new FormControl(HALF_GAME_ROUNDS),
  };

  constructor(
    private readonly gameService: OhHeckGameService,
    private readonly matDialogRef: MatDialogRef<OhHeckNewGameDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IOhHeckNewGameDialogData
  ) {}

  create(): void {
    const options = {
      halfGame: this.controls.gameRounds.value === HALF_GAME_ROUNDS,
    };
    const observable =
      this.data.rematchForGameId == null
        ? this.gameService.create(options)
        : this.gameService.rematch(this.data.rematchForGameId, options);
    observable.subscribe((game) => {
      this.matDialogRef.close(game);
    });
  }
}
