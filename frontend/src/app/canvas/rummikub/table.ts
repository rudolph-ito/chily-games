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
import { ITile } from "src/app/shared/dtos/rummikub/tile";
import { Vector2d } from "konva/lib/types";

export interface ITableOptions {
  element: HTMLDivElement;
}

interface ISetDisplay {
  tiles: ITileDisplay[];
  group: KonvaGroup;
  groupToggle: KonvaText;
}

interface ICurrentUserHandDislay {
  tiles: ITileDisplay[][];
}

interface ITileDisplay {
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
  textWidth: number;
  borderPosition: Vector2d;
  borderSize: ISize;
}

const BOARD_GRID_SIZE = 13;
const CURRENT_USER_HAND_ROWS = 3;
const CURRENT_USER_HARD_COLUMNS = BOARD_GRID_SIZE;

const PLAYER_NAME_HEIGHT = 50;
const PLAYER_NAME_WIDTH = 100;
const DIVIDER_HEIGHT = 10;
const MAX_SETS_IN_COLUMN = BOARD_GRID_SIZE - CURRENT_USER_HAND_ROWS;

export class RummikubTable {
  private readonly container: HTMLDivElement;
  private readonly stage: KonvaStage;
  private readonly layer: KonvaLayer;
  private tileSize: number;
  private playerDisplays: Map<number, IPlayerDisplay>;
  private currentUserId: number | null;
  private currentUserHandTileDisplays: ITileDisplay[];
  private setDisplays: ISetDisplay[];
  private readonly onPlay: (request: IGameActionRequest) => void;
  private readonly onRearrangeTiles: (cards: ITile[]) => void;

  constructor(
    options: ITableOptions,
    onPlay: (request: IGameActionRequest) => void,
    onRearrangeTiles: (cards: ITile[]) => void
  ) {
    this.container = options.element;
    this.onPlay = onPlay;
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
    if (game.state !== GameState.PLAYERS_JOINING) {
      this.initializePlayers(game);
    }
    const currentPlayerState = game.playerStates.find(x => x.userId == currentUserId)
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

  async updateStateWithUserAction(
    lastAction: ILastAction,
    newActionToUserId: number,
    tilePickedUp?: ITile
  ): Promise<void> {}

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

    const columnWidths: number[] = []
    let maxColumnWidth = 0;
    for (let index = 0; index < this.setDisplays.length; index++) {
      if (index % MAX_SETS_IN_COLUMN == 0) {
        columnWidths.push(maxColumnWidth)
        maxColumnWidth = 0
      }
      if (this.setDisplays[index].tiles.length > maxColumnWidth) {
        maxColumnWidth = this.setDisplays[index].tiles.length;
      }
    }

    for (let index = 0; index < this.setDisplays.length; index++) {
      this.updateSetPosition(
        index,
        columnWidths
      )
    }

    for (let index = 0; index < this.currentUserHandTileDisplays.length; index++) {
      this.updateCurrentPlayerHandPositions(index)
    }

    this.playerDisplays.forEach((playerDisplay) => {
      const positionalData = this.getPlayerNamePositionData(
        playerDisplay,
        this.playerDisplays.size
      );
      playerDisplay.name.position(positionalData.textPosition);
      playerDisplay.name.width(positionalData.textWidth);
      playerDisplay.border.position(positionalData.borderPosition);
      playerDisplay.border.size(positionalData.borderSize);
    });

    this.layer.draw();
  }

  clear(): void {}

  private computeTileSize(): void {
    const min = Math.min(
      this.container.offsetHeight - 2 * PLAYER_NAME_HEIGHT,
      this.container.offsetWidth - 2 * PLAYER_NAME_WIDTH
    );
    this.tileSize = min / 13;
  }

  private getTileText(tile: ITile): string {
    if (tile.isJoker) {
      return "☺"
    }
    if (tile.rank == null) {
      throw Error("Tile rank unexpectedly null")
    }
    return tile.rank.toString();
  }

  private createTileDisplay(
    tile: ITile,
  ): ITileDisplay {
    const value = new KonvaText({
      align: "center",
      fontSize: 16,
      fill: tile.color,
      text: this.getTileText(tile)
    });
    this.layer.add(value);
    const border = new KonvaRect({
      stroke: "black",
      strokeWidth: 1,
    });
    this.layer.add(border);
    const group = new KonvaGroup();
    group.add(value, border)
    return { value, border, group }
  }

  private createSetDisplay(
    tiles: ITile[]
  ): ISetDisplay {
    const tileDisplays = tiles.map(x => this.createTileDisplay(x));
    const group = new KonvaGroup();
    group.add(...tileDisplays.map(x => x.value));
    group.add(...tileDisplays.map(x => x.border));
    const groupToggle = new KonvaText();
    return {
      tiles: tileDisplays,
      group,
      groupToggle,
    }
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
      this.initializePlayer(
        game.playerStates[index],
        positionIndex
      );
    }
  }

  private initializePlayer(
    playerState: IPlayerState,
    positionIndex: number,
  ): void {
    const name = new KonvaText({
      align: "center",
      fontSize: 16,
      text: playerState.displayName,
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

  private getPlayerNamePositionData(player: IPlayerDisplay, playerCount: number): IPlayerNamePositionData {
    let position: Vector2d;
    if (player.positionIndex == 0) {
      position = { x: this.stage.width() / 2, y: this.stage.height() - (PLAYER_NAME_HEIGHT / 2) };
    }
    else if (player.positionIndex == 1 && playerCount == 2 || player.positionIndex == 2 && playerCount == 4) {
      position = { x: this.stage.width() / 2, y: (PLAYER_NAME_HEIGHT / 2) };
    }
    else if (player.positionIndex == 1) {
      position = { x: (PLAYER_NAME_WIDTH / 2), y: this.stage.height() / 2 };
    }
    else {
      position = { x: this.stage.width() - (PLAYER_NAME_WIDTH / 2), y: this.stage.height() / 2 };
    }
    return {
      textPosition: position,
      textWidth: PLAYER_NAME_WIDTH,
      borderPosition: position,
      borderSize: { width: PLAYER_NAME_WIDTH, height: PLAYER_NAME_HEIGHT },
    }
  }

  private initializeCurrentPlayerHand(playerState: IPlayerState): void {
    this.currentUserHandTileDisplays = playerState.tiles.map(x => this.createTileDisplay(x));
  }

  private initializeSets(game: IGame): void {
    this.setDisplays = game.sets.map(x => this.createSetDisplay(x))
  }

  private updateCurrentPlayerHandPositions(tileIndex: number): void {
    const columnOffset = tileIndex % BOARD_GRID_SIZE;
    const x = columnOffset * this.tileSize;
    const rowOffset = Math.floor(tileIndex / BOARD_GRID_SIZE);
    const y = rowOffset * this.tileSize;
    this.currentUserHandTileDisplays[tileIndex].group.setPosition({x, y});
  }

  private updateSetPosition(setIndex: number, columnWidths: number[]): void {
    const columnOffset = Math.floor(setIndex / MAX_SETS_IN_COLUMN);
    const xTileOffset = columnWidths.slice(0, columnOffset).reduce((sum, x) => sum + x, 0);
    const x = xTileOffset * this.tileSize;
    const rowOffset = setIndex % MAX_SETS_IN_COLUMN;
    const y = rowOffset * this.tileSize;
    this.setDisplays[setIndex].group.setPosition({x, y});
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
}
