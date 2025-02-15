import { Stage as KonvaStage } from "konva/lib/Stage";
import { Text as KonvaText } from "konva/lib/shapes/Text";
import { Rect as KonvaRect } from "konva/lib/shapes/Rect";
import { Layer as KonvaLayer } from "konva/lib/Layer";
import { Group as KonvaGroup } from "konva/lib/Group";
import {
  GameState,
  IGame,
  IGameActionRequest,
  ILastAction,
  IPlayerState,
} from "src/app/shared/dtos/rummikub/game";
import { ITile, TileColor } from "src/app/shared/dtos/rummikub/tile";
import { Vector2d } from "konva/lib/types";

export interface ITableOptions {
  element: HTMLDivElement;
}

interface IBoardCellDropSite {
  border: KonvaRect;
}

interface ISetDisplay {
  tiles: ITileDisplay[];
  group: KonvaGroup;
  groupToggle: KonvaText;
}

interface ITileDisplay {
  tile: ITile;
  value: KonvaText;
  border: KonvaRect;
  group: KonvaGroup;
}

interface IPlayerDisplay {
  userId: number;
  positionIndex: number;
  name: KonvaText;
  border: KonvaRect;
}

interface ISize {
  width: number;
  height: number;
}

interface IPlayerNamePositionData {
  textPosition: Vector2d;
  textSize: ISize;
  borderPosition: Vector2d;
  borderSize: ISize;
}

const TABLE_PADDING = 5;
const BOARD_GRID_SIZE = 13;
const CURRENT_USER_HAND_ROWS = 3;
const CURRENT_USER_HAND_COLUMNS = BOARD_GRID_SIZE;
const CURRENT_USER_HAND_INITIAL_ROW = BOARD_GRID_SIZE - CURRENT_USER_HAND_ROWS;

const PLAYER_NAME_HEIGHT = 50;
const PLAYER_NAME_WIDTH = 100;

const TILE_DEFAULT_STROKE = 1;
const TILE_HOVER_STORKE = 5;

const TILE_COLOR_TO_DISPLAY = {
  [TileColor.YELLOW]: "#efbf04",
  [TileColor.BLACK]: "#000000",
  [TileColor.BLUE]: "#6395ee",
  [TileColor.RED]: "#cd1c18",
};

export class RummikubTable {
  private readonly container: HTMLDivElement;
  private readonly stage: KonvaStage;
  private readonly layer: KonvaLayer;
  private tileSize: number;
  private gridOffset: Vector2d;
  private playerDisplays: Map<number, IPlayerDisplay>;
  private currentUserId: number | null;
  private actionToUserId: number | null;
  private boardGridDropSites: IBoardCellDropSite[];
  private currentUserHandTileDisplays: (ITileDisplay | null)[] = [];
  private currentTurnTilesAddedToSets: ITile[];
  private setDisplays: (ISetDisplay | null)[] = [];
  private readonly onRearrangeTiles: (cards: (ITile | null)[]) => void;

  constructor(
    options: ITableOptions,
    onRearrangeTiles: (cards: ITile[]) => void
  ) {
    this.container = options.element;
    this.onRearrangeTiles = onRearrangeTiles;
    this.stage = new KonvaStage({
      container: this.container,
      height: this.container.offsetHeight,
      width: this.container.offsetWidth,
    });
    this.layer = new KonvaLayer();
    this.stage.add(this.layer);
    this.computeTileSize();
  }

  async initializeState(game: IGame, currentUserId?: number): Promise<void> {
    this.playerDisplays = new Map<number, IPlayerDisplay>();
    this.currentUserId = currentUserId ?? null;
    this.layer.destroyChildren();
    this.initializeBoardGridDropSites();
    if (game.state !== GameState.PLAYERS_JOINING) {
      this.initializePlayers(game);
    }
    const currentPlayerState = game.playerStates.find(
      (x) => x.userId == currentUserId
    );
    if (currentPlayerState != null) {
      this.initializeCurrentPlayerHand(currentPlayerState);
    }
    if (game.state === GameState.ROUND_ACTIVE) {
      this.initializeSets(game);
      this.updateActionTo(game.actionToUserId);
    }
    // else {
    //   this.initializeMessageText(game);
    // }
    this.resize();
  }

