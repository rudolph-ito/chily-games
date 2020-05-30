import Konva from "konva";
import { ICoordinate, PlayerColor } from "../../shared/dtos/game";

export abstract class BaseBoard {
  private readonly container: HTMLDivElement;
  private readonly stage: Konva.Stage;
  private readonly padding: number;
  protected readonly color: PlayerColor;
  protected size: ICoordinate;
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

  protected getMaxSize(): ICoordinate {
    return {
      x: this.container.offsetWidth - 2 * this.padding,
      y: this.container.offsetHeight - 2 * this.padding,
    };
  }

  protected getOffset(): ICoordinate {
    return {
      x: (this.container.offsetWidth - this.size.x) / 2,
      y: (this.container.offsetHeight - this.size.y) / 2,
    };
  }

  protected setSpacePosition(
    shape: Konva.Shape,
    coordinate: ICoordinate
  ): void {
    const position = this.coordinateToPosition(coordinate);
    shape.x(position.x);
    shape.y(position.y);
  }

  protected addCoordinateText(
    shape: Konva.Shape,
    coordinate: ICoordinate
  ): void {
    var text = new Konva.Text({
      x: shape.attrs.x,
      y: shape.attrs.y,
      text: `${coordinate.x},${coordinate.y}`,
    });
    text.offsetX(text.getWidth() / 2);
    text.offsetY(text.getHeight() / 2);
    this.spaceLayer.add(text);
  }

  abstract addSpaces(showCoordinates: boolean): void;

  abstract coordinateToPosition(coordinate: ICoordinate): ICoordinate;

  public draw(showCoordinates: boolean): void {
    this.addSpaces(showCoordinates);
    this.spaceLayer.draw();
  }

  public clear(): void {
    this.stage.destroy();
  }
}
