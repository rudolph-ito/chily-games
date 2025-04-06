import _ from "lodash";
import {
  ISerializedRummikubGame,
  IRummikubRoundPlayerScore,
  IRummikubPlayer,
} from "../../database/models/rummikub_game";
import {
  IGameOptions,
  IGame,
  IPlayerState,
  GameState,
  IRoundScore,
  IDoneWithTurnResponse,
  ISearchGamesRequest,
  ISearchedGame,
  IRoundFinishedEvent,
  IUpdateSets,
  ILastAction,
  IPickedUpTileData,
  INullableTile,
  IPlayerUpdatedSetsEvent,
} from "../../shared/dtos/rummikub/game";
import { ValidationError } from "../shared/exceptions";
import {
  IRummikubGameDataService,
  IRummikubGameUpdateOptions,
  RummikubGameDataService,
} from "./data/rummikub_game_data_service";
import { IPaginatedResponse } from "../../shared/dtos/search";
import {
  IUserDataService,
  UserDataService,
} from "../shared/data/user_data_service";
import { TOTAL_COLUMNS } from "../../shared/constants/rummikub";
import { ITile } from "../../shared/dtos/rummikub/tile";
import {
  areTileSetsEquivalent,
  getSerializedTileCounts,
  standardTiles,
} from "./tile_helpers";
import { isOnlyAddingNewSets, isValidSet } from "./set_helpers";
import { getTilesScore } from "./score_helpers";

const isNotNull = <T>(value: T | null): value is T => value !== null;

export interface IRummikubGameService {
  abort: (userId: number, gameId: number) => Promise<IGame>;
  create: (userId: number, options: IGameOptions) => Promise<IGame>;
  get: (userId: number | null, gameId: number) => Promise<IGame>;
  join: (userId: number, gameId: number) => Promise<IGame>;
  startRound: (userId: number, gameId: number) => Promise<IGame>;
  doneWithTurn: (
    userId: number,
    gameId: number
  ) => Promise<IDoneWithTurnResponse>;
  saveLatestUpdateSets: (
    userId: number,
    gameId: number,
    updateSets: IUpdateSets
  ) => Promise<IPlayerUpdatedSetsEvent>;
  revertToLastValidUpdateSets: (
    userId: number,
    gameId: number
  ) => Promise<IUpdateSets>;
  rearrangeTiles: (
    userId: number,
    gameId: number,
    tiles: INullableTile[]
  ) => Promise<void>;
  search: (
    request: ISearchGamesRequest
  ) => Promise<IPaginatedResponse<ISearchedGame>>;
}

export class RummikubGameService implements IRummikubGameService {
  constructor(
    private readonly gameDataService: IRummikubGameDataService = new RummikubGameDataService(),
    private readonly userDataService: IUserDataService = new UserDataService()
  ) {}

  async abort(userId: number, gameId: number): Promise<IGame> {
    let game = await this.gameDataService.get(gameId);
    if (game.hostUserId !== userId) {
      throw new ValidationError("Only the host can abort the game");
    }
    if (game.state === GameState.COMPLETE) {
      throw new ValidationError("Game is already complete");
    }
    game = await this.gameDataService.update(game.gameId, game.version, {
      state: GameState.ABORTED,
    });
    return await this.loadFullGame(game, userId);
  }

  async create(userId: number, options: IGameOptions): Promise<IGame> {
    // validate options
    const game = await this.gameDataService.create({
      hostPlayer: this.createPlayer(userId),
      options,
    });
    return await this.loadFullGame(game, userId);
  }

  async get(userId: number, gameId: number): Promise<IGame> {
    const game = await this.gameDataService.get(gameId);
    return await this.loadFullGame(game, userId);
  }

