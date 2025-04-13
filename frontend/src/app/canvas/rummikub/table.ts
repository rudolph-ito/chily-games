import { Stage as KonvaStage } from "konva/lib/Stage";
import { Text as KonvaText } from "konva/lib/shapes/Text";
import { Rect as KonvaRect } from "konva/lib/shapes/Rect";
import { Circle as KonvaCircle } from "konva/lib/shapes/Circle";
import { Layer as KonvaLayer } from "konva/lib/Layer";
import { Group as KonvaGroup } from "konva/lib/Group";
import { TOTAL_COLUMNS } from "src/app/shared/constants/rummikub";
import {
  GameState,
  IDoneWithTurnResponse,
  IGame,
  ILastAction,
  INullableTile,
  IPlayerState,
  IUpdateSets,
} from "src/app/shared/dtos/rummikub/game";
import { ITile, TileColor } from "src/app/shared/dtos/rummikub/tile";
import { Vector2d } from "konva/lib/types";
import { Easings as KonvaEasings, Tween as KonvaTween } from "konva/lib/Tween";
import { areTilesEqual } from "./tiles_helpers";
import { computeUpdateSetsChanges } from "./change_helpers";
import cardImages from "../../data/card_images";
import { attemptMoveGroup } from "./move_helpers";

export interface ITableOptions {
  element: HTMLDivElement;
}

interface IBoardCellDropSite {
  border: KonvaRect;
}

interface IGroupDisplay {
  firstTileIndex: number;
  tileCount: number;
  group: KonvaGroup;
  groupHandle: KonvaCircle;
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

interface IAttemptMoveTileGroupInput {
  firstTileOldIndex: number;
  firstTileNewIndex: number;
  tileGroupSize: number;
}

const TABLE_PADDING = 5;
const ACTION_PADDING = 50;
const TOTAL_ROWS = 10;
const BOARD_NUM_ROWS = 8;
const BOARD_NUM_TILES = BOARD_NUM_ROWS * TOTAL_COLUMNS;
const CURRENT_USER_HAND_ROWS = TOTAL_ROWS - BOARD_NUM_ROWS;
const CURRENT_USER_HAND_NUM_TILES = CURRENT_USER_HAND_ROWS * TOTAL_COLUMNS;
const TOTAL_NUM_TILES = BOARD_NUM_TILES + CURRENT_USER_HAND_NUM_TILES;
const TILE_WIDTH_OVER_HEIGHT_RATIO = 5 / 7;

const PLAYER_NAME_HEIGHT = 50;
const PLAYER_NAME_WIDTH = 100;

const TILE_DEFAULT_STROKE = 1;
const TILE_HOVER_STORKE = 5;
const GROUP_HANDLE_DEFAULT_STROKE = 0;
const GROUP_HANDLE_HOVER_STORKE = 3;

const GROUP_HANDLE_RADIUS = 6;
const ANIMATION_SECONDS = 2;

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
  private tileBackImage: HTMLImageElement;
  private tileSize: ISize;
  private gridOffset: Vector2d;
  private playerDisplays: Map<number, IPlayerDisplay>;
  private currentUserId: number | null;
  private actionToUserId: number | null;
  private gameState: GameState | null;
  private boardGridDropSites: IBoardCellDropSite[];
  private tilePoolText: KonvaText;
  private tileDisplays: (ITileDisplay | null)[] = [];
  private setGroups: IGroupDisplay[] = [];
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
    this.initializeSets(
      game.latestUpdateSets ??
        game.lastValidUpdateSets ?? {
          sets: game.sets,
          tilesAdded: [],
          remainingTiles: [],
        }
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
    this.recreateSetGroupDisplays();
    this.updateActionTo(game.actionToUserId);
    this.updateGameState(game.state);
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
    if (actionResponse.pickedUpTileData != null) {
      const { tile, playerTileIndex, tilePoolCount } =
        actionResponse.pickedUpTileData;
      const tileDisplay = this.createTileDisplay(tile);
      this.tileDisplays[this.handToTileIndex(playerTileIndex)] = tileDisplay;
      this.animateTileFaceUpFromPoolIntoCurrentUserHand(playerTileIndex);
      this.updateTilePoolCount(tilePoolCount);
    }
    if (actionResponse.actionToNextPlayerEvent != null) {
      this.updateActionTo(
        actionResponse.actionToNextPlayerEvent?.actionToUserId
      );
      this.recreateSetGroupDisplays();
    }
  }

