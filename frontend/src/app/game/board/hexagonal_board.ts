import { BaseBoard } from "./base_board";
import { ICoordinate, PlayerColor } from "../../shared/dtos/game";
import Konva from "konva";

export interface IHexagonalBoardLayoutOptions {
  boardSize: number;
}

export interface IHexagonalBoardOptions {
  layout: IHexagonalBoardLayoutOptions;
  color: PlayerColor;
}

export class HexagonalBoard extends BaseBoard {
  private readonly spaceCoordinateMap: Map<ICoordinate, Konva.RegularPolygon>;
  private readonly layout: IHexagonalBoardLayoutOptions;
  private spaceRadius: number;
  private spaceDelta: ICoordinate;
  private center: ICoordinate;

  constructor(element: HTMLDivElement, options: IHexagonalBoardOptions) {
    super(element, options.color);
    this.layout = options.layout;
    this.spaceCoordinateMap = new Map<ICoordinate, Konva.RegularPolygon>();
    this.setup();
  }

  setup(): void {
    const verticalRadii = 3 * this.layout.boardSize + 2;
    const horizontalRadii =
      2 * (2 * this.layout.boardSize + 1) * Math.cos(Math.PI / 6);

    const maxSize = this.getMaxSize();
    const maxHorizontalRadius = maxSize.x / horizontalRadii;
    const maxVerticalRadius = maxSize.y / verticalRadii;

    this.spaceRadius = Math.min(maxVerticalRadius, maxHorizontalRadius);
    this.spaceDelta = {
      x: this.spaceRadius * Math.cos(Math.PI / 6),
      y: (this.spaceRadius * 3) / 2,
    };
    this.size = {
      x: this.spaceRadius * horizontalRadii,
      y: this.spaceRadius * verticalRadii,
    };
    this.center = {
      x: this.size.x / 2,
      y: this.size.y / 2,
    };
  }

  addSpaces(showCoordinates: boolean): void {
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
        this.addSpace({ x, y }, showCoordinates);
      }
    }
  }

  addSpace(coordinate: ICoordinate, showCoordinates: boolean): void {
    const polygon = new Konva.RegularPolygon({
      radius: 1,
      sides: 6,
      stroke: "#000",
      strokeWidth: 1,
    });
    this.spaceLayer.add(polygon);
    this.setSpaceSize(polygon);
    this.setSpacePosition(polygon, coordinate);
    this.spaceCoordinateMap.set(coordinate, polygon);
    if (showCoordinates) {
      this.addCoordinateText(polygon, coordinate);
    }
  }

  public setSpaceSize(polygon: Konva.RegularPolygon): void {
    polygon.radius(this.spaceRadius);
  }

  // From alabaster point of view:
  //   (0,0) in center left
  //   x increases going right
  //   y increases going up
  coordinateToPosition(coordiante: ICoordinate): ICoordinate {
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
}
