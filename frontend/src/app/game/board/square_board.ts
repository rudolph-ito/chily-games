import { BaseBoard, PlayerColor } from "./base_board";
import { Vector2d } from "konva/types/types";
import Konva from "konva";

export interface ISquareBoardLayoutOptions {
  boardColumns: number;
  boardRows: number;
}

export interface ISquareBoardOptions {
  layout: ISquareBoardLayoutOptions;
  color: PlayerColor;
}

export class SquareBoard extends BaseBoard {
  private readonly spaceCoordinateMap: Map<Vector2d, Konva.Rect>;
  private readonly layout: ISquareBoardLayoutOptions;
  private spaceSize: number;

  constructor(element: HTMLDivElement, options: ISquareBoardOptions) {
    super(element, options.color);
    this.layout = options.layout;
    this.spaceCoordinateMap = new Map<Vector2d, Konva.Rect>();
    this.setup();
  }

  public setup(): void {
    const maxSize = this.getMaxSize();
    const maxSpaceWidth = maxSize.x / this.layout.boardColumns;
    const maxSpaceHeight = maxSize.y / this.layout.boardRows;

    this.spaceSize = Math.min(maxSpaceWidth, maxSpaceHeight);
    this.size = {
      x: this.spaceSize * this.layout.boardColumns,
      y: this.spaceSize * this.layout.boardRows,
    };
  }

  public addSpaces(): void {
    for (let x = 0; x < this.layout.boardColumns; x++) {
      for (let y = 0; y < this.layout.boardRows; y++) {
        this.addSpace({ x, y });
      }
    }
  }

  public addSpace(coordinate: Vector2d): void {
    const rect = new Konva.Rect({
      stroke: "#000",
      strokeWidth: 1,
    });
    this.spaceLayer.add(rect);
    this.setSpaceSize(rect);
    this.setSpacePosition(rect, coordinate);
    this.spaceCoordinateMap.set(coordinate, rect);
  }

  public setSpaceSize(space: Konva.Rect): void {
    space.offset({
      x: this.spaceSize / 2,
      y: this.spaceSize / 2,
    });
    space.width(this.spaceSize);
    space.height(this.spaceSize);
  }

  public coordinateToPosition(coordinate: Vector2d): Vector2d {
    const position = {
      x: coordinate.x * this.spaceSize + this.spaceSize / 2,
      y: coordinate.y * this.spaceSize + this.spaceSize / 2,
    };
    if (this.color === PlayerColor.ALABASTER) {
      position.x = this.size.x - position.x;
      position.y = this.size.y - position.y;
    }
    return {
      x: position.x + this.getOffset().x,
      y: position.y + this.getOffset().y,
    };
  }
}