  async join(userId: number, gameId: number): Promise<IGame> {
    let game = await this.gameDataService.get(gameId);
    if (game.state !== GameState.PLAYERS_JOINING) {
      throw new ValidationError("Cannot join in-progress or completed game.");
    }
    if (game.players.some((x) => x.userId === userId)) {
      throw new ValidationError("Already joined game.");
    }
    if (game.players.length == 6) {
      throw new ValidationError("Game is full.");
    }
    game = await this.gameDataService.update(game.gameId, game.version, {
      players: game.players.concat([this.createPlayer(userId)]),
    });
    return await this.loadFullGame(game, userId);
  }

  async startRound(userId: number, gameId: number): Promise<IGame> {
    let game = await this.gameDataService.get(gameId);
    if (game.hostUserId !== userId) {
      throw new ValidationError("Only the host can start rounds");
    }
    if (game.state === GameState.PLAYERS_JOINING && game.players.length === 1) {
      throw new ValidationError("Must have at least two players to start");
    }
    if (
      game.state !== GameState.PLAYERS_JOINING &&
      game.state !== GameState.ROUND_COMPLETE
    ) {
      throw new ValidationError("Invalid state to start round");
    }
    const tilePool = standardTiles({ useExpansion: game.players.length > 4 });
    const updatedPlayers: IRummikubPlayer[] = game.players.map((x) =>
      this.createPlayer(x.userId)
    );
    const initialTileCount = game.players.length == 2 ? 20 : 14;
    for (let i = 0; i < initialTileCount; i++) {
      updatedPlayers.forEach((x) => {
        const nextCard = tilePool.pop();
        if (nextCard == null) {
          throw new Error("Unexpected empty tile pool (dealing to players)");
        }
        x.tiles.push(nextCard);
      });
    }
    game = await this.gameDataService.update(gameId, game.version, {
      state: GameState.ROUND_ACTIVE,
      sets: [],
      tilePool,
      players: updatedPlayers,
    });
    return await this.loadFullGame(game, userId);
  }

  async doneWithTurn(
    userId: number,
    gameId: number
  ): Promise<IDoneWithTurnResponse> {
    const game = await this.gameDataService.get(gameId);
    if (game.state !== GameState.ROUND_ACTIVE) {
      throw new ValidationError("Round is not active.");
    }
    if (game.actionToUserId !== userId) {
      throw new ValidationError("Action is not to you.");
    }
    if (
      game.latestUpdateSets != null ||
      (game.lastValidUpdateSets != null &&
        game.lastValidUpdateSets.tilesAdded.length > 0)
    ) {
      return this.doneWithTurnFinalizeUpdateSets(userId, game);
    } else {
      return this.doneWithTurnPickUpTileOrPass(userId, game);
    }
  }

  async saveLatestUpdateSets(
    userId: number,
    gameId: number,
    updateSets: IUpdateSets
  ): Promise<IPlayerUpdatedSetsEvent> {
    const game = await this.gameDataService.get(gameId);
    if (game.state !== GameState.ROUND_ACTIVE) {
      throw new ValidationError("Round is not active.");
    }
    if (game.actionToUserId !== userId) {
      throw new ValidationError("Action is not to you.");
    }
    const orderedPlayers = this.getPlayersOrderedToStartWithUser(
      game.players,
      userId
    );
    const playerState = orderedPlayers[0];
    const userTileCounts = getSerializedTileCounts(
      playerState.tiles.filter(isNotNull)
    );
    const tilesAddedTileCounts = getSerializedTileCounts(updateSets.tilesAdded);
    const remainingTilesCounts = getSerializedTileCounts(
      updateSets.remainingTiles.filter(isNotNull)
    );
    const existingSetsTileCounts = getSerializedTileCounts(
      game.sets.flatMap((x) => (x == null ? [] : x))
    );
    const updatedSetsTileCounts = getSerializedTileCounts(
      updateSets.sets.flatMap((x) => (x == null ? [] : x))
    );
    const validUpdatedSets = Array.from(
      Object.keys(updatedSetsTileCounts)
    ).every(
      (x) =>
        updatedSetsTileCounts[x] ==
        existingSetsTileCounts[x] + tilesAddedTileCounts[x]
    );
    if (!validUpdatedSets) {
      throw new ValidationError(
        "Update sets: tiles in updated sets are not equal to existing sets plus tiles added."
      );
    }
    const validTilesAdded = Array.from(Object.keys(userTileCounts)).every(
      (x) => userTileCounts[x] >= tilesAddedTileCounts[x]
    );
    if (!validTilesAdded) {
      throw new ValidationError("Update sets: includes a tile not in hand.");
    }
    const validRemainingTiles = Array.from(Object.keys(userTileCounts)).every(
      (x) =>
        userTileCounts[x] === tilesAddedTileCounts[x] + remainingTilesCounts[x]
    );
    if (!validRemainingTiles) {
      throw new ValidationError("Update sets: remaining tiles is invalid.");
    }
    const groupedSets = this.getGroupedSets(updateSets.sets);
    const areAllGroupsValid = groupedSets.every((x) => isValidSet(x));
    const updates: IRummikubGameUpdateOptions = areAllGroupsValid
      ? {
          latestUpdateSets: null,
          lastValidUpdateSets: updateSets,
        }
      : { latestUpdateSets: updateSets };
    const updatedGame = await this.gameDataService.update(
      gameId,
      game.version,
      updates
    );
    return {
      version: updatedGame.version,
      updateSets: {
        sets: updateSets.sets,
        tilesAdded: updateSets.tilesAdded,
        remainingTiles: [],
      },
    };
  }

