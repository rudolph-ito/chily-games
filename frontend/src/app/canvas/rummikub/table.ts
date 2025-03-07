import { Stage as KonvaStage } from "konva/lib/Stage";
import { Text as KonvaText } from "konva/lib/shapes/Text";
import { Rect as KonvaRect } from "konva/lib/shapes/Rect";
import { Layer as KonvaLayer } from "konva/lib/Layer";
import { Group as KonvaGroup } from "konva/lib/Group";
import {
  GameState,
  IDoneWithTurnResponse,
  IGame,
  ILastAction,
  IPlayerState,
  IPlayerTiles,
  ISets,
  IUpdateSets,
} from "src/app/shared/dtos/rummikub/game";
import { ITile, TileColor } from "src/app/shared/dtos/rummikub/tile";
import { Vector2d } from "konva/lib/types";
import { Easings as KonvaEasings, Tween as KonvaTween } from "konva/lib/Tween";
import { areTilesEqual } from "./tiles_helpers";
import { computeUpdateSetsChanges } from "./change_helpers";

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

interface IDraggedTileNewIndex {
  boardIndex?: number;
  currentHandIndex?: number;
}

const TABLE_PADDING = 5;
const TOTAL_COLUMNS = 20;
const TOTAL_ROWS = 10;
const BOARD_NUM_ROWS = 8;
const BOARD_NUM_TILES = BOARD_NUM_ROWS * TOTAL_COLUMNS;
const CURRENT_USER_HAND_ROWS = TOTAL_ROWS - BOARD_NUM_ROWS;
const CURRENT_USER_HAND_INITIAL_ROW = BOARD_NUM_ROWS;
const CURRENT_USER_HAND_NUM_TILES = CURRENT_USER_HAND_ROWS * TOTAL_COLUMNS;
const TOTAL_NUM_TILES = BOARD_NUM_TILES + CURRENT_USER_HAND_NUM_TILES;
const TILE_HEIGHT_TO_WIDTH_RATIO = 5 / 7;

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
  private tileSize: ISize;
  private gridOffset: Vector2d;
  private playerDisplays: Map<number, IPlayerDisplay>;
  private currentUserId: number | null;
  private actionToUserId: number | null;
  private boardGridDropSites: IBoardCellDropSite[];
  private tilePoolText: KonvaText;
  private setTileDisplays: (ITileDisplay | null)[] = [];
  private currentUserHandTileDisplays: (ITileDisplay | null)[] = [];
  private setGroups: (ISetDisplay | null)[] = [];
  private currentUpdateSets: IUpdateSets;
  private readonly onRearrangeTiles: (cards: (ITile | null)[]) => void;
  private readonly onUpdateSets: (updateSets: IUpdateSets) => void;

  constructor(
    options: ITableOptions,
    onRearrangeTiles: (cards: ITile[]) => void,
    onUpdateSets: (updateSets: IUpdateSets) => void
  ) {
    this.container = options.element;
    this.onRearrangeTiles = onRearrangeTiles;
    this.onUpdateSets = onUpdateSets;
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
    this.initializeTilePool();
    if (game.state !== GameState.PLAYERS_JOINING) {
      this.initializePlayers(game);
    }
    const currentPlayerState = game.playerStates.find(
      (x) => x.userId == currentUserId
    );
    if (currentPlayerState != null) {
      let playerTiles = currentPlayerState.tiles;
      if (game.actionToUserId == currentUserId) {
        if (game.latestUpdateSets != null) {
          playerTiles = game.latestUpdateSets.remainingTiles;
        } else if (game.lastValidUpdateSets != null) {
          playerTiles = game.lastValidUpdateSets.remainingTiles;
        }
      }
      this.initializeCurrentPlayerHand(playerTiles);
    }
    this.initializeSets(
      game.latestUpdateSets ??
        game.lastValidUpdateSets ?? {
          sets: game.sets,
          tilesAdded: [],
          remainingTiles: [],
        }
    );
    this.updateActionTo(game.actionToUserId);
    this.initializeTilePool();
    this.updateTilePoolCount(game.tilePoolCount);
    this.resize();
  }

  updateStateWithCurrentUserAction(
    actionResponse: IDoneWithTurnResponse
  ): void {
    this.currentUpdateSets = {
      sets: this.currentUpdateSets.sets,
      tilesAdded: [],
      remainingTiles: [],
    };
    if (actionResponse.pickedUpTileEvent != null) {
      const { tile, playerTileIndex, tilePoolCount } =
        actionResponse.pickedUpTileEvent;
      const tileDisplay = this.createTileDisplay(tile);
      this.currentUserHandTileDisplays[playerTileIndex] = tileDisplay;
      this.animateTileFaceUpFromPoolIntoCurrentUserHand(playerTileIndex);
      this.updateTilePoolCount(tilePoolCount);
    }
    if (actionResponse.actionToNextPlayerEvent != null) {
      this.updateActionTo(
        actionResponse.actionToNextPlayerEvent?.actionToUserId
      );
    }
  }

  updateStateWithUserAction(
    lastAction: ILastAction,
    newActionToUserId: number
  ): void {
    if (lastAction.pickUpTileOrPass) {
      this.animateTileFaceDownFromPoolToOtherPlayer(lastAction.userId);
      if (lastAction.tilePoolCount == null) {
        throw Error(
          "updateStateWithUserAction: last action tile pool count unexpectedly null"
        );
      }
      this.updateTilePoolCount(lastAction.tilePoolCount);
    }
    this.updateActionTo(newActionToUserId);
  }

  async updateStateWithUpdateSets(
    updateSets: IUpdateSets,
    isCurrentUserRevert: boolean
  ): Promise<void> {
    if (isCurrentUserRevert) {
      this.currentUpdateSets = updateSets;
      this.currentUserHandTileDisplays.forEach((x) => {
        if (x != null) {
          x.group.destroy();
        }
      });
      this.initializeCurrentPlayerHand(updateSets.remainingTiles);
    } else {
      const changes = computeUpdateSetsChanges(
        this.currentUpdateSets,
        updateSets
      );
      const oldSetDisplays = this.setTileDisplays.slice();
      const tweens: KonvaTween[] = [];
      for (const change of changes.withinBoard) {
        this.setTileDisplays[change.to] = oldSetDisplays[change.from];
        tweens.push(
          this.stageAnimationForMovingTileWithinBoard(change.from, change.to)
        );
      }
      for (const change of changes.fromBoardToHand) {
        this.setTileDisplays[change.from] = null;
        tweens.push(
          this.stageAnimationForMovingTileFromBoardToHand(change.from)
        );
      }
      for (const change of changes.fromHandToBoard) {
        const tileDisplay = this.createTileDisplay(change.tile);
        this.setTileDisplays[change.to] = tileDisplay;
        tweens.push(
          this.stageAnimationForMovingTileFromHandToBoard(
            tileDisplay,
            change.to
          )
        );
      }
      for (const tween of tweens) {
        tween.play();
      }
    }
  }

  hasUpdateSets(): boolean {
    return this.currentUpdateSets != null;
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

    for (
      let index = 0;
      index < BOARD_NUM_TILES + CURRENT_USER_HAND_NUM_TILES;
      index++
    ) {
      this.updateBoardGridDropSitePosition(index);
    }

    for (let index = 0; index < this.setTileDisplays.length; index++) {
      this.updateSetTilePosition(index);
    }

    for (let index = 0; index < CURRENT_USER_HAND_NUM_TILES; index++) {
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

    this.tilePoolText.position(this.getTilePoolPosition());
    this.tilePoolText.size({
      width: PLAYER_NAME_WIDTH,
      height: PLAYER_NAME_HEIGHT,
    });

    this.layer.draw();
  }

  clear(): void {}

  private getTilePoolPosition(): Vector2d {
    return {
      x: TABLE_PADDING,
      y: this.stage.height() - PLAYER_NAME_HEIGHT - TABLE_PADDING,
    };
  }

  private computeTileSize(): void {
    const tileAreaHeight =
      this.container.offsetHeight - 2 * PLAYER_NAME_HEIGHT - 2 * TABLE_PADDING;
    const tileAreaWidth = this.container.offsetWidth - 2 * TABLE_PADDING;
    const maxHeight1 = tileAreaHeight / (TOTAL_ROWS + 1);
    const maxHeight2 =
      tileAreaWidth / TOTAL_COLUMNS / TILE_HEIGHT_TO_WIDTH_RATIO;
    const maxHeight = Math.min(maxHeight1, maxHeight2);
    this.tileSize = {
      height: maxHeight,
      width: maxHeight * TILE_HEIGHT_TO_WIDTH_RATIO,
    };
    this.gridOffset = {
      x:
        (this.container.offsetWidth - this.tileSize.width * TOTAL_COLUMNS) / 2 +
        TABLE_PADDING,
      y:
        (this.container.offsetHeight -
          this.tileSize.height * (TOTAL_ROWS + 1)) /
          2 +
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
      fontSize: (this.tileSize.width * 3) / 4,
      fontStyle: "bold",
      lineHeight: 2,
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
    const tileDisplay = { tile, value, border, group };
    this.initializeTileEventHandlers(tileDisplay);
    return tileDisplay;
  }

  private initializeBoardGridDropSites(): void {
    this.boardGridDropSites = [];
    for (let i = 0; i < TOTAL_NUM_TILES; i++) {
      this.boardGridDropSites.push(this.createBoardCellDropSite());
    }
  }

  private initializeTilePool(): void {
    this.tilePoolText = new KonvaText({
      align: "center",
      fontSize: 14,
      verticalAlign: "middle",
    });
    this.layer.add(this.tilePoolText);
  }

  private updateTilePoolCount(count: number): void {
    this.tilePoolText.text(`Tile Pool:\n${count}`);
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

  private initializeCurrentPlayerHand(playerTiles: IPlayerTiles): void {
    this.currentUserHandTileDisplays = [];
    for (let i = 0; i < CURRENT_USER_HAND_NUM_TILES; i++) {
      const nullableTile = i < playerTiles.length ? playerTiles[i] : null;
      this.currentUserHandTileDisplays.push(
        this.createNullableTileDisplay(nullableTile)
      );
    }
  }

  private initializeSets(updateSets: IUpdateSets): void {
    this.currentUpdateSets = updateSets;
    this.setTileDisplays = updateSets.sets.flatMap((x) =>
      x == null ? [null] : x.map((y) => this.createTileDisplay(y))
    );
    while (this.setTileDisplays.length < BOARD_NUM_TILES) {
      this.setTileDisplays.push(null);
    }
  }

  private getCurrentPlayerHandPosition(currentHandTileIndex: number): Vector2d {
    return this.getBoardPosition(currentHandTileIndex + BOARD_NUM_TILES);
  }

  private updateCurrentPlayerHandPosition(tileIndex: number): void {
    const { x, y } = this.getCurrentPlayerHandPosition(tileIndex);
    const tileDisplay = this.currentUserHandTileDisplays[tileIndex];
    if (tileDisplay) {
      tileDisplay.value.setSize({
        width: this.tileSize.width * 0.9,
        height: this.tileSize.height * 0.9,
      });
      tileDisplay.border.setSize({
        width: this.tileSize.width * 0.9,
        height: this.tileSize.height * 0.9,
      });
      tileDisplay.group.setPosition({ x, y });
    }
  }

  private animateTileFaceUpFromPoolIntoCurrentUserHand(
    tileIndex: number
  ): void {
    const tileDisplay = this.currentUserHandTileDisplays[tileIndex];
    if (tileDisplay == null) {
      throw Error("Tile display unexpected null");
    }
    tileDisplay.value.setSize({
      width: this.tileSize.width * 0.9,
      height: this.tileSize.height * 0.9,
    });
    tileDisplay.border.setSize({
      width: this.tileSize.width * 0.9,
      height: this.tileSize.height * 0.9,
    });
    tileDisplay.group.setPosition(this.getTilePoolPosition());
    const handPosition = this.getCurrentPlayerHandPosition(tileIndex);
    const tween = new KonvaTween({
      node: tileDisplay.group,
      duration: 1,
      easing: KonvaEasings.EaseInOut,
      x: handPosition.x,
      y: handPosition.y,
    });
    tween.play();
  }

  private animateTileFaceDownFromPoolToOtherPlayer(userId: number): void {
    const playerDisplay = Array.from(this.playerDisplays.values()).find(
      (x) => x.userId == userId
    );
    if (playerDisplay == null) {
      throw Error(
        "animateTileFaceDownFromPoolToOtherPlayer: player unexpectedly not found"
      );
    }
    const positionData = this.getPlayerNamePositionData(
      playerDisplay,
      this.playerDisplays.size
    );
    const tileBorder = new KonvaRect({
      fill: "white",
      stroke: "black",
      strokeWidth: TILE_DEFAULT_STROKE,
      width: this.tileSize.width * 0.9,
      height: this.tileSize.height * 0.9,
    });
    this.layer.add(tileBorder);
    tileBorder.setPosition(this.getTilePoolPosition());
    const tween = new KonvaTween({
      node: tileBorder,
      duration: 2,
      easing: KonvaEasings.EaseInOut,
      onFinish: () => {
        tileBorder.destroy();
        this.layer.draw();
      },
      x: positionData.textPosition.x,
      y: positionData.textPosition.y,
    });
    tween.play();
  }

  private stageAnimationForMovingTileWithinBoard(
    oldIndex: number,
    newIndex: number
  ): KonvaTween {
    const tileDisplay = this.setTileDisplays[oldIndex];
    if (tileDisplay == null) {
      throw Error(
        "stageAnimationForMovingTileWithinBoard: old tile unexpectedly not found"
      );
    }
    const positionData = this.getBoardPosition(newIndex);
    return new KonvaTween({
      node: tileDisplay.group,
      duration: 2,
      easing: KonvaEasings.EaseInOut,
      x: positionData.x,
      y: positionData.y,
    });
  }

  private stageAnimationForMovingTileFromHandToBoard(
    tileDisplay: ITileDisplay,
    index: number
  ): KonvaTween {
    const playerDisplay = Array.from(this.playerDisplays.values()).find(
      (x) => x.userId == this.actionToUserId
    );
    if (playerDisplay == null) {
      throw Error(
        "stageAnimationForMovingTileFromHandToBoard: player unexpectedly not found"
      );
    }
    const playerPositionData = this.getPlayerNamePositionData(
      playerDisplay,
      this.playerDisplays.size
    );
    tileDisplay.value.setSize({
      width: this.tileSize.width * 0.9,
      height: this.tileSize.height * 0.9,
    });
    tileDisplay.border.setSize({
      width: this.tileSize.width * 0.9,
      height: this.tileSize.height * 0.9,
    });
    tileDisplay.group.setPosition(playerPositionData.textPosition);
    const boardPositionData = this.getBoardPosition(index);
    return new KonvaTween({
      node: tileDisplay.group,
      duration: 2,
      easing: KonvaEasings.EaseInOut,
      x: boardPositionData.x,
      y: boardPositionData.y,
    });
  }

  private stageAnimationForMovingTileFromBoardToHand(
    index: number
  ): KonvaTween {
    const tileDisplay = this.setTileDisplays[index];
    if (tileDisplay == null) {
      throw Error(
        "stageAnimationForMovingTileFromBoardToHand: tile unexpectedly not found"
      );
    }
    const playerDisplay = Array.from(this.playerDisplays.values()).find(
      (x) => x.userId == this.actionToUserId
    );
    if (playerDisplay == null) {
      throw Error(
        "stageAnimationForMovingTileFromBoardToHand: player unexpectedly not found"
      );
    }
    const playerPositionData = this.getPlayerNamePositionData(
      playerDisplay,
      this.playerDisplays.size
    );
    return new KonvaTween({
      node: tileDisplay.group,
      duration: 2,
      easing: KonvaEasings.EaseInOut,
      onFinish: () => {
        tileDisplay.group.destroy();
        this.layer.draw();
      },
      x: playerPositionData.textPosition.x,
      y: playerPositionData.textPosition.y,
    });
  }

  private getDividerHeight() {
    return this.tileSize.height;
  }

  private getBoardPosition(index: number): Vector2d {
    const columnOffset = index % TOTAL_COLUMNS;
    const x = columnOffset * this.tileSize.width + this.gridOffset.x;
    const rowOffset = Math.floor(index / TOTAL_COLUMNS);
    let y = rowOffset * this.tileSize.height + this.gridOffset.y;
    if (rowOffset >= BOARD_NUM_ROWS) {
      y += this.getDividerHeight();
    }
    return { x, y };
  }

  private updateBoardGridDropSitePosition(index: number) {
    const { x, y } = this.getBoardPosition(index);
    const display = this.boardGridDropSites[index];
    if (display) {
      display.border.setSize({
        width: this.tileSize.width * 0.9,
        height: this.tileSize.height * 0.9,
      });
      display.border.setPosition({ x, y });
    }
  }

  private updateSetTilePosition(index: number): void {
    const { x, y } = this.getBoardPosition(index);
    const tileDisplay = this.setTileDisplays[index];
    if (tileDisplay) {
      tileDisplay.value.setSize({
        width: this.tileSize.width * 0.9,
        height: this.tileSize.height * 0.9,
      });
      tileDisplay.border.setSize({
        width: this.tileSize.width * 0.9,
        height: this.tileSize.height * 0.9,
      });
      tileDisplay.group.setPosition({ x, y });
    }
  }

  private updateActionTo(actionToUserId: number): void {
    this.actionToUserId = actionToUserId;
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
    const currentHandTileOldIndex = this.currentUserHandTileDisplays.findIndex(
      (x) => x === tileDisplay
    );
    const setTileOldIndex = this.setTileDisplays.findIndex(
      (x) => x === tileDisplay
    );
    const newIndex = this.getDraggedTileNewIndex(tileDisplay);
    let successfulMove = false;
    if (currentHandTileOldIndex !== -1) {
      if (newIndex.currentHandIndex != null) {
        successfulMove = this.attemptMoveTileWithinHand(
          tileDisplay,
          currentHandTileOldIndex,
          newIndex.currentHandIndex
        );
      }
      if (
        newIndex.boardIndex != null &&
        this.currentUserId == this.actionToUserId
      ) {
        successfulMove = this.attemptMoveTileFromHandToBoard(
          tileDisplay,
          currentHandTileOldIndex,
          newIndex.boardIndex
        );
      }
      if (!successfulMove) {
        this.updateCurrentPlayerHandPosition(currentHandTileOldIndex);
      }
    }
    if (setTileOldIndex !== -1) {
      if (
        newIndex.currentHandIndex != null &&
        this.currentUserId == this.actionToUserId
      ) {
        successfulMove = this.attemptMoveTileFromBoardToHand(
          tileDisplay,
          setTileOldIndex,
          newIndex.currentHandIndex
        );
      }
      if (
        newIndex.boardIndex != null &&
        this.currentUserId == this.actionToUserId
      ) {
        successfulMove = this.attemptMoveTileWithinBoard(
          tileDisplay,
          setTileOldIndex,
          newIndex.boardIndex
        );
      }
      if (!successfulMove) {
        this.updateSetTilePosition(setTileOldIndex);
      }
    }
    if (successfulMove) {
      for (
        let index = 0;
        index < this.currentUserHandTileDisplays.length;
        index++
      ) {
        this.updateCurrentPlayerHandPosition(index);
      }
      for (let index = 0; index < this.setTileDisplays.length; index++) {
        this.updateSetTilePosition(index);
      }
    }
    this.layer.draw();
  }

  private attemptMoveTileWithinHand(
    tileDisplay: ITileDisplay,
    oldIndex: number,
    newIndex: number
  ) {
    if (this.currentUserHandTileDisplays[newIndex] == null) {
      this.currentUserHandTileDisplays[newIndex] = tileDisplay;
      this.currentUserHandTileDisplays[oldIndex] = null;
    } else {
      let nextFreeIndex: number | null = null;
      for (let index = newIndex + 1; index % TOTAL_COLUMNS != 0; index++) {
        if (
          index == oldIndex ||
          this.currentUserHandTileDisplays[index] == null
        ) {
          nextFreeIndex = index;
          break;
        }
      }
      if (nextFreeIndex == null) {
        return false;
      } else {
        for (let index = nextFreeIndex; index > newIndex; index--) {
          this.currentUserHandTileDisplays[index] =
            this.currentUserHandTileDisplays[index - 1];
        }
        this.currentUserHandTileDisplays[newIndex] = tileDisplay;
        if (nextFreeIndex != oldIndex) {
          this.currentUserHandTileDisplays[oldIndex] = null;
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
    const userTiles = this.getCurrentPlayerTiles();
    if (this.currentUpdateSets == null) {
      this.onRearrangeTiles(userTiles);
    } else {
      this.recomputeCurrentUpdateSets(null, null);
    }
    return true;
  }

  private attemptMoveTileFromHandToBoard(
    tileDisplay: ITileDisplay,
    oldIndex: number,
    newIndex: number
  ): boolean {
    const tileAdded = tileDisplay.tile;
    if (this.setTileDisplays[newIndex] == null) {
      this.setTileDisplays[newIndex] = tileDisplay;
      this.currentUserHandTileDisplays[oldIndex] = null;
    } else {
      let nextFreeIndex: number | null = null;
      for (let index = newIndex + 1; index % TOTAL_COLUMNS != 0; index++) {
        if (this.setTileDisplays[index] == null) {
          nextFreeIndex = index;
          break;
        }
      }
      if (nextFreeIndex == null) {
        return false;
      }
      for (let index = nextFreeIndex; index > newIndex; index--) {
        this.setTileDisplays[index] = this.setTileDisplays[index - 1];
      }
      this.setTileDisplays[newIndex] = tileDisplay;
      this.currentUserHandTileDisplays[oldIndex] = null;
    }
    this.recomputeCurrentUpdateSets(tileAdded, null);
    return true;
  }

  private attemptMoveTileWithinBoard(
    tileDisplay: ITileDisplay,
    oldIndex: number,
    newIndex: number
  ): boolean {
    if (this.setTileDisplays[newIndex] == null) {
      this.setTileDisplays[newIndex] = tileDisplay;
      this.setTileDisplays[oldIndex] = null;
    } else {
      let nextFreeIndex: number | null = null;
      for (let index = newIndex + 1; index % TOTAL_COLUMNS != 0; index++) {
        if (index == oldIndex || this.setTileDisplays[index] == null) {
          nextFreeIndex = index;
          break;
        }
      }
      if (nextFreeIndex == null) {
        return false;
      }
      for (let index = nextFreeIndex; index > newIndex; index--) {
        this.setTileDisplays[index] = this.setTileDisplays[index - 1];
      }
      this.setTileDisplays[newIndex] = tileDisplay;
      if (nextFreeIndex != oldIndex) {
        this.setTileDisplays[oldIndex] = null;
      }
    }
    for (let index = 0; index < this.setTileDisplays.length; index++) {
      this.updateSetTilePosition(index);
    }
    this.recomputeCurrentUpdateSets(null, null);
    return true;
  }

  private attemptMoveTileFromBoardToHand(
    tileDisplay: ITileDisplay,
    oldIndex: number,
    newIndex: number
  ): boolean {
    if (this.currentUpdateSets == null) {
      return false;
    }
    const removeTileIndex = this.currentUpdateSets.tilesAdded.findIndex((x) =>
      areTilesEqual(x, tileDisplay.tile)
    );
    if (removeTileIndex == -1) {
      return false;
    }
    if (this.currentUserHandTileDisplays[newIndex] == null) {
      this.currentUserHandTileDisplays[newIndex] = tileDisplay;
      this.setTileDisplays[oldIndex] = null;
    } else {
      let nextFreeIndex: number | null = null;
      for (let index = newIndex + 1; index % TOTAL_COLUMNS != 0; index++) {
        if (
          index == oldIndex ||
          this.currentUserHandTileDisplays[index] == null
        ) {
          nextFreeIndex = index;
          break;
        }
      }
      if (nextFreeIndex == null) {
        return false;
      } else {
        for (let index = nextFreeIndex; index > newIndex; index--) {
          this.currentUserHandTileDisplays[index] =
            this.currentUserHandTileDisplays[index - 1];
        }
        this.currentUserHandTileDisplays[newIndex] = tileDisplay;
        this.setTileDisplays[oldIndex] = null;
      }
    }
    this.recomputeCurrentUpdateSets(null, removeTileIndex);
    return true;
  }

  private recomputeCurrentUpdateSets(
    tileAdded: ITile | null,
    tileRemovedIndex: number | null
  ): void {
    if (this.currentUpdateSets == null) {
      this.currentUpdateSets = {
        sets: [],
        tilesAdded: [],
        remainingTiles: [],
      };
    }
    this.currentUpdateSets.sets = this.generateSetsFromDislay();
    this.currentUpdateSets.remainingTiles = this.getCurrentPlayerTiles();
    if (tileAdded != null) {
      this.currentUpdateSets.tilesAdded.push(tileAdded);
    }
    if (tileRemovedIndex != null) {
      this.currentUpdateSets.tilesAdded.splice(tileRemovedIndex, 1);
    }
    this.onUpdateSets(this.currentUpdateSets);
  }

  private generateSetsFromDislay(): ISets {
    const sets: ISets = [];
    let currentSet: ITile[] = [];
    for (let i = 0; i < this.setTileDisplays.length; i++) {
      const setTileDisplay = this.setTileDisplays[i];
      if (setTileDisplay == null) {
        if (currentSet.length > 0) {
          sets.push(currentSet);
          currentSet = [];
        }
        sets.push(null);
      } else {
        currentSet.push(setTileDisplay.tile);
      }
      if (i % TOTAL_COLUMNS == 0 && currentSet.length > 0) {
        sets.push(currentSet);
        currentSet = [];
      }
    }
    return sets;
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

  private getDraggedTileNewIndex(
    tileDisplay: ITileDisplay
  ): IDraggedTileNewIndex {
    const newX = tileDisplay.group.x();
    const newY = tileDisplay.group.y();
    for (let index = 0; index < BOARD_NUM_TILES; index++) {
      const { x, y } = this.getBoardPosition(index);
      if (
        newX > x - this.tileSize.width * 0.2 &&
        newX < x + this.tileSize.width * 0.8 &&
        newY > y - this.tileSize.height * 0.2 &&
        newY < y + this.tileSize.height * 0.8
      ) {
        return { boardIndex: index };
      }
    }
    for (let index = 0; index < CURRENT_USER_HAND_INITIAL_ROW; index++) {
      const { x, y } = this.getCurrentPlayerHandPosition(index);
      if (
        newX > x - this.tileSize.width * 0.2 &&
        newX < x + this.tileSize.width * 0.8 &&
        newY > y - this.tileSize.height * 0.2 &&
        newY < y + this.tileSize.height * 0.8
      ) {
        return { currentHandIndex: index };
      }
    }
    return {};
  }

  private getCurrentPlayerTiles(): IPlayerTiles {
    return this.currentUserHandTileDisplays.map((x) =>
      x == null ? null : x.tile
    );
  }
}
