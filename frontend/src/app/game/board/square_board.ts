import { BaseBoard } from "./base_board";
import {
  ICoordinate,
  PlayerColor,
  IGameSetupRequirements,
} from "../../shared/dtos/game";
import Konva from "konva";

export interface ISquareBoardLayoutOptions {
  boardColumns: number;
  boardRows: number;
}

export interface ISquareBoardOptions {
  layout: ISquareBoardLayoutOptions;
  color: PlayerColor;
  setupRequirements: IGameSetupRequirements;
}

export class SquareBoard extends BaseBoard {
  private readonly layout: ISquareBoardLayoutOptions;
  private spaceSize: number;

  constructor(element: HTMLDivElement, options: ISquareBoardOptions) {
    super(element, options.color);
    this.layout = options.layout;
    this.setupForContainer();
  }

  // Protected overrides

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

  protected createSpaceShape(): Konva.Rect {
    return new Konva.Rect({
      stroke: "#000",
      strokeWidth: 1,
    });
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

  protected getSetupSize(): number {
    return this.spaceSize * 1.1;
  }

  protected getSpace(coordinate: ICoordinate): Konva.Shape {
    return this.spaceCoordinateMap.get(coordinate);
  }

  protected getTerrainImageOffset(imageSize: ICoordinate): ICoordinate {
    return {
      x: 0,
      y: 0,
    };
  }

  protected getTerrainImageScaleReference(): number {
    return this.spaceSize;
  }

  protected setSpaceSize(space: Konva.Rect): void {
    space.offset({
      x: this.spaceSize / 2,
      y: this.spaceSize / 2,
    });
    space.width(this.spaceSize);
    space.height(this.spaceSize);
  }

  protected setupForContainer(
    setupRequirements: IGameSetupRequirements = null
  ): void {
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
