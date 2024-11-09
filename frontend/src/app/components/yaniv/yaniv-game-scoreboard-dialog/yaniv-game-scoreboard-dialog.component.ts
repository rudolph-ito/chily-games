import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { IGame, IRoundScore } from "../../../shared/dtos/yaniv/game";
import { computeTotalScore } from "src/app/utils/yaniv/score-helpers";

export interface IYanivGameScoreboardDialogData {
  game: IGame;
}

@Component({
  selector: "app-yaniv-game-scoreboard-dialog",
  templateUrl: "./yaniv-game-scoreboard-dialog.component.html",
  styleUrls: ["./yaniv-game-scoreboard-dialog.component.scss"],
})
export class YanivGameScoreboardDialogComponent implements OnInit {
  scoresDataSource = new MatTableDataSource<IRoundScore>();
  scoresTableDisplayedColumns: string[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: IYanivGameScoreboardDialogData
  ) {}

  ngOnInit(): void {
    this.scoresDataSource.data = this.data.game.roundScores.concat([
      computeTotalScore(
        this.data.game.playerStates,
        this.data.game.roundScores
      ),
    ]);
    this.scoresTableDisplayedColumns = this.data.game.playerStates.map(
      (x) => `player-${x.userId}`
    );
  }
}