  getCurrentPlay(): IGameActionRequest {
    if (this.didCurrentUserModifySets()) {
      return {
        updateSets: {
          tilesAdded: this.currentTurnTilesAddedToSets,
          sets: this.setDisplays.map((x) =>
            x == null ? null : x.tiles.map((y) => y.tile)
          ),
        },
      };
    }
    return { pickUpTileOrPass: true };
  }

  didCurrentUserModifySets(): boolean {
    return true;
  }

  async updateStateWithUserAction(
    lastAction: ILastAction,
    newActionToUserId: number,
    tilePickedUp?: ITile
  ): Promise<void> {
    console.log(lastAction, newActionToUserId, tilePickedUp);
  }

  resize(): void {
    this.stage.size({
      height: this.container.offsetHeight,
      width: this.container.offsetWidth,
    });
    this.computeTileSize();

    // if (this.messageText != null) {
    //   this.messageText.x(
    //     this.container.offsetWidth / 2 - this.messageText.width() / 2
    //   );
    //   this.messageText.y(
    //     this.container.offsetHeight / 2 - this.messageText.height() / 2
    //   );
    // }

    for (let index = 0; index < BOARD_GRID_SIZE * BOARD_GRID_SIZE; index++) {
      this.updateBoardGridDropSitePosition(index);
    }

    let rowOffset = 0;
    let columnOffset = 0;
    for (let index = 0; index < this.setDisplays.length; index++) {
      const setDisplay = this.setDisplays[index];
      if (setDisplay == null) {
        columnOffset += 1;
      } else {
        if (columnOffset + setDisplay.tiles.length >= BOARD_GRID_SIZE) {
          rowOffset += 1;
          columnOffset = 0;
        }
        this.updateSetPosition(index, rowOffset, columnOffset);
        columnOffset += setDisplay.tiles.length;
      }
    }

    for (
      let index = 0;
      index < BOARD_GRID_SIZE * CURRENT_USER_HAND_ROWS;
      index++
    ) {
      this.updateCurrentPlayerHandPosition(index);
    }

    this.playerDisplays.forEach((playerDisplay) => {
      const positionalData = this.getPlayerNamePositionData(
        playerDisplay,
        this.playerDisplays.size
      );
      playerDisplay.name.position(positionalData.textPosition);
      playerDisplay.name.size(positionalData.textSize);
      playerDisplay.border.position(positionalData.borderPosition);
      playerDisplay.border.size(positionalData.borderSize);
    });

    this.layer.draw();
  }

  clear(): void {}

  private computeTileSize(): void {
    const min = Math.min(
      this.container.offsetHeight - 2 * PLAYER_NAME_HEIGHT - 2 * TABLE_PADDING,
      this.container.offsetWidth - 2 * PLAYER_NAME_WIDTH - 2 * TABLE_PADDING
    );
    this.tileSize = min / 13.5;

    this.gridOffset = {
      x:
        (this.container.offsetWidth - this.tileSize * 13.5) / 2 + TABLE_PADDING,
      y:
        (this.container.offsetHeight - this.tileSize * 13.5) / 2 +
        TABLE_PADDING,
    };
  }

  private getTileText(tile: ITile): string {
    if (tile.isJoker) {
      return "☺";
    }
    if (tile.rank == null) {
      throw Error("Tile rank unexpectedly null");
    }
    return tile.rank.toString();
  }

  private createNullableTileDisplay(tile: ITile | null): ITileDisplay | null {
    if (tile == null) {
      return null;
    }
    return this.createTileDisplay(tile);
  }

