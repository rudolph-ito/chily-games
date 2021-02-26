import { Component, Inject, OnInit } from "@angular/core";
import { FormControl } from "@angular/forms";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { IGame, IRoundScore } from "../../../shared/dtos/oh_heck/game";
import {
  computeTotalScore,
  ITotalScore,
} from "../../../utils/oh-heck/score-helpers";

export interface IOhHeckGameScoreboardDialogData {
  game: IGame;
}

@Component({
  selector: "app-oh-heck-game-scoreboard-dialog",
  templateUrl: "./oh-heck-game-scoreboard-dialog.component.html",
  styleUrls: ["./oh-heck-game-scoreboard-dialog.component.styl"],
})
export class OhHeckGameScoreboardDialogComponent implements OnInit {
  scoresDataSource = new MatTableDataSource<IRoundScore | ITotalScore>();
  scoresTableDisplayedColumns: string[] = [];
  showBetsControl = new FormControl(false);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: IOhHeckGameScoreboardDialogData
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
