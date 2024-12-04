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
  IGameActionRequest,
  IGameActionResponse,
  ISearchGamesRequest,
  ISearchedGame,
  IActionToNextPlayerEvent,
  IRoundFinishedEvent,
  IUpdateSets,
  ILastAction,
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
import { ITile } from "src/shared/dtos/rummikub/tile";
import {
  areTileSetsEquivalent,
  deserializeTile,
  getSerializedTileCounts,
  standardTiles,
} from "./tile_helpers";
import { isValidSet } from "./set_helpers";
import { getTilesScore } from "./score_helpers";

interface IPlayInitialMeldResult {
  actionToNextPlayerEvent: IActionToNextPlayerEvent;
}

interface IPlayUpdateSetsResult {
  actionToNextPlayerEvent?: IActionToNextPlayerEvent;
  roundFinishedEvent?: IRoundFinishedEvent;
}

interface IPlayPickupTileOrPassResult {
  actionToNextPlayerEvent?: IActionToNextPlayerEvent;
  roundFinishedEvent?: IRoundFinishedEvent;
}

export interface IRummikubGameService {
  abort: (userId: number, gameId: number) => Promise<IGame>;
  abortUnfinishedGames: () => Promise<number>;
  create: (userId: number, options: IGameOptions) => Promise<IGame>;
  get: (userId: number | null, gameId: number) => Promise<IGame>;
  join: (userId: number, gameId: number) => Promise<IGame>;
  startRound: (userId: number, gameId: number) => Promise<IGame>;
  play: (
    userId: number,
    gameId: number,
    action: IGameActionRequest
  ) => Promise<IGameActionResponse>;
  rearrangeTiles: (
    userId: number,
    gameId: number,
    tiles: ITile[]
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

  async abortUnfinishedGames(): Promise<number> {
    return await this.gameDataService.abortUnfinishedGames(24);
  }

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
    const tilePool = standardTiles();
    const updatedPlayers: IRummikubPlayer[] = game.players.map((x) =>
      this.createPlayer(x.userId)
    );
    for (let i = 0; i < 14; i++) {
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

  async play(
    userId: number,
    gameId: number,
    action: IGameActionRequest
  ): Promise<IGameActionResponse> {
    const game = await this.gameDataService.get(gameId);
    if (game.actionToUserId !== userId) {
      throw new ValidationError("Action is not to you.");
    }
    const result: IGameActionResponse = {};
    if (action.initialMeld != null) {
      const initialMeldResult = await this.playInitialMeld(
        userId,
        action.initialMeld,
        game
      );
      result.actionToNextPlayerEvent =
        initialMeldResult.actionToNextPlayerEvent;
    } else if (action.updateSets != null) {
      const manipulateSetsResult = await this.playUpdateSets(
        userId,
        action.updateSets,
        game
      );
      result.actionToNextPlayerEvent =
        manipulateSetsResult.actionToNextPlayerEvent;
      result.roundFinishedEvent = manipulateSetsResult.roundFinishedEvent;
    } else {
      if (!action.pickUpTileOrPass) {
        throw new ValidationError(
          "Pick up tile or pass is required to be true if not playing initial meld / updating sets."
        );
      }
      const pickUpTileResult = await this.playPickUpTileOrPass(userId, game);
      result.actionToNextPlayerEvent = pickUpTileResult.actionToNextPlayerEvent;
    }
    return result;
  }

  async rearrangeTiles(
    userId: number,
    gameId: number,
    tiles: ITile[]
  ): Promise<void> {
    const game = await this.gameDataService.get(gameId);
    const player = game.players.find((x) => x.userId === userId);
    if (player == null) {
      throw new ValidationError("You are not a player in this game.");
    }
    if (!areTileSetsEquivalent(tiles, player.tiles)) {
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

  private async playInitialMeld(
    userId: number,
    initialMeld: ITile[][],
    game: ISerializedRummikubGame
  ): Promise<IPlayInitialMeldResult> {
    const orderedPlayers = this.getPlayersOrderedToStartWithUser(
      game.players,
      userId
    );
    const playerState = orderedPlayers[0];
    const userTileCounts = getSerializedTileCounts(playerState.tiles);
    const initialMeldTileCounts = getSerializedTileCounts(
      initialMeld.flatMap((x) => x)
    );
    const valid = Array.from(Object.keys(initialMeldTileCounts)).every(
      (x) => userTileCounts[x] >= initialMeldTileCounts[x]
    );
    if (!valid) {
      throw new ValidationError("Initial meld: includes a tile not in hand.");
    }
    const areAllSetsValid = initialMeld.every((s) => isValidSet(s));
    if (!areAllSetsValid) {
      throw new ValidationError("Initial meld: a set is invalid.");
    }
    const score = getTilesScore(initialMeld.flatMap((x) => x));
    if (score < 30) {
      throw new ValidationError(
        "Initial meld: tile score must be at least 30."
      );
    }
    const remainingTiles: ITile[] = [];
    Array.from(Object.keys(userTileCounts)).forEach((x) => {
      const remaining = userTileCounts[x] - initialMeldTileCounts[x];
      for (let i = 0; i < remaining; i++) {
        remainingTiles.push(deserializeTile(Number(x)));
      }
    });
    playerState.tiles = remainingTiles;
    playerState.hasPlayedInitialMeld = true;
    playerState.passedLastTurn = false;
    await this.gameDataService.update(game.gameId, game.version, {
      actionToUserId: orderedPlayers[1].userId,
      sets: game.sets.concat(initialMeld),
      players: game.players,
    });
    return {
      actionToNextPlayerEvent: {
        actionToUserId: orderedPlayers[1].userId,
        lastAction: {
          userId: playerState.userId,
          initialMeld,
        },
      },
    };
  }

  private async playUpdateSets(
    userId: number,
    updateSets: IUpdateSets,
    game: ISerializedRummikubGame
  ): Promise<IPlayUpdateSetsResult> {
    const orderedPlayers = this.getPlayersOrderedToStartWithUser(
      game.players,
      userId
    );
    const playerState = orderedPlayers[0];
    if (!playerState.hasPlayedInitialMeld) {
      throw new ValidationError("Update sets: must first play initial meld.");
    }
    const userTileCounts = getSerializedTileCounts(playerState.tiles);
    const tilesAddedTileCounts = getSerializedTileCounts(updateSets.tilesAdded);
    const validTilesAdded = Array.from(Object.keys(tilesAddedTileCounts)).every(
      (x) => userTileCounts[x] >= tilesAddedTileCounts[x]
    );
    if (!validTilesAdded) {
      throw new ValidationError("Update sets: includes a tile not in hand.");
    }
    const existingSetsTileCounts = getSerializedTileCounts(
      game.sets.flatMap((x) => x)
    );
    const updatedSetsTileCounts = getSerializedTileCounts(
      updateSets.sets.flatMap((x) => x)
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
    const areAllSetsValid = updateSets.sets.every((s) => isValidSet(s));
    if (!areAllSetsValid) {
      throw new ValidationError("Update sets: a set is invalid.");
    }
    const remainingTiles: ITile[] = [];
    Array.from(Object.keys(userTileCounts)).forEach((x) => {
      const remaining = userTileCounts[x] - tilesAddedTileCounts[x];
      for (let i = 0; i < remaining; i++) {
        remainingTiles.push(deserializeTile(Number(x)));
      }
    });
    playerState.tiles = remainingTiles;
    playerState.passedLastTurn = false;
    const lastAction: ILastAction = {
      userId,
      updateSets,
    };
    if (playerState.tiles.length == 0) {
      const completedRound = this.computePlayerScores(game.players);
      this.updateScoresWithWinner(completedRound, userId);
      const roundFinishedEvent = await this.finalizeRound(
        game,
        lastAction,
        completedRound,
        {
          actionToUserId: userId,
          sets: updateSets.sets,
          players: game.players,
        }
      );
      return { roundFinishedEvent };
    } else {
      await this.gameDataService.update(game.gameId, game.version, {
        actionToUserId: orderedPlayers[1].userId,
        sets: updateSets.sets,
        players: game.players,
      });
      return {
        actionToNextPlayerEvent: {
          actionToUserId: orderedPlayers[1].userId,
          lastAction,
        },
      };
    }
  }

  private async playPickUpTileOrPass(
    userId: number,
    game: ISerializedRummikubGame
  ): Promise<IPlayPickupTileOrPassResult> {
    const orderedPlayers = this.getPlayersOrderedToStartWithUser(
      game.players,
      userId
    );
    const playerState = orderedPlayers[0];
    const lastAction: ILastAction = {
      userId,
      pickUpTileOrPass: true,
    };
    if (game.tilePool.length == 0) {
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
          completedRound,
          {
            actionToUserId: winnerUserId,
            players: game.players,
          }
        );
        return { roundFinishedEvent };
      }
    } else {
      const pickedUpTile = game.tilePool.pop();
      if (pickedUpTile == null) {
        throw new Error("Pickup tile: unexpected empty tile pool");
      }
      playerState.tiles.push(pickedUpTile);
      playerState.passedLastTurn = false;
    }
    await this.gameDataService.update(game.gameId, game.version, {
      actionToUserId: orderedPlayers[1].userId,
      players: game.players,
      tilePool: game.tilePool,
    });
    return {
      actionToNextPlayerEvent: {
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
        score: getTilesScore(playerState.tiles),
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
        state: updatedGameState,
        completedRounds: updatedCompletedRounds,
      }
    );
    return {
      lastAction,
      playerStates: await this.loadPlayerStates(updatedGame),
      roundScore,
      updatedGameState,
    };
  }

  private async loadFullGame(
    game: ISerializedRummikubGame,
    userId: number
  ): Promise<IGame> {
    return {
      gameId: game.gameId,
      hostUserId: game.hostUserId,
      options: game.options,
      state: game.state,
      actionToUserId: game.actionToUserId,
      sets: game.sets,
      tilePoolCount: game.tilePool.length,
      playerStates: await this.loadPlayerStates(game, userId),
      roundScores: game.completedRounds.map(this.buildRoundScore),
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
        numberOfTiles: p.tiles.length,
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
      out[x.userId] = x.score;
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
}
