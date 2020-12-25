import { Stage as KonvaStage } from "konva/lib/Stage";
import { Layer as KonvaLayer } from "konva/lib/Layer";
import { Shape as KonvaShape } from "konva/lib/Shape";
import { Image as KonvaImage } from "konva/lib/shapes/Image";
import { Text as KonvaText } from "konva/lib/shapes/Text";
import {
  ICoordinate,
  PlayerColor,
  ValidPlies,
  IPiece,
  IGameSetupTerritories,
  IGameRules,
  ITerrain,
  IGameSetupChange,
  IGame,
  Action,
  IGamePly,
  IGetGameValidPliesRequest,
  IGamePieceRule,
} from "../../shared/dtos/cyvasse/game";
import { CoordinateMap } from "./coordinate_map";
import { doesHaveValue } from "../../shared/utilities/value_checker";
import { areCoordinatesEqual } from "./coordinate_helpers";
import { CaptureType, PieceType } from "../../shared/dtos/cyvasse/piece_rule";

export enum SpaceHighlight {
  NONE = "",
  LAST_PLY_MOVEMENT = "#FFFF33",
  LAST_PLY_RANGE_CAPTURE = "#0066CC",
  MOVEMENT_ORIGIN = "#00CC00",
  MOVEMENT_FREE = "#006633",
  RANGE_ORIGIN = "#CC0000",
  RANGE_FREE = "#660033",
  TERRITORY_NEUTRAL = "#A8A8A8",
  TERRITORY_OPPONENT = "#505050",
}

export enum SpaceHighlightState {
  LAST_PLY = "last_ply",
  MOVEMENT_PREVIEW = "movement_preview",
  RANGE_CAPTURE_PREVIEW = "range_capture_preview",
}

export interface IUpdateOptions {
  color: PlayerColor | null;
  game: IGame;
  gameRules: IGameRules;
}

export interface IGameCallbacks {
  onGetValidPlies: (request: IGetGameValidPliesRequest) => Promise<ValidPlies>;
  onUpdateSetup: (setupChange: IGameSetupChange) => Promise<boolean>;
  onCreatePly: (ply: IGamePly) => Promise<boolean>;
}

export interface IBoardOptions {
  element: HTMLDivElement;
  color: PlayerColor | null;
  game?: IGame;
  gameCallbacks?: IGameCallbacks;
  gameRules?: IGameRules;
}

export interface ValidPliesDetails {
  origin: ICoordinate;
  evaluationType: CaptureType;
  validPlies: ValidPlies;
}

interface IKonvaPositionalAttributes {
  cyvasseCoordinate?: ICoordinate;
  cyvasseSetupIndex?: number;
}

export abstract class BaseBoard {
  private readonly container: HTMLDivElement;
  private readonly gameCallbacks?: IGameCallbacks;
  private readonly gameRules?: IGameRules;
  private readonly stage: KonvaStage;
  private readonly padding: number;
  private readonly spaceLayer: KonvaLayer;
  private readonly spaceCoordinateTextLayer: KonvaLayer;
  private readonly pieceLayer: KonvaLayer;
  private readonly terrainLayer: KonvaLayer;
  private validPliesDetails: ValidPliesDetails | null;
  protected game?: IGame;
  protected color: PlayerColor | null;
  protected size: ICoordinate;
  protected setupWidth: number;
  protected setupRows: number;
  protected setupColumns: number;

  constructor(options: IBoardOptions) {
    this.container = options.element;
    this.game = options.game;
    this.gameCallbacks = options.gameCallbacks;
    this.gameRules = options.gameRules;
    this.color = options.color;
    this.padding = 10;
    this.stage = new KonvaStage({
      container: this.container,
      height: this.container.offsetHeight,
      width: this.container.offsetWidth,
    });
    this.terrainLayer = new KonvaLayer();
    this.stage.add(this.terrainLayer);
    this.spaceLayer = new KonvaLayer();
    this.stage.add(this.spaceLayer);
    this.spaceCoordinateTextLayer = new KonvaLayer();
    this.stage.add(this.spaceCoordinateTextLayer);
    this.pieceLayer = new KonvaLayer();
    this.stage.add(this.pieceLayer);
  }

  // Public Functions

