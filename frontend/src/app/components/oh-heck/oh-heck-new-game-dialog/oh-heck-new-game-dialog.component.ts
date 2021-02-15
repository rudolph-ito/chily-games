import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { OhHeckGameService } from 'src/app/services/oh-heck/oh-heck-game-service';

const HALF_GAME_ROUNDS = 7;

@Component({
  selector: 'app-oh-heck-new-game-dialog',
  templateUrl: './oh-heck-new-game-dialog.component.html',
  styleUrls: ['./oh-heck-new-game-dialog.component.styl']
})
export class OhHeckNewGameDialogComponent implements OnInit {
  controls = {
    gameRounds: new FormControl(HALF_GAME_ROUNDS)
  }

  constructor(
    private readonly gameService: OhHeckGameService,
    private readonly matDialogRef: MatDialogRef<OhHeckNewGameDialogComponent>
  ) { }

  ngOnInit(): void {
  }

  create() {
    const options = {
      halfGame: this.controls.gameRounds.value == HALF_GAME_ROUNDS
    }
    // TODO option to use rematch instead of create
    this.gameService.create(options)
      .subscribe((game) => {
        this.matDialogRef.close(game);
      })
  }
}
