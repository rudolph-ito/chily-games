import { Vector2d } from "konva/types/types";

export interface ILayer {
  draw: () => void;
  drag_start: (space: ISpace) => void;
  drag_end: (space: ISpace) => void;
}

export interface IGameController {
  userInSetup: () => boolean;
}

export interface IBoard {
  click: (coordinate: Vector2d) => void;
  getSpaceSize: () => number;
  gameController: IGameController;
  position: (coordinate: Vector2d) => Vector2d;
  spaceSize: number;
}

export interface ISpace {
  update: () => void;
}
