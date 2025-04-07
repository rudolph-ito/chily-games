import { Component, Inject } from "@angular/core";
import { FormControl } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { RummikubGameService } from "src/app/services/rummikub/rummikub-game-service";
import { IGameOptions } from "src/app/shared/dtos/rummikub/game";

export interface IRummikubNewGameDialogData {
  rematchForGameId: number | null;
}

const defaultOptions: IGameOptions = {
  displayPlayerTileCounts: false,
  scoreSystem: "low_score",
  scoreThreshold: 200,
};

@Component({
  selector: "app-rummikub-new-game-dialog",
  standalone: true,
  imports: [],
  templateUrl: "./rummikub-new-game-dialog.component.html",
  styleUrl: "./rummikub-new-game-dialog.component.scss",
})
export class RummikubNewGameDialogComponent {
  controls = {
    displayPlayerTileCounts: new FormControl<boolean>(
      defaultOptions.displayPlayerTileCounts
    ),
    scoreSystem: new FormControl<string>(defaultOptions.scoreSystem),
    scoreThreshold: new FormControl<number>(defaultOptions.scoreThreshold),
  };

  constructor(
    private readonly gameService: RummikubGameService,
    private readonly matDialogRef: MatDialogRef<RummikubNewGameDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IRummikubNewGameDialogData
  ) {}

  create(): void {
    const options: IGameOptions = {
      displayPlayerTileCounts:
        this.controls.displayPlayerTileCounts.value ??
        defaultOptions.displayPlayerTileCounts,
      scoreSystem:
        this.controls.scoreSystem.value ?? defaultOptions.scoreSystem,
      scoreThreshold:
        this.controls.scoreThreshold.value ?? defaultOptions.scoreThreshold,
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