  updateGameState(state: GameState): void {
    this.gameState = state;
  }

  updateStateWithUserAction(
    lastAction: ILastAction,
    newActionToUserId: number
  ): void {
    this.currentUpdateSets = {
      sets: this.currentUpdateSets.sets,
      tilesAdded: [],
      remainingTiles: [],
    };
    if (lastAction.pickUpTile) {
      this.animateTileFaceDownFromPoolToOtherPlayer(lastAction.userId);
      if (lastAction.tilePoolCount == null) {
        throw Error(
          "updateStateWithUserAction: last action tile pool count unexpectedly null"
        );
      }
      this.updateTilePoolCount(lastAction.tilePoolCount);
    }
    this.updateActionTo(newActionToUserId);
    this.recreateSetGroupDisplays();
  }

  updateStateWithUpdateSets(
    updateSets: IUpdateSets,
    isCurrentUserAction: boolean
  ): void {
    const changes = computeUpdateSetsChanges(
      this.currentUpdateSets,
      updateSets
    );
    const tweens: KonvaTween[] = [];
    const createdTileDisplays: ITileDisplay[] = [];
    for (const change of changes.setsToCurrentPlayerHand) {
      tweens.push(
        this.stageAnimationForSetsToCurrentPlayerHand(change.from, change.to)
      );
    }
    for (const change of changes.setsToOtherPlayerHand) {
      tweens.push(this.stageAnimationForSetsToOtherPlayerHand(change.from));
    }
    for (const change of changes.currentPlayerHandToSets) {
      tweens.push(
        this.stageAnimationForCurrentPlayerHandToSets(change.from, change.to)
      );
    }
    for (const change of changes.otherPlayerHandToSets) {
      const tileDisplay = this.createTileDisplay(change.tile);
      createdTileDisplays.push(tileDisplay);
      tweens.push(
        this.stageAnimationForOtherPlayerHandToSets(tileDisplay, change.to)
      );
    }
    for (const change of changes.withinSets) {
      tweens.push(this.stageAnimationForWithinSets(change.from, change.to));
    }
    for (const change of changes.withinCurrentPlayerHand) {
      tweens.push(
        this.stageAnimationForWithinCurrentPlayerHand(change.from, change.to)
      );
    }

    this.currentUpdateSets = updateSets;
    const oldTileDisplays = this.tileDisplays.slice();
    for (const change of changes.setsToCurrentPlayerHand) {
      this.tileDisplays[this.handToTileIndex(change.to)] =
        oldTileDisplays[change.from];
    }
    for (const change of changes.currentPlayerHandToSets) {
      this.tileDisplays[change.to] =
        oldTileDisplays[this.handToTileIndex(change.from)];
    }
    for (const index in changes.otherPlayerHandToSets) {
      const { to } = changes.otherPlayerHandToSets[index];
      this.tileDisplays[to] = createdTileDisplays[index];
    }
    for (const change of changes.withinSets) {
      this.tileDisplays[change.to] = oldTileDisplays[change.from];
    }
    for (const change of changes.withinCurrentPlayerHand) {
      this.tileDisplays[this.handToTileIndex(change.to)] =
        oldTileDisplays[this.handToTileIndex(change.from)];
    }
    for (const index of changes.setIndexesToClear) {
      this.tileDisplays[index] = null;
    }
    for (const index of changes.currentPlayerHandIndexesToClear) {
      this.tileDisplays[this.handToTileIndex(index)] = null;
    }

    if (isCurrentUserAction) {
      this.removeSetGroupDisplays();
    }
    for (const tween of tweens) {
      tween.play();
    }
    if (isCurrentUserAction) {
      setTimeout(() => {
        this.recreateSetGroupDisplays();
        this.layer.draw();
      }, ANIMATION_SECONDS * 1000);
    }
  }

