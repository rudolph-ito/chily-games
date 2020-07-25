import Konva from "konva";
import {
  ICoordinate,
  PlayerColor,
  ValidPlies,
  IPiece,
  IGameSetupTerritories,
  IGameSetupRequirements,
  ITerrain,
  IGameSetupChange,
  IGame,
  Action,
} from "../../shared/dtos/game";
import { CoordinateMap } from "./coordinate_map";
import { doesHaveValue } from "../../shared/utilities/value_checker";

export enum SpaceHighlight {
  NONE = "",
  MOVEMENT_ORIGIN = "#00CC00",
  MOVEMENT_FREE = "#006633",
  TERRITORY_NEUTRAL = "#A8A8A8",
  TERRITORY_OPPONENT = "#505050",
}

export interface IUpdateOptions {
  color: PlayerColor;
  game: IGame;
  setupRequirements: IGameSetupRequirements;
}

export interface IGameCallbacks {
  onUpdateSetup: (setupChange: IGameSetupChange) => Promise<boolean>;
}

export interface IBoardOptions {
  element: HTMLDivElement;
  color: PlayerColor;
  game?: IGame;
  gameCallbacks?: IGameCallbacks;
  setupRequirements?: IGameSetupRequirements;
}

interface IKonvaPositionalAttributes {
  cyvasseCoordinate?: ICoordinate;
  cyvasseSetupIndex?: number;
}

export abstract class BaseBoard {
  private readonly container: HTMLDivElement;
  private readonly gameCallbacks: IGameCallbacks;
  private readonly stage: Konva.Stage;
  private readonly padding: number;
  private readonly spaceLayer: Konva.Layer;
  private readonly spaceCoordinateTextLayer: Konva.Layer;
  private readonly pieceLayer: Konva.Layer;
  private readonly terrainLayer: Konva.Layer;
  private game: IGame;
  protected color: PlayerColor;
  protected size: ICoordinate;
  protected setupWidth: number;
  protected setupRows: number;
  protected setupColumns: number;

  constructor(options: IBoardOptions) {
    this.container = options.element;
    this.game = options.game;
    this.gameCallbacks = options.gameCallbacks;
    this.color = options.color;
    this.padding = 10;
    this.stage = new Konva.Stage({
      container: this.container,
      height: this.container.offsetHeight,
      width: this.container.offsetWidth,
    });
    this.spaceLayer = new Konva.Layer();
    this.stage.add(this.spaceLayer);
    this.spaceCoordinateTextLayer = new Konva.Layer();
    this.stage.add(this.spaceCoordinateTextLayer);
    this.terrainLayer = new Konva.Layer();
    this.stage.add(this.terrainLayer);
    this.pieceLayer = new Konva.Layer();
    this.stage.add(this.pieceLayer);
  }

  // Public Functions

  public async addPieceAtCoordinate(
    piece: IPiece,
    coordinate: ICoordinate,
    draw: boolean = false
  ): Promise<void> {
    this.addPiece(piece, { cyvasseCoordinate: coordinate });
    if (draw) {
      this.pieceLayer.draw();
    }
  }

  public addSpaces(showCoordinates: boolean): void {
    this.getAllCoordinates().forEach((coordinate) => {
      const shape = this.createSpaceShape();
      shape.setAttr("cyvasseCoordinate", coordinate);
      this.resetShapePosition(shape);
      this.setSpaceSize(shape);
      this.spaceLayer.add(shape);
      if (showCoordinates) {
        this.addCoordinateText(coordinate);
      }
    });
    this.spaceLayer.draw();
    this.spaceCoordinateTextLayer.draw();
  }

  public async addSetup(
    setupRequirements: IGameSetupRequirements
  ): Promise<void> {
    if (this.color !== null) {
      const setupCoordinateMap =
        this.color === PlayerColor.ALABASTER
          ? this.game.alabasterSetupCoordinateMap
          : this.game.onyxSetupCoordinateMap;
      setupCoordinateMap.forEach((datum) => {
        if (doesHaveValue(datum.value.piece)) {
          this.addPiece(datum.value.piece, { cyvasseCoordinate: datum.key });
        }
        if (doesHaveValue(datum.value.terrain)) {
          this.addTerrain(datum.value.terrain, {
            cyvasseCoordinate: datum.key,
          });
        }
      });

      let index = 0;
      setupRequirements.pieces.map((setupPieceRequirement) => {
        const currentCount = setupCoordinateMap.filter(({value: {piece}}) => doesHaveValue(piece) && piece.pieceTypeId == setupPieceRequirement.pieceTypeId).length;
        for (let i = 0; i < setupPieceRequirement.count - currentCount; i++) {
          this.addPiece(
            {
              pieceTypeId: setupPieceRequirement.pieceTypeId,
              playerColor: this.color,
            },
            { cyvasseSetupIndex: index }
          );
          index++;
        }
      });
      setupRequirements.terrains.forEach((setupTerrainRequirement) => {
        const currentCount = setupCoordinateMap.filter(({value: {terrain}}) => doesHaveValue(terrain) && terrain.terrainTypeId == setupTerrainRequirement.terrainTypeId).length;
        for (let i = 0; i < setupTerrainRequirement.count - currentCount; i++) {
          this.addTerrain(
            {
              terrainTypeId: setupTerrainRequirement.terrainTypeId,
              playerColor: this.color,
            },
            { cyvasseSetupIndex: index }
          );
          index++;
        }
      });
    }
    this.pieceLayer.draw();
    this.terrainLayer.draw();
  }

