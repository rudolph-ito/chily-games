import { BaseBoard } from "./base_board";
import { ICoordinate, PlayerColor } from "../../shared/dtos/game";
import Konva from "konva";
import { CoordinateMap } from "./coordinate_map";

export interface ISquareBoardLayoutOptions {
  boardColumns: number;
  boardRows: number;
}

export interface ISquareBoardOptions {
  layout: ISquareBoardLayoutOptions;
  color: PlayerColor;
}

export class SquareBoard extends BaseBoard {
  private readonly spaceCoordinateMap = new CoordinateMap<Konva.Rect>();
  private readonly layout: ISquareBoardLayoutOptions;
  private spaceSize: number;

  constructor(element: HTMLDivElement, options: ISquareBoardOptions) {
    super(element, options.color);
    this.layout = options.layout;
    this.setupForContainer();
  }

  // Protected overrides

  protected addSpace(coordinate: ICoordinate, showCoordinates: boolean): void {
    const rect = new Konva.Rect({
      stroke: "#000",
      strokeWidth: 1,
    });
    this.spaceLayer.add(rect);
    this.setSpaceSize(rect);
    this.setSpacePosition(rect, coordinate);
    this.spaceCoordinateMap.set(coordinate, rect);
    if (showCoordinates) {
      this.addCoordinateText(rect, coordinate);
    }
  }

  // From alabaster point of view:
  //   (0,0) in bottom left
  //   x increases going right
  //   y increases going up
  protected coordinateToPosition(coordinate: ICoordinate): ICoordinate {
    const position = {
      x: coordinate.x * this.spaceSize + this.spaceSize / 2,
      y: this.size.y - (coordinate.y * this.spaceSize + this.spaceSize / 2),
    };
    if (this.color === PlayerColor.ONYX) {
      position.x = this.size.x - position.x;
      position.y = this.size.y - position.y;
    }
    return {
      x: position.x + this.getOffset().x,
      y: position.y + this.getOffset().y,
    };
  }

  protected getAllCoordinates(): ICoordinate[] {
    const result: ICoordinate[] = [];
    for (let x = 0; x < this.layout.boardColumns; x++) {
      for (let y = 0; y < this.layout.boardRows; y++) {
        result.push({ x, y });
      }
    }
    return result;
  }

  protected getPieceSize(): number {
    return this.spaceSize * 0.9;
  }

  protected getSpace(coordinate: ICoordinate): Konva.Shape {
    return this.spaceCoordinateMap.get(coordinate);
  }

  protected setSpaceSize(space: Konva.Rect): void {
    space.offset({
      x: this.spaceSize / 2,
      y: this.spaceSize / 2,
    });
    space.width(this.spaceSize);
    space.height(this.spaceSize);
  }

  protected setupForContainer(): void {
    const maxSize = this.getMaxSize();
    const maxSpaceWidth = maxSize.x / this.layout.boardColumns;
    const maxSpaceHeight = maxSize.y / this.layout.boardRows;

    this.spaceSize = Math.min(maxSpaceWidth, maxSpaceHeight);
    this.size = {
      x: this.spaceSize * this.layout.boardColumns,
      y: this.spaceSize * this.layout.boardRows,
    };
  }
}