  public async addPieceAtCoordinate(
    piece: IPiece,
    coordinate: ICoordinate
  ): Promise<void> {
    await this.addPiece(piece, { cyvasseCoordinate: coordinate });
    this.pieceLayer.draw();
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

  public async addCurrentSetup(): Promise<void> {
    if (this.game == null) {
      throw new Error("Game required");
    }
    for (const datum of this.game.currentCoordinateMap) {
      if (datum.value.piece != null) {
        await this.addPiece(datum.value.piece, {
          cyvasseCoordinate: datum.key,
        });
      }
      if (datum.value.terrain != null) {
        await this.addTerrain(datum.value.terrain, {
          cyvasseCoordinate: datum.key,
        });
      }
    }
  }

  public async addSetup(): Promise<void> {
    if (this.game == null || this.gameRules == null) {
      throw new Error("Game required");
    }
    if (this.color != null) {
      const setupCoordinateMap =
        this.color === PlayerColor.ALABASTER
          ? this.game.alabasterSetupCoordinateMap
          : this.game.onyxSetupCoordinateMap;
      for (const datum of setupCoordinateMap) {
        if (datum.value.piece != null) {
          await this.addPiece(datum.value.piece, {
            cyvasseCoordinate: datum.key,
          });
        }
        if (datum.value.terrain != null) {
          await this.addTerrain(datum.value.terrain, {
            cyvasseCoordinate: datum.key,
          });
        }
      }

      let index = 0;
      for (const pieceRule of this.gameRules.pieces) {
        const currentCount = setupCoordinateMap.filter(
          ({ value: { piece } }) =>
            piece != null && piece.pieceTypeId === pieceRule.pieceTypeId
        ).length;
        for (let i = 0; i < pieceRule.count - currentCount; i++) {
          await this.addPiece(
            {
              pieceTypeId: pieceRule.pieceTypeId,
              playerColor: this.color,
            },
            { cyvasseSetupIndex: index }
          );
          index++;
        }
      }
      for (const terrainRule of this.gameRules.terrains) {
        const currentCount = setupCoordinateMap.filter(
          ({ value: { terrain } }) =>
            terrain != null &&
            terrain.terrainTypeId === terrainRule.terrainTypeId
        ).length;
        for (let i = 0; i < terrainRule.count - currentCount; i++) {
          await this.addTerrain(
            {
              terrainTypeId: terrainRule.terrainTypeId,
              playerColor: this.color,
            },
            { cyvasseSetupIndex: index }
          );
          index++;
        }
      }
    }
    this.pieceLayer.draw();
    this.terrainLayer.draw();
  }

  public applyPly(ply: IGamePly): void {
    if (ply.movement != null) {
      const movement = ply.movement;
      this.pieceLayer.children.each((image: KonvaImage) => {
        const coordinate = image.getAttr("cyvasseCoordinate");
        if (areCoordinatesEqual(coordinate, ply.from)) {
          image.setAttrs({ cyvasseCoordinate: movement.to });
          this.resetShapePosition(image);
        }
        if (
          doesHaveValue(movement.capturedPiece) &&
          areCoordinatesEqual(coordinate, movement.to)
        ) {
          image.remove();
        }
      });
      this.highlightLastPly();
    }
    this.pieceLayer.draw();
  }

  public clearHighlight(): void {
    this.spaceLayer.children.each((shape: KonvaShape) =>
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

  public highlightValidPlies(validPliesDetails: ValidPliesDetails): void {
    const coordinateToSpaceHighlight = new CoordinateMap<SpaceHighlight>();
    this.getAllCoordinates().forEach((c) =>
      coordinateToSpaceHighlight.set(c, SpaceHighlight.NONE)
    );
    const originHighlight =
      validPliesDetails.evaluationType === CaptureType.MOVEMENT
        ? SpaceHighlight.MOVEMENT_ORIGIN
        : SpaceHighlight.RANGE_ORIGIN;
    const freeHighlight =
      validPliesDetails.evaluationType === CaptureType.MOVEMENT
        ? SpaceHighlight.MOVEMENT_FREE
        : SpaceHighlight.RANGE_FREE;
    coordinateToSpaceHighlight.set(validPliesDetails.origin, originHighlight);
    validPliesDetails.validPlies.free.forEach((c) =>
      coordinateToSpaceHighlight.set(c, freeHighlight)
    );
    validPliesDetails.validPlies.capturable.forEach((c) => {
      coordinateToSpaceHighlight.set(c, freeHighlight);
    });
    // TODO reachable
    this.spaceLayer.children.each((shape: KonvaShape) => {
      const value = coordinateToSpaceHighlight.get(
        shape.getAttr("cyvasseCoordinate")
      );
      if (value != null) {
        this.toggleSpaceHighlight(shape, value);
      }
    });
    this.spaceLayer.draw();
    this.validPliesDetails = validPliesDetails;
  }

  public async update(options: IUpdateOptions): Promise<void> {
    const oldColor = this.color;
    this.color = options.color;
    this.game = options.game;
    if (this.game.action === Action.SETUP && oldColor !== this.color) {
      this.pieceLayer.destroyChildren();
      this.terrainLayer.destroyChildren();
      await this.addSetup();
    }
    this.setupForContainer(this.gameRules);
    this.stage.height(this.container.offsetHeight);
    this.stage.width(this.container.offsetWidth);
    this.spaceLayer.children.each((shape: KonvaShape) => {
      this.resetShapePosition(shape);
      this.setSpaceSize(shape);
    });
    this.spaceCoordinateTextLayer.children.each((text: KonvaText) => {
      this.resetShapePosition(text);
    });
    this.pieceLayer.children.each((image: KonvaImage) => {
      this.resetShapePosition(image);
      this.setPieceSize(image);
    });
    this.terrainLayer.children.each((shape: KonvaShape) => {
      this.resetShapePosition(shape);
      this.setSpaceSize(shape);
      this.setTerrainFillPatternScale(shape);
    });
    if (this.game.action === Action.SETUP) {
      this.markTerritories(options.gameRules.setupTerritories, options.color);
    } else {
      this.highlightLastPly();
    }
    this.spaceLayer.draw();
    this.spaceCoordinateTextLayer.draw();
    this.pieceLayer.draw();
    this.terrainLayer.draw();
  }

  // Protected abstract

  protected abstract coordinateToPosition(coordinate: ICoordinate): ICoordinate;

  protected abstract createSpaceShape(): KonvaShape;

  protected abstract doesCoordinateContainPosition(
    coordinate: ICoordinate,
    position: ICoordinate
  ): boolean;

  protected abstract getAllCoordinates(): ICoordinate[];

  protected abstract getPieceSize(): number;

  protected abstract getSetupSize(): number;

  protected abstract getTerrainImageOffset(imageSize: ICoordinate): ICoordinate;

  protected abstract getTerrainImageScaleReference(): number;

  protected abstract setSpaceSize(space: KonvaShape): void;

  protected abstract setupForContainer(gameRules?: IGameRules): void;

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
    var text = new KonvaText({
      text: `${coordinate.x},${coordinate.y}`,
    });
    text.setAttrs({ cyvasseCoordinate: coordinate });
    this.resetShapePosition(text);
    text.offsetX(text.getWidth() / 2);
    text.offsetY(text.getHeight() / 2);
    this.spaceCoordinateTextLayer.add(text);
  }

  private async addPiece(
    piece: IPiece,
    konvaPositionalAttributes: IKonvaPositionalAttributes
  ): Promise<void> {
    const image = await this.loadPieceImage(piece);
    image.draggable(true);
    image.setAttr("cyvassePiece", piece);
    image.setAttrs(konvaPositionalAttributes);
    image.on("click", () => {
      this.onPieceClick(image); // eslint-disable-line @typescript-eslint/no-floating-promises
    });
    image.on("dragend", () => {
      this.onPieceDragEnd(image); // eslint-disable-line @typescript-eslint/no-floating-promises
    });
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
    terrainSpace.on("dragend", () => {
      this.onTerrainDragEnd(terrainSpace); // eslint-disable-line @typescript-eslint/no-floating-promises
    });
    this.resetShapePosition(terrainSpace);
    this.setSpaceSize(terrainSpace);
    this.terrainLayer.add(terrainSpace);
    this.terrainLayer.draw();
  }

  private async createTerrain(terrain: ITerrain): Promise<KonvaShape> {
    return await new Promise((resolve) => {
      const image = new Image();
      image.src = `/assets/cyvasse/terrain/default/${terrain.terrainTypeId}.svg`;
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

  private getPieceAtCoordinate(coordinate: ICoordinate): IPiece | null {
    const image = this.pieceLayer.children
      .toArray()
      .find((image: KonvaImage) => {
        const pieceCoordinate = image.getAttr("cyvasseCoordinate");
        return areCoordinatesEqual(coordinate, pieceCoordinate);
      });
    if (image != null) {
      return image.getAttr("cyvassePiece");
    }
    return null;
  }

  private getNearestCoordinate(position: ICoordinate): ICoordinate | null {
    let matchingCoordinate: ICoordinate | null = null;
    this.getAllCoordinates().forEach((coordinate) => {
      if (this.doesCoordinateContainPosition(coordinate, position)) {
        matchingCoordinate = coordinate;
      }
    });
    return matchingCoordinate;
  }

  private getFirstOpenSetupIndex(): number {
    const existingIndices: number[] = [];
    this.pieceLayer.children.each((image: KonvaImage) => {
      if (doesHaveValue(image.getAttr("cyvasseSetupIndex"))) {
        existingIndices.push(image.getAttr("cyvasseSetupIndex"));
      }
    });
    this.terrainLayer.children.each((shape: KonvaShape) => {
      if (doesHaveValue(shape.getAttr("cyvasseSetupIndex"))) {
        existingIndices.push(shape.getAttr("cyvasseSetupIndex"));
      }
    });
    existingIndices.sort((a, b) => a - b);
    for (let i = 0; i < existingIndices.length; i++) {
      if (existingIndices[i] !== i) {
        return i;
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

  private highlightLastPly(): void {
    if (this.game == null) {
      throw new Error("Game required");
    }
    if (this.game.plies.length > 0) {
      const lastPly = this.game.plies[this.game.plies.length - 1];
      this.clearHighlight();
      this.spaceLayer.children.each((shape: KonvaShape) => {
        const coordinate = shape.getAttr("cyvasseCoordinate");
        if (areCoordinatesEqual(coordinate, lastPly.from)) {
          this.toggleSpaceHighlight(shape, SpaceHighlight.LAST_PLY_MOVEMENT);
        }
        if (
          lastPly.movement != null &&
          areCoordinatesEqual(coordinate, lastPly.movement.to)
        ) {
          this.toggleSpaceHighlight(shape, SpaceHighlight.LAST_PLY_MOVEMENT);
        }
        if (
          lastPly.rangeCapture != null &&
          areCoordinatesEqual(coordinate, lastPly.rangeCapture.to)
        ) {
          this.toggleSpaceHighlight(
            shape,
            SpaceHighlight.LAST_PLY_RANGE_CAPTURE
          );
        }
      });
      this.spaceLayer.draw();
    }
  }

  private async loadPieceImage(piece: IPiece): Promise<KonvaImage> {
    return await new Promise((resolve) => {
      KonvaImage.fromURL(
        `/assets/cyvasse/piece/default/${piece.pieceTypeId}_${piece.playerColor}.svg`,
        (image: KonvaImage) => {
          resolve(image);
        }
      );
    });
  }

  private markTerritories(
    territories: IGameSetupTerritories,
    playerColor: PlayerColor | null
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
    this.spaceLayer.children.each((shape: KonvaShape) => {
      const coordinate = shape.getAttr("cyvasseCoordinate");
      const value = coordinateToSpaceHighlight.get(coordinate);
      if (value != null) {
        this.toggleSpaceHighlight(shape, value);
      }
    });
    this.spaceLayer.draw();
  }

  private getPieceRule(pieceTypeId: PieceType): IGamePieceRule {
    if (this.gameRules == null) {
      throw new Error("Game required");
    }
    for (const pieceRule of this.gameRules.pieces) {
      if (pieceRule.pieceTypeId === pieceTypeId) {
        return pieceRule;
      }
    }
    throw Error(`Piece rule not found for piece type id: ${pieceTypeId}`);
  }

  private async onPieceClick(image: KonvaImage): Promise<void> {
    if (this.game == null || this.gameCallbacks == null) {
      throw new Error("Game required");
    }
    const coordinate: ICoordinate = image.getAttr("cyvasseCoordinate");
    if (doesHaveValue(coordinate) && this.game.action === Action.PLAY) {
      // If currently viewing range and clicked capturable square, attempt capture
      if (
        this.validPliesDetails != null &&
        this.validPliesDetails.evaluationType === CaptureType.RANGE &&
        this.validPliesDetails.validPlies.capturable.some((c) =>
          areCoordinatesEqual(c, coordinate)
        )
      ) {
        const piece = this.getPieceAtCoordinate(this.validPliesDetails.origin);
        if (piece == null) {
          throw new Error("Piece not found");
        }
        const ply: IGamePly = {
          piece,
          from: this.validPliesDetails.origin,
          rangeCapture: {
            to: coordinate,
            capturedPiece: image.getAttr("cyvassePiece"),
          },
        };
        const result = await this.gameCallbacks.onCreatePly(ply);
        if (result) {
          image.remove();
          this.highlightLastPly();
        }
        return;
      }

      let evaluationType: CaptureType | null = null;

      // Show range if currently viewing movement for a piece that captures by range
      if (
        this.validPliesDetails != null &&
        areCoordinatesEqual(this.validPliesDetails.origin, coordinate)
      ) {
        if (this.validPliesDetails.evaluationType === CaptureType.MOVEMENT) {
          const pieceRule = this.getPieceRule(
            image.getAttr("cyvassePiece").pieceTypeId
          );
          if (pieceRule.captureType === CaptureType.RANGE) {
            evaluationType = CaptureType.RANGE;
          }
        }
      } else {
        evaluationType = CaptureType.MOVEMENT;
      }

      if (evaluationType != null) {
        const validPlies = await this.gameCallbacks.onGetValidPlies({
          coordinate,
          evaluationType,
        });
        this.highlightValidPlies({
          origin: coordinate,
          evaluationType,
          validPlies,
        });
      } else {
        this.validPliesDetails = null;
        this.highlightLastPly();
      }
    }
  }

  private async onPieceDragEnd(image: KonvaImage): Promise<void> {
    if (this.game == null || this.gameCallbacks == null) {
      throw new Error("Game required");
    }
    const from: ICoordinate = image.getAttr("cyvasseCoordinate");
    const to = this.getNearestCoordinate(image.position());
    if (this.game.action === Action.SETUP) {
      if (from != null || to != null) {
        const result = await this.gameCallbacks.onUpdateSetup({
          pieceChange: {
            pieceTypeId: image.getAttr("cyvassePiece").pieceTypeId,
            from,
            to,
          },
        });
        if (result) {
          if (doesHaveValue(to)) {
            image.setAttrs({ cyvasseCoordinate: to, cyvasseSetupIndex: null });
          } else {
            image.setAttrs({
              cyvasseCoordinate: null,
              cyvasseSetupIndex: this.getFirstOpenSetupIndex(),
            });
          }
        }
      }
      this.resetShapePosition(image);
    } else if (
      this.game.action === Action.PLAY &&
      this.color != null &&
      this.color === this.game.actionTo &&
      to != null
    ) {
      const capturedPiece = this.getPieceAtCoordinate(to);
      if (capturedPiece == null) {
        throw new Error("Captured piece not found");
      }
      // TODO stage ply if can move and range capture
      const ply: IGamePly = {
        piece: {
          pieceTypeId: image.getAttr("cyvassePiece").pieceTypeId,
          playerColor: this.color,
        },
        from,
        movement: {
          capturedPiece,
          to,
        },
      };
      const result = await this.gameCallbacks.onCreatePly(ply);
      if (result) {
        image.setAttrs({ cyvasseCoordinate: to });
      }
      this.resetShapePosition(image);
      this.highlightLastPly();
    } else {
      this.resetShapePosition(image);
    }
    this.pieceLayer.draw();
  }

  private async onTerrainDragEnd(terrainSpace: KonvaShape): Promise<void> {
    if (this.game == null || this.gameCallbacks == null) {
      throw new Error("Game required");
    }
    const from = terrainSpace.getAttr("cyvasseCoordinate");
    const to = this.getNearestCoordinate(terrainSpace.position());
    if (this.game.action === Action.SETUP) {
      if (from != null || to != null) {
        const result = await this.gameCallbacks.onUpdateSetup({
          terrainChange: {
            terrainTypeId: terrainSpace.getAttr("cyvasseTerrain").terrainTypeId,
            from,
            to,
          },
        });
        if (result) {
          if (to != null) {
            terrainSpace.setAttrs({
              cyvasseCoordinate: to,
              cyvasseSetupIndex: null,
            });
          } else {
            terrainSpace.setAttrs({
              cyvasseCoordinate: null,
              cyvasseSetupIndex: this.getFirstOpenSetupIndex(),
            });
          }
        }
      }
      this.resetShapePosition(terrainSpace);
    }
    this.terrainLayer.draw();
  }

  private resetShapePosition(shape: KonvaShape): void {
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

  private setPieceSize(image: KonvaImage): void {
    const size = this.getPieceSize();
    image.offset({ x: size / 2, y: size / 2 });
    image.height(size);
    image.width(size);
  }

  private setSpacePositionFromCoordinate(
    shape: KonvaShape,
    coordinate: ICoordinate
  ): void {
    const position = this.coordinateToPosition(coordinate);
    shape.x(position.x);
    shape.y(position.y);
  }

  private setSpacePositionFromSetupIndex(
    shape: KonvaShape,
    index: number
  ): void {
    const position = this.getSetupPosition(index);
    shape.x(position.x);
    shape.y(position.y);
  }

  private setTerrainFillPatternScale(shape: KonvaShape): void {
    const scaleReference = this.getTerrainImageScaleReference();
    const image = shape.fillPatternImage();
    shape.fillPatternScale({
      x: scaleReference / image.width,
      y: scaleReference / image.height,
    });
  }

  private toggleSpaceHighlight(shape: KonvaShape, value: SpaceHighlight): void {
    if (value === SpaceHighlight.NONE) {
      shape.fill("");
      shape.opacity(1);
    } else {
      shape.fill(value);
      shape.opacity(0.5);
    }
  }
}