  public clearHighlight(): void {
    this.spaceLayer.children.each((shape: Konva.Shape) =>
      this.toggleSpaceHighlight(shape, SpaceHighlight.NONE)
    );
  }

  public clearPieces(): void {
    this.pieceLayer.removeChildren();
    this.pieceLayer.draw();
  }

  public destroy(): void {
    this.stage.destroy();
  }

  public highlightValidPlies(validPlies: ValidPlies): void {
    const coordinateToSpaceHighlight = new CoordinateMap<SpaceHighlight>();
    this.getAllCoordinates().forEach((c) =>
      coordinateToSpaceHighlight.set(c, SpaceHighlight.NONE)
    );
    validPlies.free.forEach((c) =>
      coordinateToSpaceHighlight.set(c, SpaceHighlight.MOVEMENT_FREE)
    );
    this.spaceLayer.children.each((shape: Konva.Shape) => {
      this.toggleSpaceHighlight(
        shape,
        coordinateToSpaceHighlight.get(shape.getAttr("cyvasseCoordinate"))
      );
    });
    this.spaceLayer.draw();
  }

  public update(options: IUpdateOptions): void {
    const oldColor = this.color;
    this.color = options.color;
    this.game = options.game;
    if (this.game.action === Action.SETUP && oldColor !== this.color) {
      this.pieceLayer.children.each((image) => image.destroy());
      this.terrainLayer.children.each((image) => image.destroy());
      this.addSetup(options.setupRequirements);
    }
    this.setupForContainer(options.setupRequirements);
    this.stage.height(this.container.offsetHeight);
    this.stage.width(this.container.offsetWidth);
    this.spaceLayer.children.each((shape: Konva.Shape) => {
      this.resetShapePosition(shape);
      this.setSpaceSize(shape);
    });
    this.spaceCoordinateTextLayer.children.each((text: Konva.Text) => {
      this.resetShapePosition(text);
    });
    this.pieceLayer.children.each((image: Konva.Image) => {
      this.resetShapePosition(image);
      this.setPieceSize(image);
    });
    this.terrainLayer.children.each((shape: Konva.Shape) => {
      this.resetShapePosition(shape);
      this.setSpaceSize(shape);
      this.setTerrainFillPatternScale(shape);
    });
    if (this.game.action === Action.SETUP) {
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

  protected abstract doesCoordinateContainPosition(
    coordinate: ICoordinate,
    position: ICoordinate
  ): boolean;

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

  private addCoordinateText(coordinate: ICoordinate): void {
    var text = new Konva.Text({
      text: `${coordinate.x},${coordinate.y}`,
    });
    text.setAttrs({ cyvasseCoordinate: coordinate });
    this.resetShapePosition(text);
    text.offsetX(text.getWidth() / 2);
    text.offsetY(text.getHeight() / 2);
    this.spaceCoordinateTextLayer.add(text);
  }

  public async addPiece(
    piece: IPiece,
    konvaPositionalAttributes: IKonvaPositionalAttributes
  ): Promise<void> {
    const image = await this.loadPieceImage(piece);
    image.draggable(true);
    image.setAttr("cyvassePiece", piece);
    image.setAttrs(konvaPositionalAttributes);
    image.on("dragend", () => this.onPieceDragEnd(image));
    this.resetShapePosition(image);
    this.setPieceSize(image);
    this.pieceLayer.add(image);
    this.pieceLayer.draw();
  }

  private async addTerrain(
    terrain: ITerrain,
    konvaPositionalAttributes: IKonvaPositionalAttributes
  ): Promise<void> {
    const terrainSpace = await this.createTerrain(terrain);
    terrainSpace.draggable(true);
    terrainSpace.setAttr("cyvasseTerrain", terrain);
    terrainSpace.setAttrs(konvaPositionalAttributes);
    terrainSpace.on("dragend", () => this.onTerrainDragEnd(terrainSpace));
    this.resetShapePosition(terrainSpace);
    this.setSpaceSize(terrainSpace);
    this.terrainLayer.add(terrainSpace);
    this.terrainLayer.draw();
  }

  private async createTerrain(terrain: ITerrain): Promise<Konva.Shape> {
    return await new Promise((resolve) => {
      const image = new Image();
      image.src = `/assets/terrain/default/${terrain.terrainTypeId}.svg`;
      image.onload = () => {
        const terrain = this.createSpaceShape();
        terrain.fillPatternImage(image);
        terrain.fillPatternRepeat("no-repeat");
        terrain.fillPatternOffset(
          this.getTerrainImageOffset({ x: image.width, y: image.height })
        );
        this.setTerrainFillPatternScale(terrain);
        resolve(terrain);
      };
    });
  }

  private getNearestCoordinate(position: ICoordinate): ICoordinate {
    let matchingCoordinate = null;
    this.getAllCoordinates().forEach((coordinate) => {
      if (this.doesCoordinateContainPosition(coordinate, position)) {
        matchingCoordinate = coordinate;
      }
    });
    return matchingCoordinate;
  }

  private getFirstOpenSetupIndex(): number {
    let existingIndices: number[] = [];
    this.pieceLayer.children.each((image: Konva.Image) => {
      if (doesHaveValue(image.getAttr('cyvasseSetupIndex'))) {
        existingIndices.push(image.getAttr('cyvasseSetupIndex'))
      }
    })
    this.terrainLayer.children.each((shape: Konva.Shape) => {
      if (doesHaveValue(shape.getAttr('cyvasseSetupIndex'))) {
        existingIndices.push(shape.getAttr('cyvasseSetupIndex'))
      }
    })
    existingIndices.sort()
    for (let i = 0; i < existingIndices.length; i++) {
      if (existingIndices[i] !== i) {
        return i
      }
    } 
    return existingIndices.length;
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

  private async loadPieceImage(piece: IPiece): Promise<Konva.Image> {
    return await new Promise((resolve) => {
      Konva.Image.fromURL(
        `/assets/piece/default/${piece.pieceTypeId}_${piece.playerColor}.svg`,
        (image: Konva.Image) => {
          resolve(image);
        }
      );
    });
  }

  private markTerritories(
    territories: IGameSetupTerritories,
    playerColor: PlayerColor
  ): void {
    const coordinateToSpaceHighlight = new CoordinateMap<SpaceHighlight>();
    this.getAllCoordinates().forEach((c) =>
      coordinateToSpaceHighlight.set(c, SpaceHighlight.NONE)
    );
    territories.neutral.forEach((c) =>
      coordinateToSpaceHighlight.set(c, SpaceHighlight.TERRITORY_NEUTRAL)
    );
    if (playerColor !== PlayerColor.ALABASTER) {
      territories.alabaster.forEach((c) =>
        coordinateToSpaceHighlight.set(c, SpaceHighlight.TERRITORY_OPPONENT)
      );
    }
    if (playerColor !== PlayerColor.ONYX) {
      territories.onyx.forEach((c) =>
        coordinateToSpaceHighlight.set(c, SpaceHighlight.TERRITORY_OPPONENT)
      );
    }
    this.spaceLayer.children.each((shape: Konva.Shape) => {
      const coordinate = shape.getAttr("cyvasseCoordinate");
      this.toggleSpaceHighlight(
        shape,
        coordinateToSpaceHighlight.get(coordinate)
      );
    });
    this.spaceLayer.draw();
  }

  private async onPieceDragEnd(image: Konva.Image): Promise<void> {
    const from = image.getAttr("cyvasseCoordinate");
    const to = this.getNearestCoordinate(image.position());
    if (this.game.action === Action.SETUP) {
      if (doesHaveValue(from) || doesHaveValue(to)) {
        const result = await this.gameCallbacks.onUpdateSetup({
          pieceChange: {
            pieceTypeId: image.getAttr("cyvassePiece").pieceTypeId,
            from,
            to
          },
        });
        if (result) {
          if (doesHaveValue(to)) {
            image.setAttrs({ cyvasseCoordinate: to, cyvasseSetupIndex: null });
          } else {
            image.setAttrs({ cyvasseCoordinate: null, cyvasseSetupIndex: this.getFirstOpenSetupIndex() })
          }
        }
      }
      this.resetShapePosition(image);
    }
    this.pieceLayer.draw();
  }

  private async onTerrainDragEnd(terrainSpace: Konva.Shape): Promise<void> {
    const from = terrainSpace.getAttr("cyvasseCoordinate");
    const to = this.getNearestCoordinate(terrainSpace.position());
    if (this.game.action === Action.SETUP) {
      if (doesHaveValue(from) || doesHaveValue(to)) {
        const result = await this.gameCallbacks.onUpdateSetup({
          terrainChange: {
            terrainTypeId: terrainSpace.getAttr("cyvasseTerrain").terrainTypeId,
            from,
            to,
          },
        });
        if (result) {
          if (doesHaveValue(to)) {
            terrainSpace.setAttrs({ cyvasseCoordinate: to, cyvasseSetupIndex: null });
          } else {
            terrainSpace.setAttrs({ cyvasseCoordinate: null, cyvasseSetupIndex: this.getFirstOpenSetupIndex() })
          }
        }
      }
      this.resetShapePosition(terrainSpace);
    }
    this.terrainLayer.draw();
  }

  private resetShapePosition(shape: Konva.Shape): void {
    if (doesHaveValue(shape.getAttr("cyvasseCoordinate"))) {
      this.setSpacePositionFromCoordinate(
        shape,
        shape.getAttr("cyvasseCoordinate")
      );
    } else {
      this.setSpacePositionFromSetupIndex(
        shape,
        shape.getAttr("cyvasseSetupIndex")
      );
    }
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
