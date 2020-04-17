import Konva from "konva";
import terrainType from "../terrain_type";
import { Vector2d } from "konva/types/types";
import { IBoard, ISpace, ILayer } from "../intefaces";
import { doesHaveValue } from "../../shared/utilities/value_checker";

interface ISpaceOptions {
  board?: IBoard;
  boardCoordinate?: Vector2d;
  displayCoordinate: Vector2d;
  displayOption?: string;
  displayType?: string;
  layer?: ILayer;
}

export default abstract class Space implements ISpace {
  private readonly board: IBoard;
  private boardCoordinate: Vector2d;
  private displayCoordinate: Vector2d;
  private readonly displayOption: string;
  private readonly displayType: string;
  private dragging: boolean;
  private element: Konva.Shape;
  private readonly layer: ILayer;
  private size: number;

  constructor(options: ISpaceOptions) {
    this.board = options.board;
    this.boardCoordinate = options.boardCoordinate;
    this.displayCoordinate = options.displayCoordinate;
    this.displayType = options.displayType;
    this.displayOption = options.displayOption;
    this.layer = options.layer;
    this.init();
    this.update();
    this.setDisplay();
  }

  // ###########################################################
  // Init / Update
  // ###########################################################

  abstract initElement(): Konva.Shape;

  init(): void {
    this.element = this.initElement();
    this.element.on("click", this.click);
    this.element.on("dragstart", this.dragStart);
    this.element.on("dragend", this.dragEnd);
  }

  update(): void {
    this.updateSize();
    this.updatePosition();
    this.updateDraggable();
  }

  updateCoordinate(coordinate: Vector2d): void {
    this.boardCoordinate = coordinate;
    this.updatePosition();
  }

  updatePosition(): void {
    if (doesHaveValue(this.boardCoordinate)) {
      this.displayCoordinate = this.board.position(this.boardCoordinate);
    }
    this.element.x(this.displayCoordinate.x);
    this.element.y(this.displayCoordinate.y);
  }

  abstract updateElementSize(element: Konva.Shape, size: number): void;

  updateSize(): void {
    this.size = this.board.getSpaceSize();
    this.updateElementSize(this.element, this.size);
    if (this.displayType === "terrain") {
      this.updateTerrainSize();
    }
  }

  updateTerrainSize(): void {
    const image = this.element.fillPatternImage();
    if (doesHaveValue(image)) {
      this.element.fillPatternScale({
        x: this.size / image.width,
        y: this.size / image.height
      });
    }
  }

  updateDraggable(): void {
    this.element.setDraggable(this.draggable());
  }

  // ###########################################################
  // Display
  // ###########################################################

  setDisplay(): void {
    switch (this.displayType) {
      case "highlight":
        this.setHighlightDisplay();
        break;
      case "terrain":
        this.setTerrainDisplay();
        break;
      case "territory":
        this.setTerritoryDisplay();
        break;
    }
  }

  setHighlightDisplay(): void {
    this.element.fill(this.displayOption);
    this.element.opacity(0.5);
  }

  setTerrainDisplay(): void {
    this.element.fillPatternRepeat("no-repeat");
    this.loadTerrainImage();
  }

  setTerritoryDisplay(): void {
    this.element.fill(this.displayOption);
  }

  loadTerrainImage(): void {
    const image = new Image();
    image.src = terrainType.urlFor(this.displayOption);
    image.onload = () => {
      this.element.fillPatternImage(image);
      this.element.fillPatternOffset(
        this.terrainOffset(image.width, image.height)
      );
      this.updateTerrainSize();
      return this.layer.draw();
    };
  }

  // ###########################################################
  // Handlers
  // ###########################################################

  click(): void {
    if (!this.dragging) {
      this.board.click(this.boardCoordinate);
    }
  }

  dragStart(): void {
    this.dragging = true;
    this.element.moveToTop();
    this.layer.drag_start(this);
  }

  dragEnd(): void {
    this.dragging = false;
    this.layer.drag_end(this);
  }

  // ###########################################################
  // Helpers
  // ###########################################################

  contains(coordinate: Vector2d): boolean {
    return this.elementContains(this.displayCoordinate, this.size, coordinate);
  }

  abstract elementContains(
    center: Vector2d,
    size: number,
    coordinate: Vector2d
  ): boolean;

  draggable(): boolean {
    return (
      this.displayType === "terrain" &&
      doesHaveValue(this.board.gameController) &&
      this.board.gameController.userInSetup()
    );
  }

  setup(): boolean {
    return this.boardCoordinate == null;
  }

  currentPosition(): Vector2d {
    return {
      x: this.element.attrs.x,
      y: this.element.attrs.y
    };
  }

  resetPosition(): void {
    this.element.x(this.displayCoordinate.x);
    this.element.y(this.displayCoordinate.y);
  }

  remove(): void {
    this.element.remove();
  }

  type(): string {
    return "Terrain";
  }

  typeId(): string {
    return this.displayOption;
  }

  abstract terrainOffset(width: number, height: number): Vector2d;

  // ###########################################################
  // Clone
  // ###########################################################

  clone(): ISpace {
    return new (this.constructor as any)({
      board: this.board,
      boardCoordinate: this.boardCoordinate,
      displayCoordinate: this.displayCoordinate,
      displayOption: this.displayOption,
      displayType: this.displayType,
      layer: this.layer
    });
  }
}