  async revertToLastValidUpdateSets(
    userId: number,
    gameId: number
  ): Promise<IUpdateSets> {
    const game = await this.gameDataService.get(gameId);
    if (game.state !== GameState.ROUND_ACTIVE) {
      throw new ValidationError("Round is not active.");
    }
    if (game.actionToUserId !== userId) {
      throw new ValidationError("Action is not to you.");
    }
    if (game.latestUpdateSets == null) {
      throw new ValidationError("Nothing to revert.");
    }
    await this.gameDataService.update(gameId, game.version, {
      latestUpdateSets: null,
    });
    if (game.lastValidUpdateSets == null) {
      const orderedPlayers = this.getPlayersOrderedToStartWithUser(
        game.players,
        userId
      );
      const playerState = orderedPlayers[0];
      return {
        sets: game.sets,
        tilesAdded: [],
        remainingTiles: playerState.tiles,
      };
    }
    return game.lastValidUpdateSets;
  }

  async rearrangeTiles(
    userId: number,
    gameId: number,
    tiles: (ITile | null)[]
  ): Promise<void> {
    const game = await this.gameDataService.get(gameId);
    if (game.state !== GameState.ROUND_ACTIVE) {
      throw new ValidationError("Round is not active.");
    }
    const player = game.players.find((x) => x.userId === userId);
    if (player == null) {
      throw new ValidationError("You are not a player in this game.");
    }
    if (
      game.actionToUserId == userId &&
      (game.latestUpdateSets != null || game.lastValidUpdateSets != null)
    ) {
      throw new ValidationError(
        "Cannot rearrange tiles while have update sets in progress."
      );
    }
    if (
      !areTileSetsEquivalent(
        tiles.filter(isNotNull),
        player.tiles.filter(isNotNull)
      )
    ) {
      throw new ValidationError(
        "Rearranged tiles are not equivalent to tiles in hand."
      );
    }
    player.tiles = tiles;
    await this.gameDataService.update(gameId, game.version, {
      players: game.players,
    });
  }

  async search(
    request: ISearchGamesRequest
  ): Promise<IPaginatedResponse<ISearchedGame>> {
    const result = await this.gameDataService.search(request);
    const userIds: number[] = [];
    result.data.forEach((game) => {
      game.players.forEach((player) => userIds.push(player.userId));
    });
    const users = await this.userDataService.getUsers(userIds);
    const userIdToDisplayName = _.fromPairs(
      users.map((u) => [u.userId, u.displayName])
    );
    return {
      data: result.data.map((x) => ({
        gameId: x.gameId,
        hostUserId: x.hostUserId,
        players: x.players.map((x) => ({
          userId: x.userId,
          displayName: userIdToDisplayName[x.userId],
        })),
        state: x.state,
        createdAt: x.createdAt.toISOString(),
        updatedAt: x.updatedAt.toISOString(),
      })),
      total: result.total,
    };
  }

