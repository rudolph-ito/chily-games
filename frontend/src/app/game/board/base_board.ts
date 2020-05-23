import Konva from "konva";
import { Vector2d } from "konva/types/types";

export enum PlayerColor {
  ALABASTER = "alabaster",
  ONYX = "onyx",
}

export abstract class BaseBoard {
  private readonly container: HTMLDivElement;
  private readonly stage: Konva.Stage;
  private readonly padding: number;
  protected readonly color: PlayerColor;
  protected size: Vector2d;
  protected spaceLayer: Konva.Layer;

  constructor(element: HTMLDivElement, color: PlayerColor) {
    this.container = element;
    this.color = color;
    this.padding = 10;
    this.stage = new Konva.Stage({
      container: this.container,
      height: this.container.offsetHeight,
      width: this.container.offsetWidth,
    });
    this.spaceLayer = new Konva.Layer();
    this.stage.add(this.spaceLayer);
  }

  protected getMaxSize(): Vector2d {
    return {
      x: this.container.offsetWidth - 2 * this.padding,
      y: this.container.offsetHeight - 2 * this.padding,
    };
  }

  protected getOffset(): Vector2d {
    return {
      x: (this.container.offsetWidth - this.size.x) / 2,
      y: (this.container.offsetHeight - this.size.y) / 2,
    };
  }

  protected setSpacePosition(shape: Konva.Shape, coordinate: Vector2d): void {
    const position = this.coordinateToPosition(coordinate);
    shape.x(position.x);
    shape.y(position.y);
  }

  protected addCoordinateText(shape: Konva.Shape, coordinate: Vector2d): void {
    var text = new Konva.Text({
      x: shape.attrs.x,
      y: shape.attrs.y,
      text: `${coordinate.x},${coordinate.y}`,
    });
    this.spaceLayer.add(text);
  }

  abstract addSpaces(): void;

  abstract coordinateToPosition(coordinate: Vector2d): Vector2d;

  public draw(): void {
    this.addSpaces();
    this.spaceLayer.draw();
  }

  public clear(): void {
    this.stage.destroy();
  }
}
