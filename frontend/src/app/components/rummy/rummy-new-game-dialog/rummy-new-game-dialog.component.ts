import { Component, Inject } from "@angular/core";
import { FormControl } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { RummyGameService } from "src/app/services/rummy-game.service";
import { IGameOptions } from "src/app/shared/dtos/rummy/game";

export interface IRummyNewGameDialogData {
  rematchForGameId: number | null;
}

export const NUMBER_OF_DISCARD_PILE_OPTIONS: number[] = [1, 2];
export const POINT_THRESHOLD_OPTIONS: number[] = [250, 500];

@Component({
  selector: "app-rummy-new-game-dialog",
  templateUrl: "./rummy-new-game-dialog.component.html",
  styleUrls: ["./rummy-new-game-dialog.component.scss"],
})
export class RummyNewGameDialogComponent {
  numberOfDiscardPileOptions = NUMBER_OF_DISCARD_PILE_OPTIONS;
  pointThresholdOptions = POINT_THRESHOLD_OPTIONS;

  controls = {
    numberOfDiscardPiles: new FormControl(NUMBER_OF_DISCARD_PILE_OPTIONS[0]),
    pointThreshold: new FormControl(POINT_THRESHOLD_OPTIONS[0]),
  };

  constructor(
    private readonly gameService: RummyGameService,
    private readonly matDialogRef: MatDialogRef<RummyNewGameDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IRummyNewGameDialogData
  ) {}

  create(): void {
    const options: IGameOptions = {
      numberOfDiscardPiles: this.controls.numberOfDiscardPiles.value,
      pointThreshold: this.controls.pointThreshold.value,
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
