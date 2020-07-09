import { BaseBoard, IUpdateOptions } from "./base_board";
import { ICoordinate, PlayerColor, IGameSetupRequirements } from "../../shared/dtos/game";
import Konva from "konva";
import { CoordinateMap } from "./coordinate_map";
import { doesHaveValue } from 'src/app/shared/utilities/value_checker';

export interface IHexagonalBoardLayoutOptions {
  boardSize: number;
}

export interface IHexagonalBoardOptions {
  layout: IHexagonalBoardLayoutOptions;
  color: PlayerColor;
  setupRequirements: IGameSetupRequirements;
}

export class HexagonalBoard extends BaseBoard {
  private readonly spaceCoordinateMap = new CoordinateMap<
    Konva.RegularPolygon
  >();

  private readonly layout: IHexagonalBoardLayoutOptions;
  private spaceRadius: number;
  private spaceDelta: ICoordinate;
  private center: ICoordinate;

  constructor(element: HTMLDivElement, options: IHexagonalBoardOptions) {
    super(element, options.color);
    this.layout = options.layout;
    this.setupForContainer()
  }

  // Protected overrides

  protected addSpace(coordinate: ICoordinate, showCoordinates: boolean): void {
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
    return this.spaceRadius * 2 * 1.1
  }

  protected getSpace(coordinate: ICoordinate): Konva.Shape {
    return this.spaceCoordinateMap.get(coordinate);
  }

  protected setSpaceSize(polygon: Konva.RegularPolygon): void {
    polygon.radius(this.spaceRadius);
  }

  protected setupForContainer(setupRequirements: IGameSetupRequirements = null): void {
    const verticalRadii = 3 * this.layout.boardSize + 2;
    const horizontalRadii =
      2 * (2 * this.layout.boardSize + 1) * Math.cos(Math.PI / 6);

    let setupHorizontalRadii = 0
    if (doesHaveValue(setupRequirements)) {
      this.setupRows = Math.floor(verticalRadii / 2 / 1.1)
      this.setupColumns = Math.ceil((setupRequirements.pieces.length + setupRequirements.terrains.length) / this.setupRows)
      setupHorizontalRadii = this.setupColumns * 2 * 1.1 + 0.1
    }

    const maxSize = this.getMaxSize();
    const maxHorizontalRadius = maxSize.x / (horizontalRadii + setupHorizontalRadii);
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