  private handToTileIndex(relativeIndex: number) {
    return BOARD_NUM_TILES + relativeIndex;
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

    if (!this.layer.hasChildren()) {
      return;
    }

    for (
      let index = 0;
      index < BOARD_NUM_TILES + CURRENT_USER_HAND_NUM_TILES;
      index++
    ) {
      this.updateBoardGridDropSitePosition(index);
    }

    for (let index = 0; index < this.tileDisplays.length; index++) {
      this.updateTilePosition(index);
    }

    for (let index = 0; index < this.setGroups.length; index++) {
      this.updateSetGroupPosition(index);
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
      x: this.gridOffset.x,
      y: this.stage.height() - PLAYER_NAME_HEIGHT - TABLE_PADDING,
    };
  }

  private computeTileSize(): void {
    const tileAreaHeight =
      this.container.offsetHeight - 2 * PLAYER_NAME_HEIGHT - 2 * TABLE_PADDING;
    const tileAreaWidth =
      this.container.offsetWidth - 2 * TABLE_PADDING - ACTION_PADDING;
    // Extra row for spacing:
    // - half a tile spacing between hand + board
    // - half a tile worth of spacing put between the rows on the board
    const maxHeight1 = tileAreaHeight / (TOTAL_ROWS + 1);
    const maxWidth = tileAreaWidth / TOTAL_COLUMNS;
    const maxHeight2 = maxWidth / TILE_WIDTH_OVER_HEIGHT_RATIO;
    const maxHeight = Math.min(maxHeight1, maxHeight2);
    this.tileSize = {
      height: maxHeight,
      width: maxHeight * TILE_WIDTH_OVER_HEIGHT_RATIO,
    };
    const extraHorizontalSpace =
      (tileAreaWidth - this.tileSize.width * TOTAL_COLUMNS) / 2;
    const extraVerticalSpace =
      (tileAreaHeight - this.tileSize.height * (TOTAL_ROWS + 1)) / 2;
    this.gridOffset = {
      x: extraHorizontalSpace + TABLE_PADDING + ACTION_PADDING,
      y: extraVerticalSpace + TABLE_PADDING + PLAYER_NAME_HEIGHT,
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
      fill: "white",
    });
    const group = new KonvaGroup({ draggable: true });
    group.add(border, value);
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

  private removeSetGroupDisplays(): void {
    if (this.setGroups != null) {
      this.setGroups.forEach((x) => x.group.destroy());
    }
    this.setGroups = [];
  }

  private recreateSetGroupDisplays(): void {
    this.removeSetGroupDisplays();
    let firstTileIndex = -1;
    let tileCount = 0;
    for (let i = 0; i < this.tileDisplays.length; i++) {
      if (i < BOARD_NUM_TILES && this.actionToUserId != this.currentUserId) {
        continue;
      }
      const tileDisplay = this.tileDisplays[i];
      if (tileDisplay == null) {
        if (firstTileIndex != -1 && tileCount > 2) {
          this.setGroups.push(
            this.createGroupDisplay(firstTileIndex, tileCount)
          );
        }
        firstTileIndex = -1;
        tileCount = 0;
      } else {
        if (firstTileIndex == -1) {
          firstTileIndex = i;
        }
        tileCount += 1;
      }
    }
    for (let index = 0; index < this.setGroups.length; index++) {
      this.initializeGroupEventHandlers(this.setGroups[index]);
      this.updateSetGroupPosition(index);
    }
  }

  private createGroupDisplay(
    firstTileIndex: number,
    tileCount: number
  ): IGroupDisplay {
    const group = new KonvaGroup({ draggable: true });
    const groupHandle = new KonvaCircle({
      radius: GROUP_HANDLE_RADIUS,
      fill: "#888",
      stroke: "black",
      strokeWidth: GROUP_HANDLE_DEFAULT_STROKE,
    });
    group.add(groupHandle);
    this.layer.add(group);
    return {
      firstTileIndex,
      tileCount,
      group,
      groupHandle,
    };
  }

  private updateSetGroupPosition(index: number): void {
    const groupDisplay = this.setGroups[index];
    const firstTilePosition = this.getBoardPosition(
      groupDisplay.firstTileIndex
    );
    groupDisplay.groupHandle.setPosition(
      this.addVectors(firstTilePosition, this.getGroupHandleOffset())
    );
  }

  private getGroupHandleOffset(): Vector2d {
    return {
      x: -GROUP_HANDLE_RADIUS,
      y: this.tileSize.height / 2 - GROUP_HANDLE_RADIUS / 2,
    };
  }

  private addVectors(a: Vector2d, b: Vector2d): Vector2d {
    return { x: a.x + b.x, y: a.y + b.y };
  }