  private async doneWithTurnFinalizeUpdateSets(
    userId: number,
    game: ISerializedRummikubGame
  ): Promise<IDoneWithTurnResponse> {
    const orderedPlayers = this.getPlayersOrderedToStartWithUser(
      game.players,
      userId
    );
    const playerState = orderedPlayers[0];
    if (game.latestUpdateSets != null) {
      throw new ValidationError(
        "Finalize update sets: latest state is invalid."
      );
    }
    if (game.lastValidUpdateSets == null) {
      throw new Error(
        "Finalize update sets: last valid update sets unexpectedly null."
      );
    }
    if (!playerState.hasPlayedInitialMeld) {
      if (
        !isOnlyAddingNewSets(
          this.getGroupedSets(game.sets),
          this.getGroupedSets(game.lastValidUpdateSets.sets)
        )
      ) {
        throw new ValidationError(
          `Finalize update sets: cannot modify existing sets on initial play`
        );
      }
      const score = getTilesScore(
        game.lastValidUpdateSets.tilesAdded.flatMap((x) => x)
      );
      if (score < 30) {
        throw new ValidationError(
          `Finalize update sets: sum of tiles in initial play must be at least 30 (is only ${score})`
        );
      }
      playerState.hasPlayedInitialMeld = true;
    }
    playerState.tiles = game.lastValidUpdateSets.remainingTiles;
    playerState.passedLastTurn = false;
    const lastAction: ILastAction = {
      userId,
      pickUpTile: false,
      pass: false,
    };
    const updates: IRummikubGameUpdateOptions = {
      sets: game.lastValidUpdateSets.sets,
      players: game.players,
      latestUpdateSets: null,
      lastValidUpdateSets: null,
    };
    if (playerState.tiles.filter(isNotNull).length == 0) {
      const completedRound = this.computePlayerScores(game.players);
      this.updateScoresWithWinner(completedRound, userId);
      const roundFinishedEvent = await this.finalizeRound(
        game,
        lastAction,
        userId,
        completedRound,
        updates
      );
      return { roundFinishedEvent };
    } else {
      const updatedGame = await this.gameDataService.update(
        game.gameId,
        game.version,
        {
          actionToUserId: orderedPlayers[1].userId,
          ...updates,
        }
      );
      return {
        actionToNextPlayerEvent: {
          version: updatedGame.version,
          actionToUserId: orderedPlayers[1].userId,
          lastAction,
        },
      };
    }
  }