  private createTileDisplay(tile: ITile): ITileDisplay {
    const color =
      tile.color ?? (tile.jokerNumber == 0 ? TileColor.BLACK : TileColor.RED);
    const value = new KonvaText({
      align: "center",
      verticalAlign: "middle",
      fontSize: (this.tileSize * 3) / 4,
      fontStyle: "bold",
      fill: TILE_COLOR_TO_DISPLAY[color],
      text: this.getTileText(tile),
    });
    const border = new KonvaRect({
      stroke: "black",
      strokeWidth: TILE_DEFAULT_STROKE,
    });
    const group = new KonvaGroup({ draggable: true });
    group.add(value, border);
    this.layer.add(group);
    return { tile, value, border, group };
  }

  private initializeBoardGridDropSites(): void {
    this.boardGridDropSites = [];
    const cellCount = BOARD_GRID_SIZE * BOARD_GRID_SIZE;
    for (let i = 0; i < cellCount; i++) {
      this.boardGridDropSites.push(this.createBoardCellDropSite());
    }
  }

  private createBoardCellDropSite() {
    const border = new KonvaRect({
      dash: [5, 5],
      stroke: "gray",
      strokeWidth: TILE_DEFAULT_STROKE,
    });
    this.layer.add(border);
    return { border };
  }

  private createSetDisplay(tiles: ITile[]): ISetDisplay {
    const tileDisplays = tiles.map((x) => this.createTileDisplay(x));
    const group = new KonvaGroup();
    group.add(...tileDisplays.map((x) => x.value));
    group.add(...tileDisplays.map((x) => x.border));
    const groupToggle = new KonvaText();
    return {
      tiles: tileDisplays,
      group,
      groupToggle,
    };
  }

  async initializePlayers(game: IGame): Promise<void> {
    let bottomIndex = 0;
    game.playerStates.forEach((playerState, index) => {
      if (playerState.userId === this.currentUserId) {
        bottomIndex = index;
      }
    });
    for (let index = 0; index < game.playerStates.length; index++) {
      const positionIndex =
        (index - bottomIndex + game.playerStates.length) %
        game.playerStates.length;
      this.initializePlayer(game.playerStates[index], positionIndex);
    }
  }

  private initializePlayer(
    playerState: IPlayerState,
    positionIndex: number
  ): void {
    const name = new KonvaText({
      align: "center",
      fontSize: 16,
      text: playerState.displayName,
      verticalAlign: "middle",
    });
    this.layer.add(name);
    const border = new KonvaRect({
      stroke: "gray",
      strokeWidth: 0,
    });
    this.layer.add(border);
    const playerDisplay: IPlayerDisplay = {
      userId: playerState.userId,
      positionIndex,
      name,
      border,
    };
    this.playerDisplays.set(playerDisplay.userId, playerDisplay);
  }

  private getPlayerNamePositionData(
    player: IPlayerDisplay,
    playerCount: number
  ): IPlayerNamePositionData {
    let position: Vector2d;
    if (player.positionIndex == 0) {
      position = {
        x: this.stage.width() / 2 - PLAYER_NAME_WIDTH / 2 + TABLE_PADDING,
        y: this.stage.height() - PLAYER_NAME_HEIGHT - TABLE_PADDING,
      };
    } else if (
      (player.positionIndex == 1 && playerCount == 2) ||
      (player.positionIndex == 2 && playerCount == 4)
    ) {
      position = {
        x: this.stage.width() / 2 - PLAYER_NAME_WIDTH / 2 + TABLE_PADDING,
        y: TABLE_PADDING,
      };
    } else if (player.positionIndex == 1) {
      position = {
        x: TABLE_PADDING,
        y: this.stage.height() / 2 + TABLE_PADDING,
      };
    } else {
      position = {
        x: this.stage.width() - PLAYER_NAME_WIDTH - TABLE_PADDING,
        y: this.stage.height() / 2 + TABLE_PADDING,
      };
    }
    return {
      textPosition: position,
      textSize: { width: PLAYER_NAME_WIDTH, height: PLAYER_NAME_HEIGHT },
      borderPosition: position,
      borderSize: { width: PLAYER_NAME_WIDTH, height: PLAYER_NAME_HEIGHT },
    };
  }

