import { BaseBoard, IBoardOptions } from "./base_board";
import {
  ICoordinate,
  PlayerColor,
  IGameRules,
  Action,
} from "../../shared/dtos/cyvasse/game";
import { RegularPolygon as KonvaRegularPolygon } from "konva/lib/shapes/RegularPolygon";

export interface IHexagonalBoardLayoutOptions {
  boardSize: number;
}

export class HexagonalBoard extends BaseBoard {
  private readonly layout: IHexagonalBoardLayoutOptions;
  private spaceRadius: number;
  private spaceDelta: ICoordinate;
  private center: ICoordinate;

  constructor(
    options: IBoardOptions,
    layoutOptions: IHexagonalBoardLayoutOptions
  ) {
    super(options);
    this.layout = layoutOptions;
    this.setupForContainer(options.gameRules);
  }

  // Protected overrides

  // From alabaster point of view:
  //   (0,0) in center
  //   x increases going right, decreases going left
  //   y increases going up, decreases going down
  protected coordinateToPosition(coordiante: ICoordinate): ICoordinate {
    const relative = {
      x: (coordiante.x * 2 + coordiante.y) * this.spaceDelta.x,
      y: -1 * coordiante.y * this.spaceDelta.y,
    };

    if (this.color === PlayerColor.ONYX) {
      relative.x *= -1;
      relative.y *= -1;
    }

    return {
      x: this.center.x + relative.x + this.getOffset().x,
      y: this.center.y + relative.y + this.getOffset().y,
    };
  }

  protected createSpaceShape(): KonvaRegularPolygon {
    return new KonvaRegularPolygon({
      radius: 1,
      sides: 6,
      stroke: "#000",
      strokeWidth: 1,
    });
  }

  protected doesCoordinateContainPosition(
    coordiante: ICoordinate,
    position: ICoordinate
  ): boolean {
    const { x: x1, y: y1 } = position;
    const { x: x2, y: y2 } = this.coordinateToPosition(coordiante);
    const positionalDistance = Math.sqrt(
      Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)
    );
    return positionalDistance <= this.spaceRadius * Math.cos(Math.PI / 6);
  }

  protected getAllCoordinates(): ICoordinate[] {
    const result: ICoordinate[] = [];
    const min = -1 * this.layout.boardSize;
    const max = this.layout.boardSize;
    for (let x = min; x <= max; x++) {
      for (let y = min; y <= max; y++) {
        const sum = x + y;
        if (sum < min) {
          continue;
        }
        if (sum > max) {
          break;
        }
        result.push({ x, y });
      }
    }
    return result;
  }

  protected getPieceSize(): number {
    return (this.spaceDelta.x / Math.sqrt(2)) * 2;
  }

  protected getSetupSize(): number {
    return this.spaceRadius * 2 * 1.1;
  }

  protected getTerrainImageOffset(imageSize: ICoordinate): ICoordinate {
    return {
      x: imageSize.x / 2,
      y: imageSize.y / 2,
    };
  }

  protected getTerrainImageScaleReference(): number {
    return this.spaceRadius * 2;
  }

  protected setSpaceSize(polygon: KonvaRegularPolygon): void {
    polygon.radius(this.spaceRadius);
  }

  protected setupForContainer(gameRules?: IGameRules): void {
    const verticalRadii = 3 * this.layout.boardSize + 2;
    const horizontalRadii =
      2 * (2 * this.layout.boardSize + 1) * Math.cos(Math.PI / 6);

    let setupHorizontalRadii = 0;
    if (
      this.game != null &&
      this.game.action === Action.SETUP &&
      gameRules != null
    ) {
      this.setupRows = Math.floor(verticalRadii / 2 / 1.1);
      this.setupColumns = Math.ceil(
        (gameRules.pieces.length + gameRules.terrains.length) / this.setupRows
      );
      setupHorizontalRadii = this.setupColumns * 2 * 1.1 + 0.1;
    }

    const maxSize = this.getMaxSize();
    const maxHorizontalRadius =
      maxSize.x / (horizontalRadii + setupHorizontalRadii);
    const maxVerticalRadius = maxSize.y / verticalRadii;

    this.spaceRadius = Math.min(maxVerticalRadius, maxHorizontalRadius);
    this.spaceDelta = {
      x: this.spaceRadius * Math.cos(Math.PI / 6),
      y: (this.spaceRadius * 3) / 2,
    };
    this.setupWidth = this.spaceRadius * setupHorizontalRadii;
    this.size = {
      x: this.spaceRadius * horizontalRadii,
      y: this.spaceRadius * verticalRadii,
    };
    this.center = {
      x: this.size.x / 2,
      y: this.size.y / 2,
    };
  }
}