  private async doneWithTurnPickUpTileOrPass(
    userId: number,
    game: ISerializedRummikubGame
  ): Promise<IDoneWithTurnResponse> {
    const orderedPlayers = this.getPlayersOrderedToStartWithUser(
      game.players,
      userId
    );
    const playerState = orderedPlayers[0];
    if (game.lastValidUpdateSets != null) {
      game.sets = game.lastValidUpdateSets.sets;
      playerState.tiles = game.lastValidUpdateSets.remainingTiles;
    }
    const lastAction: ILastAction = {
      userId,
      pickUpTile: false,
      pass: false,
    };
    let pickedUpTileData: IPickedUpTileData | undefined;
    if (game.tilePool.length == 0) {
      lastAction.pass = true;
      playerState.passedLastTurn = true;
      const roundOver = orderedPlayers.every((x) => x.passedLastTurn);
      if (roundOver) {
        const completedRound = this.computePlayerScores(game.players);
        const winnerUserId =
          this.determineWinnerAfterEveryonePassed(completedRound);
        this.updateScoresWithWinner(completedRound, winnerUserId);
        const roundFinishedEvent = await this.finalizeRound(
          game,
          lastAction,
          winnerUserId,
          completedRound,
          {
            players: game.players,
            lastValidUpdateSets: null,
          }
        );
        return { roundFinishedEvent };
      }
    } else {
      const pickedUpTile = game.tilePool.pop();
      if (pickedUpTile == null) {
        throw new Error("Pickup tile: unexpected empty tile pool");
      }
      let firstEmptyIndex = playerState.tiles.findIndex((x) => x == null);
      if (firstEmptyIndex == -1) {
        firstEmptyIndex = playerState.tiles.length;
        playerState.tiles.push(pickedUpTile);
      } else {
        playerState.tiles[firstEmptyIndex] = pickedUpTile;
      }
      pickedUpTileData = {
        tile: pickedUpTile,
        playerTileIndex: firstEmptyIndex,
        tilePoolCount: game.tilePool.length,
      };
      lastAction.pickUpTile = true;
      lastAction.tilePoolCount = game.tilePool.length;
      playerState.passedLastTurn = false;
    }
    const updatedGame = await this.gameDataService.update(
      game.gameId,
      game.version,
      {
        actionToUserId: orderedPlayers[1].userId,
        sets: game.sets,
        players: game.players,
        tilePool: game.tilePool,
        lastValidUpdateSets: null,
      }
    );
    return {
      pickedUpTileData,
      actionToNextPlayerEvent: {
        version: updatedGame.version,
        actionToUserId: orderedPlayers[1].userId,
        lastAction,
      },
    };
  }

  private createPlayer(userId: number): IRummikubPlayer {
    return {
      userId,
      hasPlayedInitialMeld: false,
      passedLastTurn: false,
      tiles: [],
    };
  }

  private getPlayersOrderedToStartWithUser(
    playerStates: IRummikubPlayer[],
    userId: number
  ): IRummikubPlayer[] {
    const reorderedPlayers = playerStates.slice();
    while (reorderedPlayers[0].userId !== userId) {
      const playerState = reorderedPlayers.shift();
      if (playerState != null) {
        reorderedPlayers.push(playerState);
      }
    }
    return reorderedPlayers;
  }

  private computePlayerScores(
    players: IRummikubPlayer[]
  ): IRummikubRoundPlayerScore[] {
    return players.map((playerState) => {
      return {
        userId: playerState.userId,
        score: getTilesScore(playerState.tiles.filter(isNotNull)),
      };
    });
  }

  private determineWinnerAfterEveryonePassed(
    scores: IRummikubRoundPlayerScore[]
  ): number {
    let lowestScore = scores[0];
    for (let i = 1; i < scores.length; i++) {
      if (scores[i].score < lowestScore.score) {
        lowestScore = scores[i];
      }
    }
    lowestScore.score = 0;
    return lowestScore.userId;
  }

  private updateScoresWithWinner(
    completedRound: IRummikubRoundPlayerScore[],
    userId: number
  ): void {
    const total = completedRound.reduce((sum, last) => sum + last.score, 0);
    completedRound.forEach((x) => {
      if (x.userId == userId) {
        x.score = total;
      } else {
        x.score *= -1;
      }
    });
  }

  private async finalizeRound(
    game: ISerializedRummikubGame,
    lastAction: ILastAction,
    winnerUserId: number,
    completedRound: IRummikubRoundPlayerScore[],
    otherUpdates: IRummikubGameUpdateOptions
  ): Promise<IRoundFinishedEvent> {
    const roundScore = this.buildRoundScore(completedRound);
    const updatedCompletedRounds = game.completedRounds.concat([
      completedRound,
    ]);
    const isGameComplete = this.isGameComplete(
      updatedCompletedRounds,
      game.options.playTo
    );
    const updatedGameState = isGameComplete
      ? GameState.COMPLETE
      : GameState.ROUND_COMPLETE;
    const updatedGame = await this.gameDataService.update(
      game.gameId,
      game.version,
      {
        ...otherUpdates,
        actionToUserId: winnerUserId,
        state: updatedGameState,
        completedRounds: updatedCompletedRounds,
      }
    );
    return {
      version: updatedGame.version,
      lastAction,
      winnerUserId,
      playerStates: await this.loadPlayerStates(updatedGame),
      roundScore,
      updatedGameState,
    };
  }