  private initializeCurrentPlayerHand(playerState: IPlayerState): void {
    this.currentUserHandTileDisplays = [];
    for (let i = 0; i < BOARD_GRID_SIZE * CURRENT_USER_HAND_ROWS; i++) {
      const nullableTile =
        i < playerState.tiles.length ? playerState.tiles[i] : null;
      this.currentUserHandTileDisplays.push(
        this.createNullableTileDisplay(nullableTile)
      );
    }
    this.currentUserHandTileDisplays.forEach((x) =>
      this.initializeTileEventHandlers(x)
    );
  }

  private initializeSets(game: IGame): void {
    this.setDisplays = game.sets.map((x) =>
      x == null ? null : this.createSetDisplay(x)
    );
  }

  private getCurrentPlayerHandPosition(tileIndex: number): Vector2d {
    const columnOffset = tileIndex % CURRENT_USER_HAND_COLUMNS;
    const x = columnOffset * this.tileSize + this.gridOffset.x;
    const rowOffset =
      Math.floor(tileIndex / CURRENT_USER_HAND_COLUMNS) +
      CURRENT_USER_HAND_INITIAL_ROW;
    const y =
      rowOffset * this.tileSize + this.gridOffset.y + this.getDividerHeight();
    return { x, y };
  }

  private updateCurrentPlayerHandPosition(tileIndex: number): void {
    const { x, y } = this.getCurrentPlayerHandPosition(tileIndex);
    const tileDisplay = this.currentUserHandTileDisplays[tileIndex];
    if (tileDisplay) {
      tileDisplay.value.setSize({
        width: this.tileSize * 0.9,
        height: this.tileSize * 0.9,
      });
      tileDisplay.border.setSize({
        width: this.tileSize * 0.9,
        height: this.tileSize * 0.9,
      });
      tileDisplay.group.setPosition({ x, y });
    }
  }

  private getDividerHeight() {
    return this.tileSize * 0.5;
  }

  private getBoardGridDropSitePosition(index: number): Vector2d {
    const columnOffset = index % BOARD_GRID_SIZE;
    const x = columnOffset * this.tileSize + this.gridOffset.x;
    const rowOffset = Math.floor(index / BOARD_GRID_SIZE);
    let y = rowOffset * this.tileSize + this.gridOffset.y;
    if (rowOffset >= BOARD_GRID_SIZE - CURRENT_USER_HAND_ROWS) {
      y += this.getDividerHeight();
    }
    return { x, y };
  }

  private updateBoardGridDropSitePosition(index: number) {
    const { x, y } = this.getBoardGridDropSitePosition(index);
    const display = this.boardGridDropSites[index];
    if (display) {
      display.border.setSize({
        width: this.tileSize * 0.9,
        height: this.tileSize * 0.9,
      });
      display.border.setPosition({ x, y });
    }
  }

  private updateSetPosition(
    setIndex: number,
    rowOffset: number,
    columnOffset: number
  ): void {
    const setDisplay = this.setDisplays[setIndex];
    if (setDisplay == null) {
      return;
    }
    const x = columnOffset * this.tileSize;
    const y = rowOffset * this.tileSize;
    setDisplay.group.setPosition({ x, y });
  }

  private updateActionTo(actionToUserId: number): void {
    this.playerDisplays.forEach((userData) => {
      userData.border.strokeWidth(0);
    });
    const userData = this.playerDisplays.get(actionToUserId);
    if (userData == null) {
      throw new Error("User not found");
    }
    userData.border.strokeWidth(2);
  }

  private updateTileStroke(rect: KonvaRect, hover: boolean): void {
    rect.strokeWidth(hover ? TILE_HOVER_STORKE : TILE_DEFAULT_STROKE);
  }

  private removeTileEventHandlers(group: KonvaGroup): void {
    group.off("mouseover");
    group.off("mouseout");
    group.off("dragstart");
    group.off("dragend");
  }