  private subtractVectors(a: Vector2d, b: Vector2d): Vector2d {
    return { x: a.x - b.x, y: a.y - b.y };
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
    } else {
      const fraction = player.positionIndex / playerCount;
      position = {
        x:
          this.stage.width() * fraction - PLAYER_NAME_WIDTH / 2 + TABLE_PADDING,
        y: TABLE_PADDING,
      };
    }
    return {
      textPosition: position,
      textSize: { width: PLAYER_NAME_WIDTH, height: PLAYER_NAME_HEIGHT },
      borderPosition: position,
      borderSize: { width: PLAYER_NAME_WIDTH, height: PLAYER_NAME_HEIGHT },
    };
  }

  private initializeCurrentPlayerHand(playerTiles: INullableTile[]): void {
    if (this.tileDisplays.length > BOARD_NUM_TILES) {
      this.tileDisplays = this.tileDisplays.slice(0, BOARD_NUM_TILES);
    }
    for (let i = 0; i < CURRENT_USER_HAND_NUM_TILES; i++) {
      const nullableTile = i < playerTiles.length ? playerTiles[i] : null;
      this.tileDisplays.push(this.createNullableTileDisplay(nullableTile));
    }
  }

  private initializeSets(updateSets: IUpdateSets): void {
    this.currentUpdateSets = updateSets;
    this.tileDisplays = updateSets.sets.map((x) =>
      x == null ? null : this.createTileDisplay(x)
    );
    while (this.tileDisplays.length < BOARD_NUM_TILES) {
      this.tileDisplays.push(null);
    }
  }

  private animateTileFaceUpFromPoolIntoCurrentUserHand(
    playerTileIndex: number
  ): void {
    const overallTileIndex = this.handToTileIndex(playerTileIndex);
    const tileDisplay = this.tileDisplays[overallTileIndex];
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
    const handPosition = this.getBoardPosition(overallTileIndex);
    const tween = new KonvaTween({
      node: tileDisplay.group,
      duration: ANIMATION_SECONDS,
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
      stroke: "black",
      strokeWidth: TILE_DEFAULT_STROKE,
      width: this.tileSize.width * 0.9,
      height: this.tileSize.height * 0.9,
    });
    tileBorder.setPosition(this.getTilePoolPosition());
    this.updateRectWithTileBack(tileBorder, () => {
      this.layer.add(tileBorder);
      const tween = new KonvaTween({
        node: tileBorder,
        duration: ANIMATION_SECONDS,
        easing: KonvaEasings.EaseInOut,
        onFinish: () => {
          tileBorder.destroy();
          this.layer.draw();
        },
        x: positionData.textPosition.x,
        y: positionData.textPosition.y,
      });
      tween.play();
    });
  }

  private stageAnimationDefault(
    oldIndex: number,
    newIndex: number
  ): KonvaTween {
    const tileDisplay = this.tileDisplays[oldIndex];
    if (tileDisplay == null) {
      throw Error("stageAnimationDefault: old tile unexpectedly not found");
    }
    const positionData = this.getBoardPosition(newIndex);
    return new KonvaTween({
      node: tileDisplay.group,
      duration: ANIMATION_SECONDS,
      easing: KonvaEasings.EaseInOut,
      x: positionData.x,
      y: positionData.y,
    });
  }

  private stageAnimationForWithinSets(
    oldIndex: number,
    newIndex: number
  ): KonvaTween {
    return this.stageAnimationDefault(oldIndex, newIndex);
  }

  private stageAnimationForWithinCurrentPlayerHand(
    oldHandIndex: number,
    newHandIndex: number
  ): KonvaTween {
    return this.stageAnimationDefault(
      this.handToTileIndex(oldHandIndex),
      this.handToTileIndex(newHandIndex)
    );
  }

  private stageAnimationForOtherPlayerHandToSets(
    tileDisplay: ITileDisplay,
    index: number
  ): KonvaTween {
    const playerDisplay = Array.from(this.playerDisplays.values()).find(
      (x) => x.userId == this.actionToUserId
    );
    if (playerDisplay == null) {
      throw Error(
        "stageAnimationForOtherPlayerHandToSets: player unexpectedly not found"
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
      duration: ANIMATION_SECONDS,
      easing: KonvaEasings.EaseInOut,
      x: boardPositionData.x,
      y: boardPositionData.y,
    });
  }

  private stageAnimationForSetsToOtherPlayerHand(index: number): KonvaTween {
    const tileDisplay = this.tileDisplays[index];
    if (tileDisplay == null) {
      throw Error(
        "stageAnimationForSetsToOtherPlayerHand: tile unexpectedly not found"
      );
    }
    const playerDisplay = Array.from(this.playerDisplays.values()).find(
      (x) => x.userId == this.actionToUserId
    );
    if (playerDisplay == null) {
      throw Error(
        "stageAnimationForSetsToOtherPlayerHand: player unexpectedly not found"
      );
    }
    const playerPositionData = this.getPlayerNamePositionData(
      playerDisplay,
      this.playerDisplays.size
    );
    return new KonvaTween({
      node: tileDisplay.group,
      duration: ANIMATION_SECONDS,
      easing: KonvaEasings.EaseInOut,
      onFinish: () => {
        tileDisplay.group.destroy();
        this.layer.draw();
      },
      x: playerPositionData.textPosition.x,
      y: playerPositionData.textPosition.y,
    });
  }

  private stageAnimationForSetsToCurrentPlayerHand(
    fromBoardIndex: number,
    toHandIndex: number
  ): KonvaTween {
    return this.stageAnimationDefault(
      fromBoardIndex,
      this.handToTileIndex(toHandIndex)
    );
  }

  private stageAnimationForCurrentPlayerHandToSets(
    fromHandIndex: number,
    toBoardIndex: number
  ): KonvaTween {
    return this.stageAnimationDefault(
      this.handToTileIndex(fromHandIndex),
      toBoardIndex
    );
  }

  private getBoardPosition(index: number): Vector2d {
    const columnOffset = index % TOTAL_COLUMNS;
    const x = columnOffset * this.tileSize.width + this.gridOffset.x;
    const rowOffset = Math.floor(index / TOTAL_COLUMNS);
    let y = rowOffset * this.tileSize.height + this.gridOffset.y;
    if (rowOffset > 0) {
      const boardRowDividerHeight = this.tileSize.height / 2 / BOARD_NUM_ROWS;
      const numberOfBoardRowDividers = Math.min(rowOffset, BOARD_NUM_ROWS);
      y += boardRowDividerHeight * numberOfBoardRowDividers;
    }
    if (rowOffset >= BOARD_NUM_ROWS) {
      y += this.tileSize.height / 2;
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

  private updateTilePosition(index: number): void {
    const { x, y } = this.getBoardPosition(index);
    const tileDisplay = this.tileDisplays[index];
    if (tileDisplay) {
      tileDisplay.value.fontSize((this.tileSize.width * 3) / 4);
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

  private updateGroupHandleStroke(circle: KonvaCircle, hover: boolean): void {
    circle.strokeWidth(
      hover ? GROUP_HANDLE_HOVER_STORKE : GROUP_HANDLE_DEFAULT_STROKE
    );
  }

  private removeTileEventHandlers(group: KonvaGroup): void {
    group.off("mouseover");
    group.off("mouseout");
    group.off("dragstart");
    group.off("dragend");
  }

  private onTileDragEnd(tileDisplay: ITileDisplay): void {
    const oldIndex = this.tileDisplays.findIndex((x) => x === tileDisplay);
    const newIndex = this.getDraggedTileNewIndex(tileDisplay.group.position());
    this.attemptMoveTileGroup({
      firstTileOldIndex: oldIndex,
      firstTileNewIndex: newIndex,
      tileGroupSize: 1,
    });
  }

  private attemptMoveTileGroup(input: IAttemptMoveTileGroupInput) {
    if (input.firstTileOldIndex >= BOARD_NUM_TILES) {
      if (input.firstTileNewIndex >= BOARD_NUM_TILES) {
        this.attemptMoveTileGroupWithinHand(input);
      } else if (this.currentUserId == this.actionToUserId) {
        this.attemptMoveTileGroupFromHandToBoard(input);
      }
    } else {
      if (
        input.firstTileNewIndex >= BOARD_NUM_TILES &&
        this.currentUserId == this.actionToUserId
      ) {
        this.attemptMoveTileGroupFromBoardToHand(input);
      } else if (this.currentUserId == this.actionToUserId) {
        this.attemptMoveTileGroupWithinBoard(input);
      }
    }
    for (let index = 0; index < this.tileDisplays.length; index++) {
      this.updateTilePosition(index);
    }
    this.recreateSetGroupDisplays();
    this.layer.draw();
  }

  private attemptMoveDisplaysAndUpdateOnSuccess(
    input: IAttemptMoveTileGroupInput
  ): boolean {
    const result = attemptMoveGroup({
      list: this.tileDisplays,
      rowSize: TOTAL_COLUMNS,
      firstItemOldIndex: input.firstTileOldIndex,
      firstItemNewIndex: input.firstTileNewIndex,
      groupSize: input.tileGroupSize,
    });
    if (!result.success) {
      return false;
    }
    this.tileDisplays = result.list;
    return true;
  }

  private attemptMoveTileGroupWithinHand(
    input: IAttemptMoveTileGroupInput
  ): void {
    const success = this.attemptMoveDisplaysAndUpdateOnSuccess(input);
    if (success) {
      const userTiles = this.getCurrentPlayerTiles();
      if (this.actionToUserId !== this.currentUserId) {
        this.onRearrangeTiles(userTiles);
      } else {
        this.recomputeCurrentUpdateSets(null, null);
      }
    }
  }

  private attemptMoveTileGroupFromHandToBoard(
    input: IAttemptMoveTileGroupInput
  ): void {
    const success = this.attemptMoveDisplaysAndUpdateOnSuccess(input);
    if (success) {
      const addedTiles = this.tileDisplays
        .slice(
          input.firstTileNewIndex,
          input.firstTileNewIndex + input.tileGroupSize
        )
        .map((display) => {
          if (display == null) {
            throw new Error(
              "attemptMoveTileGroupFromHandToBoard - tile unexpectedly null"
            );
          }
          return display.tile;
        });
      this.recomputeCurrentUpdateSets(addedTiles, null);
    }
  }

  private attemptMoveTileGroupWithinBoard(
    input: IAttemptMoveTileGroupInput
  ): void {
    const success = this.attemptMoveDisplaysAndUpdateOnSuccess(input);
    if (success) {
      this.recomputeCurrentUpdateSets(null, null);
    }
  }

  private attemptMoveTileGroupFromBoardToHand(
    input: IAttemptMoveTileGroupInput
  ): void {
    if (this.currentUpdateSets == null) {
      return;
    }
    const removedTiles = this.tileDisplays
      .slice(
        input.firstTileOldIndex,
        input.firstTileOldIndex + input.tileGroupSize
      )
      .map((display) => {
        if (display == null) {
          throw new Error(
            "attemptMoveTileGroupFromBoardToHand - tile unexpectedly null"
          );
        }
        return display.tile;
      });
    const pool = this.currentUpdateSets.tilesAdded;
    const removedTileIndexes: number[] = [];
    for (let i = 0; i < removedTiles.length; i++) {
      const tile = removedTiles[i];
      const removeTileIndex = pool.findIndex((x) => areTilesEqual(x, tile));
      if (removeTileIndex == -1) {
        return;
      }
      pool.splice(removeTileIndex, 1);
      removedTileIndexes.push(i);
    }
    const success = this.attemptMoveDisplaysAndUpdateOnSuccess(input);
    if (success) {
      this.recomputeCurrentUpdateSets(null, removedTileIndexes);
    }
  }

  private recomputeCurrentUpdateSets(
    addedTiles: ITile[] | null,
    removedTileIndexes: number[] | null
  ): void {
    if (this.currentUpdateSets == null) {
      this.currentUpdateSets = {
        sets: [],
        tilesAdded: [],
        remainingTiles: [],
      };
    }
    this.currentUpdateSets.sets = this.getSetsTiles();
    this.currentUpdateSets.remainingTiles = this.getCurrentPlayerTiles();
    if (addedTiles != null) {
      this.currentUpdateSets.tilesAdded.push(...addedTiles);
    }
    if (removedTileIndexes != null) {
      const updatedTilesAdded: ITile[] = [];
      for (let i = 0; i < this.currentUpdateSets.tilesAdded.length; i++) {
        if (!removedTileIndexes.includes(i)) {
          updatedTilesAdded.push(this.currentUpdateSets.tilesAdded[i]);
        }
      }
      this.currentUpdateSets.tilesAdded = updatedTilesAdded;
    }
    this.onUpdateSets(this.currentUpdateSets);
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

  private initializeGroupEventHandlers(groupDisplay: IGroupDisplay): void {
    groupDisplay.groupHandle.on("mouseover", () => {
      this.updateGroupHandleStroke(groupDisplay.groupHandle, true);
      this.addTilesToGroup(groupDisplay);
    });
    groupDisplay.groupHandle.on("mouseout", () => {
      this.recreateGroupTileDisplays(groupDisplay);
      this.recreateSetGroupDisplays();
      this.layer.draw();
    });
    groupDisplay.group.on("dragstart", () => {
      groupDisplay.group.moveToTop();
      this.layer.draw();
    });
    groupDisplay.group.on("dragend", () => {
      this.recreateGroupTileDisplays(groupDisplay);
      this.onGroupDragEnd(groupDisplay);
    });
  }

  private addTilesToGroup(groupDisplay: IGroupDisplay): void {
    for (let i = 0; i < groupDisplay.tileCount; i++) {
      const tileDisplay = this.tileDisplays[groupDisplay.firstTileIndex + i];
      if (tileDisplay == null) {
        throw new Error("Tile display unexpectedly null");
      }
      groupDisplay.group.add(tileDisplay.group);
    }
  }

  private recreateGroupTileDisplays(groupDisplay: IGroupDisplay): void {
    for (let i = 0; i < groupDisplay.tileCount; i++) {
      const tileIndex = groupDisplay.firstTileIndex + i;
      const tileDisplay = this.tileDisplays[tileIndex];
      if (tileDisplay == null) {
        throw new Error("Tile display unexpectedly null");
      }
      this.tileDisplays[tileIndex] = this.createNullableTileDisplay(
        tileDisplay.tile
      );
      this.updateTilePosition(tileIndex);
    }
  }

  private onGroupDragEnd(groupDisplay: IGroupDisplay): void {
    const newIndex = this.getDraggedTileNewIndex(
      this.subtractVectors(
        this.addVectors(
          groupDisplay.groupHandle.position(),
          groupDisplay.group.position()
        ),
        this.getGroupHandleOffset()
      )
    );
    this.attemptMoveTileGroup({
      firstTileOldIndex: groupDisplay.firstTileIndex,
      firstTileNewIndex: newIndex,
      tileGroupSize: groupDisplay.tileCount,
    });
  }

  private getDraggedTileNewIndex(position: Vector2d): number {
    if (this.gameState != GameState.ROUND_ACTIVE) {
      return -1;
    }
    const { x: newX, y: newY } = position;
    for (
      let index = 0;
      index < BOARD_NUM_TILES + CURRENT_USER_HAND_NUM_TILES;
      index++
    ) {
      const { x, y } = this.getBoardPosition(index);
      if (
        newX > x - this.tileSize.width * 0.2 &&
        newX < x + this.tileSize.width * 0.8 &&
        newY > y - this.tileSize.height * 0.2 &&
        newY < y + this.tileSize.height * 0.8
      ) {
        return index;
      }
    }
    return -1;
  }

  private getCurrentPlayerTiles(): INullableTile[] {
    return this.tileDisplays
      .slice(BOARD_NUM_TILES)
      .map((x) => (x == null ? null : x.tile));
  }

  private getSetsTiles(): INullableTile[] {
    return this.tileDisplays
      .slice(0, BOARD_NUM_TILES)
      .map((x) => (x == null ? null : x.tile));
  }

  private updateRectWithTileBack(rect: KonvaRect, onFinish: () => void): void {
    const afterImageLoaded = () => {
      this.updateRectWithImage(rect, this.tileBackImage);
      onFinish();
    };
    if (this.tileBackImage == null) {
      const image = new Image();
      image.src = `data:image/png;base64,${cardImages.back}`;
      image.onload = () => {
        this.tileBackImage = image;
        afterImageLoaded();
      };
    } else {
      afterImageLoaded();
    }
  }

  private updateRectWithImage(rect: KonvaRect, image: HTMLImageElement): void {
    rect.fillPatternImage(image);
    rect.fillPatternRepeat("no-repeat");
    rect.fillPatternScale({
      x: rect.width() / image.width,
      y: rect.height() / image.height,
    });
  }
}