  private async loadFullGame(
    game: ISerializedRummikubGame,
    userId: number
  ): Promise<IGame> {
    const latestUpdateSets = game.latestUpdateSets;
    const lastValidUpdateSets = game.lastValidUpdateSets;
    if (userId != game.actionToUserId) {
      if (latestUpdateSets != null) {
        latestUpdateSets.remainingTiles = [];
      }
      if (lastValidUpdateSets != null) {
        lastValidUpdateSets.remainingTiles = [];
      }
    }
    return {
      gameId: game.gameId,
      hostUserId: game.hostUserId,
      options: game.options,
      state: game.state,
      actionToUserId: game.actionToUserId,
      latestUpdateSets,
      lastValidUpdateSets,
      sets: game.sets,
      tilePoolCount: game.tilePool.length,
      playerStates: await this.loadPlayerStates(game, userId),
      roundScores: game.completedRounds.map(this.buildRoundScore),
      version: game.version,
      createdAt: game.createdAt.toISOString(),
      updatedAt: game.updatedAt.toISOString(),
    };
  }

  private async loadPlayerStates(
    game: ISerializedRummikubGame,
    userId: number | null = null
  ): Promise<IPlayerState[]> {
    const users = await this.userDataService.getUsers(
      game.players.map((x) => x.userId)
    );
    const userIdToDisplayName = _.fromPairs(
      users.map((u) => [u.userId, u.displayName])
    );
    return game.players.map((p) => {
      const out: IPlayerState = {
        userId: p.userId,
        displayName: userIdToDisplayName[p.userId],
        hasPlayedInitialMeld: p.hasPlayedInitialMeld,
        passedLastTurn: p.passedLastTurn,
        numberOfTiles: p.tiles.filter(isNotNull).length,
        tiles: [],
      };
      if (
        game.state === GameState.ROUND_COMPLETE ||
        game.state === GameState.COMPLETE ||
        game.state === GameState.ABORTED ||
        (game.state === GameState.ROUND_ACTIVE && userId === p.userId)
      ) {
        out.tiles = p.tiles;
      }
      return out;
    });
  }

  private buildRoundScore(
    completedRounds: IRummikubRoundPlayerScore[]
  ): IRoundScore {
    const out: IRoundScore = {};
    completedRounds.forEach((x) => {
      out[x.userId] = { score: x.score };
    });
    return out;
  }

  private isGameComplete(
    completedRounds: IRummikubRoundPlayerScore[][],
    playTo: number
  ): boolean {
    const playerTotals: Record<number, number> = {};
    completedRounds.forEach((completedRound) => {
      completedRound.forEach((playerScore) => {
        if (playerTotals[playerScore.userId] == null) {
          playerTotals[playerScore.userId] = 0;
        }
        playerTotals[playerScore.userId] += playerScore.score;
      });
    });
    return Object.values(playerTotals).some(
      (playerTotal) => playerTotal >= playTo
    );
  }

  private getGroupedSets(sets: INullableTile[]): ITile[][] {
    const result: ITile[][] = [];
    let currentGroup: ITile[] = [];
    for (let i = 0; i < sets.length; i++) {
      const currentTile = sets[i];
      if (currentTile == null) {
        if (currentGroup.length > 0) {
          result.push(currentGroup);
          currentGroup = [];
        }
      } else {
        currentGroup.push(currentTile);
      }
      if ((i + 1) % TOTAL_COLUMNS == 0 && currentGroup.length > 0) {
        result.push(currentGroup);
        currentGroup = [];
      }
    }
    if (currentGroup.length > 0) {
      result.push(currentGroup);
    }
    return result;
  }
}