  private onTileDragEnd(tileDisplay: ITileDisplay): void {
    const tileOldIndex = this.currentUserHandTileDisplays.findIndex(
      (x) => x === tileDisplay
    );
    if (tileOldIndex) {
      const isMovingWithinHand = this.checkForMovingTileWithinUserHand(
        tileDisplay,
        tileOldIndex
      );
      if (isMovingWithinHand) {
        return;
      }
      if (this.currentUserId == this.actionToUserId) {
        const isMovingWithinBoard = this.checkForMovingTileWithinBoard(
          tileDisplay,
          tileOldIndex
        );
        if (isMovingWithinBoard) {
          return;
        }
      }
    }
    // reset position
    this.updateCurrentPlayerHandPosition(tileOldIndex);
    this.layer.draw();
  }

  private checkForMovingTileWithinUserHand(
    tileDisplay: ITileDisplay,
    tileOldIndex: number
  ) {
    let tileNewIndex = tileOldIndex;
    const newX = tileDisplay.group.x();
    const newY = tileDisplay.group.y();
    for (
      let index = 0;
      index < BOARD_GRID_SIZE * CURRENT_USER_HAND_ROWS;
      index++
    ) {
      const { x, y } = this.getCurrentPlayerHandPosition(index);
      if (
        newX > x - this.tileSize * 0.25 &&
        newX < x + this.tileSize * 0.75 &&
        newY > y - this.tileSize * 0.25 &&
        newY < y + this.tileSize * 0.75
      ) {
        tileNewIndex = index;
      }
    }
    if (tileOldIndex !== tileNewIndex) {
      if (this.currentUserHandTileDisplays[tileNewIndex] == null) {
        this.currentUserHandTileDisplays[tileNewIndex] =
          this.currentUserHandTileDisplays[tileOldIndex];
        this.currentUserHandTileDisplays[tileOldIndex] = null;
      } else {
        let nextFreeIndex: number | null = null;
        for (
          let index = tileNewIndex + 1;
          index < BOARD_GRID_SIZE * CURRENT_USER_HAND_ROWS;
          index++
        ) {
          if (
            index == tileOldIndex ||
            this.currentUserHandTileDisplays[index] == null
          ) {
            nextFreeIndex = index;
            break;
          }
        }
        if (nextFreeIndex == null) {
          // cancel move, no spot to shift tiles too
          this.updateCurrentPlayerHandPosition(tileOldIndex);
          this.layer.draw();
          return;
        } else {
          const currentTileDisplay =
            this.currentUserHandTileDisplays[tileOldIndex];
          for (let index = nextFreeIndex; index > tileNewIndex; index--) {
            this.currentUserHandTileDisplays[index] =
              this.currentUserHandTileDisplays[index - 1];
          }
          this.currentUserHandTileDisplays[tileNewIndex] = currentTileDisplay;
          if (nextFreeIndex != tileOldIndex) {
            this.currentUserHandTileDisplays[tileOldIndex] = null;
          }
        }
      }
      for (
        let index = 0;
        index < this.currentUserHandTileDisplays.length;
        index++
      ) {
        this.updateCurrentPlayerHandPosition(index);
      }
      this.layer.draw();
      this.onRearrangeTiles(
        this.currentUserHandTileDisplays.map((x) => (x == null ? null : x.tile))
      );
      return true;
    }
    return false;
  }

  private checkForMovingTileWithinBoard(
    tileDisplay: ITileDisplay,
    tileOldIndex: number
  ): boolean {
    return false;
  }

  private initializeTileEventHandlers(tileDisplay: ITileDisplay | null): void {
    if (tileDisplay == null) {
      return;
    }
    this.removeTileEventHandlers(tileDisplay.group);
    tileDisplay.group.on("mouseover", () => {
      this.updateTileStroke(tileDisplay.border, true);
      this.layer.draw();
    });
    tileDisplay.group.on("mouseout", () => {
      this.updateTileStroke(tileDisplay.border, false);
      this.layer.draw();
    });
    tileDisplay.group.on("dragstart", () => {
      tileDisplay.group.moveToTop();
      this.layer.draw();
    });
    tileDisplay.group.on("dragend", () => {
      this.onTileDragEnd(tileDisplay);
    });
  }
}
