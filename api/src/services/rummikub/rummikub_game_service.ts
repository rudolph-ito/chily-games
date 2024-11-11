import _ from "lodash";
import { valueOrDefault } from "../../shared/utilities/value_checker";
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
  ISetsUpdate,
  IUpdateSets,
} from "../../shared/dtos/rummikub/game";
import { ValidationError } from "../shared/exceptions";
import {
  IRummikubGameDataService,
  RummikubGameDataService,
} from "./data/rummikub_game_data_service";
import {
  areCardHandsEquivalent,
  areCardsEqual,
  standardDeckWithTwoJokers,
} from "../shared/card_helpers";
import shuffle from "knuth-shuffle-seeded";
import { IPaginatedResponse } from "../../shared/dtos/search";
import {
  IUserDataService,
  UserDataService,
} from "../shared/data/user_data_service";
import { ICard } from "../../shared/dtos/card";
import { ITile } from "src/shared/dtos/rummikub/tile";
import { areTilesEqual, areTileSetsEquivalent, deserializeTile, getSerializedTileCounts, standardTiles } from "./tile_helpers";
import { isValidSet } from "./set_helpers";

interface IPlayInitialMeldResult {
  actionToNextPlayerEvent: IActionToNextPlayerEvent;
}

interface IPlayUpdateSetsResult {
  actionToNextPlayerEvent?: IActionToNextPlayerEvent;
  roundFinishedEvent?: IRoundFinishedEvent;
}

interface IPlayPickupTileResult {
  actionToNextPlayerEvent: IActionToNextPlayerEvent;
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
    cards: ITile[]
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
    return await this.loadFullGame(userId, game);
  }

  async create(userId: number, options: IGameOptions): Promise<IGame> {
    // validate options
    const game = await this.gameDataService.create({
      hostUserId: userId,
      options,
    });
    return await this.loadFullGame(userId, game);
  }

  async get(userId: number, gameId: number): Promise<IGame> {
    const game = await this.gameDataService.get(gameId);
    return await this.loadFullGame(userId, game);
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
      players: game.players.concat([{ userId, tiles: [], hasPlayedInitialMeld: false }]),
    });
    return await this.loadFullGame(userId, game);
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
    const updatedPlayers: IRummikubPlayer[] = game.players.map((x) => {
      return {
        userId: x.userId,
        hasPlayedInitialMeld: false,
        tiles: [],
      }
    });
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
    return await this.loadFullGame(userId, game);
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
      result.actionToNextPlayerEvent = initialMeldResult.actionToNextPlayerEvent;
    }
    else if (action.updateSets != null) {
      const manipulateSetsResult = await this.playSetsUpdate(
        userId,
        action.updateSets,
        game
      );
      result.actionToNextPlayerEvent = manipulateSetsResult.actionToNextPlayerEvent;
      result.roundFinishedEvent = manipulateSetsResult.roundFinishedEvent;
    } else {
      if (!action.pickUpTile) {
        throw new ValidationError(
          "Pick up tile is required to be true if not playing initial meld / updating sets."
        );
      }
      const pickUpTileResult = await this.playPickUpTile(
        userId,
        game
      );
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
        "Rearranged cards are not equivalent to cards in hand."
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
    // TODO
  }


  private async playSetsUpdate(
    userId: number,
    updateSets: IUpdateSets,
    game: ISerializedRummikubGame
  ): Promise<IPlayUpdateSetsResult> {
    const orderedPlayers = this.getPlayersOrderedToStartWithUser(
      game.players,
      userId
    );
    const playerState = orderedPlayers[0];
    const userTileCounts = getSerializedTileCounts(playerState.tiles);
    const tilesAddedTileCounts = getSerializedTileCounts(updateSets.tilesAdded);
    const validTilesAdded = Array.from(Object.keys(tilesAddedTileCounts)).every(x => userTileCounts[x] >= tilesAddedTileCounts[x]);
    if (!validTilesAdded) {
      throw new ValidationError("Tiles added includes a tile not in user hand.");
    }
    const existingSetsTileCounts = getSerializedTileCounts(game.sets.flatMap(x => x));
    const updatedSetsTileCounts = getSerializedTileCounts(updateSets.sets.flatMap(x => x));
    const validUpdatedSets = Array.from(Object.keys(updatedSetsTileCounts)).every(x => updatedSetsTileCounts[x] == existingSetsTileCounts[x] + tilesAddedTileCounts[x]);
    if (!validUpdatedSets) {
      throw new ValidationError("Updated sets is not equal to existing sets plus the tiles added.");
    }
    const areAllSetsValid = updateSets.sets.every(s => isValidSet(s));
    if (!areAllSetsValid) {
      throw new ValidationError("One or more sets are invalid.");
    }
    const remainingTiles: ITile[] = [];
    Array.from(Object.keys(userTileCounts)).forEach(x => {
      const remaining = userTileCounts[x] - tilesAddedTileCounts[x];
      for (let i = 0; i < remaining; i++) {
        remainingTiles.push(deserializeTile(i));
      }
    })
    playerState.tiles = remainingTiles;
    if (playerState.tiles.length == 0) {
      // compute round score
      // determine if game over

      // const updatedGame = await this.gameDataService.update(
      //   game.gameId,
      //   game.version,
      //   {
      //     actionToUserId: winner.userId,
      //     state: updatedGameState,
      //     completedRounds: updatedCompletedRounds,
      //   }
      // );
      // return {
      //   roundFinishedEvent: {
      //     playerStates: await this.loadPlayerStates(userId, updatedGame),
      //     roundScore,
      //     updatedGameState,
      //   },
      // };
    } else {
      await this.gameDataService.update(
        game.gameId,
        game.version,
        {
          actionToUserId: orderedPlayers[1].userId,
          sets: updateSets.sets,
          players: game.players,
        }
      );
      return {
        actionToNextPlayerEvent: {
          actionToUserId: orderedPlayers[1].userId,
          lastAction: {
            userId: playerState.userId,
            updateSets,
          }
        }
      }
    }
  }

  private async playPickUpTile(
    userId: number,
    game: ISerializedRummikubGame
  ): Promise<IPlayPickupTileResult> {
    // TODO
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

  private async loadFullGame(
    userId: number,
    game: ISerializedRummikubGame
  ): Promise<IGame> {
    return {
      gameId: game.gameId,
      hostUserId: game.hostUserId,
      options: game.options,
      state: game.state,
      actionToUserId: game.actionToUserId,
      sets: game.sets,
      tilePoolCount: game.tilePool.length,
      playerStates: await this.loadPlayerStates(userId, game),
      roundScores: game.completedRounds.map(this.buildRoundScore),
      createdAt: game.createdAt.toISOString(),
      updatedAt: game.updatedAt.toISOString(),
    };
  }

  private async loadPlayerStates(
    userId: number,
    game: ISerializedRummikubGame
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
}
