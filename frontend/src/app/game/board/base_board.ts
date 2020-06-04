import Konva from "konva";
import {
  ICoordinate,
  PlayerColor,
  ValidPlies,
  IPiece,
} from "../../shared/dtos/game";
import { CoordinateMap } from "./coordinate_map";

export enum SpaceHighlight {
  NONE = "",
  MOVEMENT_ORIGIN = "#00CC00",
  MOVEMENT_FREE = "#006633",
}

export abstract class BaseBoard {
  private readonly container: HTMLDivElement;
  private readonly stage: Konva.Stage;
  private readonly padding: number;
  private readonly pieceLayer: Konva.Layer;
  private readonly pieceCoordinateMap = new CoordinateMap<Konva.Image>();
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
    this.pieceLayer = new Konva.Layer();
    this.stage.add(this.pieceLayer);
  }

  // Public Functions

  public addPiece(coordinate: ICoordinate, piece: IPiece): void {
    Konva.Image.fromURL(
      `/assets/piece/default/${piece.pieceTypeId}_${piece.playerColor}.svg`,
      (image: Konva.Image) => {
        this.setSpacePosition(image, coordinate);
        this.setPieceSize(image);
        this.pieceCoordinateMap.set(coordinate, image);
        this.pieceLayer.add(image);
        this.pieceLayer.draw();
      }
    );
  }

  public clearHighlight(): void {
    this.getAllCoordinates().forEach((c) => {
      const shape = this.getSpace(c);
      this.toggleSpaceHighlight(shape, SpaceHighlight.NONE);
    });
  }

  public clearPieces(): void {
    this.pieceLayer.removeChildren();
    this.pieceLayer.draw();
  }

  public destroy(): void {
    this.stage.destroy();
  }

  public draw(showCoordinates: boolean): void {
    this.getAllCoordinates().forEach((c) => this.addSpace(c, showCoordinates));
    this.spaceLayer.draw();
  }

  public highlightValidPlies(validPlies: ValidPlies): void {
    validPlies.free.forEach((c) => {
      const shape = this.getSpace(c);
      this.toggleSpaceHighlight(shape, SpaceHighlight.MOVEMENT_FREE);
    });
    this.spaceLayer.draw();
  }

  // Protected abstract

  protected abstract addSpace(
    coordinate: ICoordinate,
    showCoordinates: boolean
  ): void;

  protected abstract coordinateToPosition(coordinate: ICoordinate): ICoordinate;

  protected abstract getAllCoordinates(): ICoordinate[];

  protected abstract getPieceSize(): number;

  protected abstract getSpace(coordinate: ICoordinate): Konva.Shape;

  // Protected

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

  // Private

  private setPieceSize(image: Konva.Image): void {
    const size = this.getPieceSize();
    image.offset({ x: size / 2, y: size / 2 });
    image.height(size);
    image.width(size);
  }

  private toggleSpaceHighlight(
    shape: Konva.Shape,
    value: SpaceHighlight
  ): void {
    if (value === SpaceHighlight.NONE) {
      shape.fill("#FFFFFF");
      shape.opacity(1);
    } else {
      shape.fill(value);
      shape.opacity(0.5);
    }
  }
}
