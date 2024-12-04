import { Stage as KonvaStage } from "konva/lib/Stage";
import {
  IGame,
  IGameActionRequest,
  ILastAction,
} from "src/app/shared/dtos/rummikub/game";
import { ITile } from "src/app/shared/dtos/rummikub/tile";

export interface ITableOptions {
  element: HTMLDivElement;
}

export class RummikubTable {
  private readonly container: HTMLDivElement;
  private readonly stage: KonvaStage;
  private readonly onPlay: (request: IGameActionRequest) => void;
  private readonly onRearrangeTiles: (cards: ITile[]) => void;

  constructor(
    options: ITableOptions,
    onPlay: (request: IGameActionRequest) => void,
    onRearrangeTiles: (cards: ITile[]) => void
  ) {
    this.container = options.element;
    this.onPlay = onPlay;
    this.onRearrangeTiles = onRearrangeTiles;
    this.stage = new KonvaStage({
      container: this.container,
      height: this.container.offsetHeight,
      width: this.container.offsetWidth,
    });
  }

  async initializeState(game: IGame, currentUserId?: number): Promise<void> {}

  async updateStateWithUserAction(
    lastAction: ILastAction,
    newActionToUserId: number,
    tilePickedUp?: ITile
  ): Promise<void> {}

  resize(): void {}

  clear(): void {}
}
