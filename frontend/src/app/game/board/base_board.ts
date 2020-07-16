import Konva from "konva";
import {
  ICoordinate,
  PlayerColor,
  ValidPlies,
  IPiece,
  IGameSetupTerritories,
  IGameSetupRequirements,
  ITerrain,
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
  private readonly pieceCoordinateMap = new CoordinateMap<Konva.Image>();
  private readonly setupPieceCoordinateMap = new Map<number, Konva.Image>();
  private readonly terrainLayer: Konva.Layer;
  private readonly terrainCoordinateMap = new CoordinateMap<Konva.Shape>();
  private readonly setupTerrainCoordinateMap = new Map<number, Konva.Shape>();
  protected color: PlayerColor;
  protected size: ICoordinate;
  protected setupWidth: number;
  protected setupRows: number;
  protected setupColumns: number;
  protected spaceCoordinateMap = new CoordinateMap<Konva.Shape>();
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
    this.terrainLayer = new Konva.Layer();
    this.stage.add(this.terrainLayer);
  }

  // Public Functions

  public addPiece(coordinate: ICoordinate, piece: IPiece): void {
    Konva.Image.fromURL(
      `/assets/piece/default/${piece.pieceTypeId}_${piece.playerColor}.svg`,
      (image: Konva.Image) => {
        this.setSpacePositionFromCoordinate(image, coordinate);
        this.setPieceSize(image);
        this.pieceCoordinateMap.set(coordinate, image);
        this.pieceLayer.add(image);
        this.pieceLayer.draw();
      }
    );
  }

  public addSpaces(showCoordinates: boolean): void {
    this.getAllCoordinates().forEach((coordinate) => {
      const shape = this.createSpaceShape();
      this.spaceLayer.add(shape);
      this.setSpaceSize(shape);
      this.setSpacePositionFromCoordinate(shape, coordinate);
      this.spaceCoordinateMap.set(coordinate, shape);
      if (showCoordinates) {
        this.addCoordinateText(shape, coordinate);
      }
    });
  }

  public addSetup(setupRequirements: IGameSetupRequirements): void {
    if (this.color !== null) {
      let index = 0;
      setupRequirements.pieces.forEach((setupPieceRequirement) => {
        for (let i = 0; i < setupPieceRequirement.count; i++) {
          this.addSetupPiece(index, {
            pieceTypeId: setupPieceRequirement.pieceTypeId,
            playerColor: this.color,
          });
          index++;
        }
      });
      setupRequirements.terrains.forEach((setupTerrainRequirement) => {
        for (let i = 0; i < setupTerrainRequirement.count; i++) {
          this.addSetupTerrain(index, {
            terrainTypeId: setupTerrainRequirement.terrainTypeId,
            playerColor: this.color,
          });
          index++;
        }
      });
    }
  }

  public clearHighlight(): void {
    this.getAllCoordinates().forEach((c) => {
      const shape = this.spaceCoordinateMap.get(c);
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
      const shape = this.spaceCoordinateMap.get(c);
      this.toggleSpaceHighlight(shape, SpaceHighlight.MOVEMENT_FREE);
    });
    this.spaceLayer.draw();
  }

  public update(options: IUpdateOptions): void {
    // if color changed, remove and re-add setup
    this.color = options.color;
    this.setupForContainer(options.setupRequirements);
    this.stage.height(this.container.offsetHeight);
    this.stage.width(this.container.offsetWidth);
    this.getAllCoordinates().forEach((c) => {
      const space = this.spaceCoordinateMap.get(c);
      this.setSpacePositionFromCoordinate(space, c);
      this.setSpaceSize(space);
    });
    this.pieceCoordinateMap.forEach(
      (coordinate: ICoordinate, image: Konva.Image) => {
        this.setSpacePositionFromCoordinate(image, coordinate);
        this.setPieceSize(image);
      }
    );
    this.clearHighlight();
    this.setupPieceCoordinateMap.forEach(
      (image: Konva.Image, index: number) => {
        this.setSpacePositionFromSetupIndex(image, index);
        this.setPieceSize(image);
      }
    );
    this.setupTerrainCoordinateMap.forEach(
      (shape: Konva.Shape, index: number) => {
        this.setSpacePositionFromSetupIndex(shape, index);
        this.setSpaceSize(shape);
        this.setTerrainFillPatternScale(shape);
      }
    );
    if (options.inSetup) {
      this.markTerritories(
        options.setupRequirements.territories,
        options.color
      );
    }
    this.spaceLayer.draw();
    this.pieceLayer.draw();
    this.terrainLayer.draw();
  }

  // Protected abstract

  protected abstract coordinateToPosition(coordinate: ICoordinate): ICoordinate;

  protected abstract createSpaceShape(): Konva.Shape;

  protected abstract getAllCoordinates(): ICoordinate[];

  protected abstract getPieceSize(): number;

  protected abstract getSetupSize(): number;

  protected abstract getTerrainImageOffset(imageSize: ICoordinate): ICoordinate;

  protected abstract getTerrainImageScaleReference(): number;

  protected abstract setSpaceSize(space: Konva.Shape): void;

  protected abstract setupForContainer(
    setupRequirements: IGameSetupRequirements
  ): void;

  // Protected

  protected getMaxSize(): ICoordinate {
    return {
      x: this.container.offsetWidth - 2 * this.padding,
      y: this.container.offsetHeight - 2 * this.padding,
    };
  }

  protected getOffset(): ICoordinate {
    return {
      x: (this.container.offsetWidth - this.size.x) / 2 + this.setupWidth / 2,
      y: (this.container.offsetHeight - this.size.y) / 2,
    };
  }

  // Private

  private addCoordinateText(shape: Konva.Shape, coordinate: ICoordinate): void {
    var text = new Konva.Text({
      x: shape.attrs.x,
      y: shape.attrs.y,
      text: `${coordinate.x},${coordinate.y}`,
    });
    text.offsetX(text.getWidth() / 2);
    text.offsetY(text.getHeight() / 2);
    this.spaceLayer.add(text);
  }

  private addSetupPiece(index: number, piece: IPiece): void {
    Konva.Image.fromURL(
      `/assets/piece/default/${piece.pieceTypeId}_${piece.playerColor}.svg`,
      (image: Konva.Image) => {
        this.setSpacePositionFromSetupIndex(image, index);
        this.setPieceSize(image);
        this.setupPieceCoordinateMap.set(index, image);
        this.pieceLayer.add(image);
        this.pieceLayer.draw();
      }
    );
  }

  private addSetupTerrain(index: number, terrain: ITerrain): void {
    const image = new Image();
    image.src = `/assets/terrain/default/${terrain.terrainTypeId}.svg`;
    image.onload = () => {
      const terrain = this.createSpaceShape();
      this.setSpacePositionFromSetupIndex(terrain, index);
      this.setSpaceSize(terrain);
      terrain.fillPatternImage(image);
      terrain.fillPatternRepeat("no-repeat");
      terrain.fillPatternOffset(
        this.getTerrainImageOffset({ x: image.width, y: image.height })
      );
      this.setTerrainFillPatternScale(terrain);
      this.setupTerrainCoordinateMap.set(index, terrain);
      this.terrainLayer.add(terrain);
      this.terrainLayer.draw();
    };
  }

  private getSetupPosition(index: number): ICoordinate {
    const setupSize = this.getSetupSize();
    const row = Math.floor(index / this.setupColumns) % this.setupRows;
    const column = index % this.setupColumns;
    return {
      x: column * setupSize + setupSize / 2 + this.padding,
      y: row * setupSize + setupSize / 2 + this.padding,
    };
  }

  private markTerritories(
    territories: IGameSetupTerritories,
    playerColor: PlayerColor
  ): void {
    territories.neutral.forEach((c) => {
      const shape = this.spaceCoordinateMap.get(c);
      this.toggleSpaceHighlight(shape, SpaceHighlight.TERRITORY_NEUTRAL);
    });
    if (playerColor !== PlayerColor.ALABASTER) {
      territories.alabaster.forEach((c) => {
        const shape = this.spaceCoordinateMap.get(c);
        this.toggleSpaceHighlight(shape, SpaceHighlight.TERRITORY_OPPONENT);
      });
    }
    if (playerColor !== PlayerColor.ONYX) {
      territories.onyx.forEach((c) => {
        const shape = this.spaceCoordinateMap.get(c);
        this.toggleSpaceHighlight(shape, SpaceHighlight.TERRITORY_OPPONENT);
      });
    }
    this.spaceLayer.draw();
  }

  private setPieceSize(image: Konva.Image): void {
    const size = this.getPieceSize();
    image.offset({ x: size / 2, y: size / 2 });
    image.height(size);
    image.width(size);
  }

  private setSpacePositionFromCoordinate(
    shape: Konva.Shape,
    coordinate: ICoordinate
  ): void {
    const position = this.coordinateToPosition(coordinate);
    shape.x(position.x);
    shape.y(position.y);
  }

  private setSpacePositionFromSetupIndex(
    shape: Konva.Shape,
    index: number
  ): void {
    const position = this.getSetupPosition(index);
    shape.x(position.x);
    shape.y(position.y);
  }

  private setTerrainFillPatternScale(shape: Konva.Shape): void {
    const scaleReference = this.getTerrainImageScaleReference();
    const image = shape.fillPatternImage();
    shape.fillPatternScale({
      x: scaleReference / image.width,
      y: scaleReference / image.height,
    });
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
