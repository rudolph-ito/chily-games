import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { IGame, IRoundScore } from "src/app/shared/dtos/rummikub/game";
import {
  computeTotalScore,
  ITotalScore,
} from "src/app/utils/rummikub/score-helpers";

export interface IRummikubGameScoreboardDialogData {
  message: string;
  supriseMessage: string;
  game: IGame;
}

@Component({
  selector: "app-rummikub-game-scoreboard-dialog",
  templateUrl: "./rummikub-game-scoreboard-dialog.component.html",
  styleUrls: ["./rummikub-game-scoreboard-dialog.component.scss"],
})
export class RummikubGameScoreboardDialogComponent {
  scoresDataSource = new MatTableDataSource<IRoundScore | ITotalScore>();
  scoresTableDisplayedColumns: string[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: IRummikubGameScoreboardDialogData
  ) {}

  ngOnInit(): void {
    let data: Array<IRoundScore | ITotalScore> = this.data.game.roundScores;
    data = data.concat([
      computeTotalScore(
        this.data.game.playerStates,
        this.data.game.roundScores
      ),
    ]);
    this.scoresDataSource.data = data;
    this.scoresTableDisplayedColumns = this.data.game.playerStates.map(
      (x) => `player-${x.userId}`
    );
  }
}
