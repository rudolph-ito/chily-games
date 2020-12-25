import { BaseBoard, IBoardOptions } from "./base_board";
import {
  ICoordinate,
  PlayerColor,
  IGameRules,
  Action,
} from "../../shared/dtos/cyvasse/game";
import { Rect as KonvaRect } from "konva/lib/shapes/Rect";

export interface ISquareBoardLayoutOptions {
  boardColumns: number;
  boardRows: number;
}

export class SquareBoard extends BaseBoard {
  private readonly layout: ISquareBoardLayoutOptions;
  private spaceSize: number;

  constructor(options: IBoardOptions, layout: ISquareBoardLayoutOptions) {
    super(options);
    this.layout = layout;
    this.setupForContainer(options.gameRules);
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

  protected createSpaceShape(): KonvaRect {
    return new KonvaRect({
      stroke: "#000",
      strokeWidth: 1,
    });
  }

  protected doesCoordinateContainPosition(
    coordiante: ICoordinate,
    position: ICoordinate
  ): boolean {
    const coordinatePosition = this.coordinateToPosition(coordiante);
    const leftX = coordinatePosition.x - this.spaceSize / 2;
    const rightX = leftX + this.spaceSize;
    const topY = coordinatePosition.y - this.spaceSize / 2;
    const bottomY = coordinatePosition.y + this.spaceSize;
    return (
      leftX <= position.x &&
      position.x <= rightX &&
      topY <= position.y &&
      position.y <= bottomY
    );
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

  protected getTerrainImageOffset(imageSize: ICoordinate): ICoordinate {
    return {
      x: 0,
      y: 0,
    };
  }

  protected getTerrainImageScaleReference(): number {
    return this.spaceSize;
  }

  protected setSpaceSize(space: KonvaRect): void {
    space.offset({
      x: this.spaceSize / 2,
      y: this.spaceSize / 2,
    });
    space.width(this.spaceSize);
    space.height(this.spaceSize);
  }

  protected setupForContainer(gameRules?: IGameRules): void {
    let setupSpaces = 0;
    if (
      this.game != null &&
      this.game.action === Action.SETUP &&
      gameRules != null
    ) {
      this.setupRows = Math.floor(this.layout.boardRows / 1.1);
      this.setupColumns = Math.ceil(
        (gameRules.pieces.length + gameRules.terrains.length) / this.setupRows
      );
      setupSpaces = this.setupColumns * 1.1 + 0.05;
    }

    const maxSize = this.getMaxSize();
    const maxSpaceWidth = maxSize.x / (this.layout.boardColumns + setupSpaces);
    const maxSpaceHeight = maxSize.y / this.layout.boardRows;

    this.spaceSize = Math.min(maxSpaceWidth, maxSpaceHeight);
    this.size = {
      x: this.spaceSize * this.layout.boardColumns,
      y: this.spaceSize * this.layout.boardRows,
    };
  }
}
