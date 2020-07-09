import Konva from "konva";
import {
  ICoordinate,
  PlayerColor,
  ValidPlies,
  IPiece,
  IGameSetupTerritories,
  IGameSetupRequirements,
  IGameSetupChange,
} from "../../shared/dtos/game";
import { CoordinateMap } from "./coordinate_map";

export enum SpaceHighlight {
  NONE = "",
  MOVEMENT_ORIGIN = "#00CC00",
  MOVEMENT_FREE = "#006633",
  TERRITORY_NEUTRAL = "#A8A8A8",
  TERRITORY_OPPONENT = "#505050",
}

export interface IUpdateOptions {
  color: PlayerColor;
  inSetup: boolean;
  setupRequirements: IGameSetupRequirements;
}

export abstract class BaseBoard {
  private readonly container: HTMLDivElement;
  private readonly stage: Konva.Stage;
  private readonly padding: number;
  private readonly pieceLayer: Konva.Layer;
  private readonly terrainLayer: Konva.Layer;
  private readonly pieceCoordinateMap = new CoordinateMap<Konva.Image>();
  private readonly setupCoordinateMap = new CoordinateMap<Konva.Image>();
  protected color: PlayerColor;
  protected size: ICoordinate;
  protected setupWidth: number;
  protected setupRows: number;
  protected setupColumns: number;
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

  public addSpaces(showCoordinates: boolean): void {
    this.getAllCoordinates().forEach((c) => this.addSpace(c, showCoordinates));
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

  public highlightValidPlies(validPlies: ValidPlies): void {
    validPlies.free.forEach((c) => {
      const shape = this.getSpace(c);
      this.toggleSpaceHighlight(shape, SpaceHighlight.MOVEMENT_FREE);
    });
    this.spaceLayer.draw();
  }

  public markTerritories(
    territories: IGameSetupTerritories,
    playerColor: PlayerColor
  ): void {
    territories.neutral.forEach((c) => {
      const shape = this.getSpace(c);
      this.toggleSpaceHighlight(shape, SpaceHighlight.TERRITORY_NEUTRAL);
    });
    if (playerColor !== PlayerColor.ALABASTER) {
      territories.alabaster.forEach((c) => {
        const shape = this.getSpace(c);
        this.toggleSpaceHighlight(shape, SpaceHighlight.TERRITORY_OPPONENT);
      });
    }
    if (playerColor !== PlayerColor.ONYX) {
      territories.onyx.forEach((c) => {
        const shape = this.getSpace(c);
        this.toggleSpaceHighlight(shape, SpaceHighlight.TERRITORY_OPPONENT);
      });
    }
    this.spaceLayer.draw();
  }

  public update(options: IUpdateOptions): void {
    this.color = options.color;
    this.setupForContainer(options.setupRequirements);
    this.stage.height(this.container.offsetHeight);
    this.stage.width(this.container.offsetWidth);
    this.getAllCoordinates().forEach((c) => {
      const space = this.getSpace(c);
      this.setSpacePosition(space, c);
      this.setSpaceSize(space);
    });
    this.pieceCoordinateMap.forEach(
      (coordinate: ICoordinate, image: Konva.Image) => {
        this.setSpacePosition(image, coordinate);
        this.setPieceSize(image);
      }
    );
    this.clearHighlight()
    if (options.inSetup) {
      this.markTerritories(options.setupRequirements.territories, options.color);
      // add boneyard pieces
    }
    this.spaceLayer.draw();
    this.pieceLayer.draw();
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

  protected abstract setSpaceSize(space: Konva.Shape): void;

  protected abstract setupForContainer(setupRequirements: IGameSetupRequirements): void;

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
      x: (this.container.offsetWidth - this.size.x) / 2 + (this.setupWidth / 2),
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
