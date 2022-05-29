import _ from "lodash";
import { ValidationError } from "../shared/exceptions";
import { areCardHandsEquivalent, standardDeck } from "../shared/card_helpers";
import { IPaginatedResponse } from "../../shared/dtos/search";
import {
  IUserDataService,
  UserDataService,
} from "../shared/data/user_data_service";
import { ICard } from "../../shared/dtos/card";
import {
  GameState,
  IDiscardEvent,
  IDiscardInput,
  IDiscardState,
  IGame,
  IGameOptions,
  IMeldEvent,
  IMeldInput,
  IPickupInput,
  IPickupOutput,
  IPlayerState,
  IRoundScore,
  ISearchedGame,
  ISearchGamesRequest,
} from "../../shared/dtos/rummy/game";
import {
  RummyGameDataService,
  IRummyGameDataService,
} from "./data/rummy_game_data_service";
import {
  IRummyPlayer,
  IRummyPlayerScore,
  ISerializedRummyGame,
} from "../../database/models/rummy_game";
import { performPickup } from "./pickup_helper";
import { performDiscard } from "./discard_helper";
import { performMeld } from "./meld_helper";
import { completeRound } from "./complete_round_helper";

export interface IRummyGameService {
  abort: (userId: number, gameId: number) => Promise<IGame>;
  abortUnfinishedGames: () => Promise<number>;
  create: (userId: number, options: IGameOptions) => Promise<IGame>;
  get: (userId: number | null, gameId: number) => Promise<IGame>;
  join: (userId: number, gameId: number) => Promise<IGame>;
  startRound: (userId: number, gameId: number) => Promise<IGame>;
  pickup: (
    userId: number,
    gameId: number,
    input: IPickupInput
  ) => Promise<IPickupOutput>;
  meld: (
    userId: number,
    gameId: number,
    input: IMeldInput
  ) => Promise<IMeldEvent>;
  discard: (
    userId: number,
    gameId: number,
    input: IDiscardInput
  ) => Promise<IDiscardEvent>;
  rearrangeCards: (
    userId: number,
    gameId: number,
    cards: ICard[]
  ) => Promise<void>;
  search: (
    request: ISearchGamesRequest
  ) => Promise<IPaginatedResponse<ISearchedGame>>;
}

export const CARDS_DEALT_PER_ROUND = 7;

export class RummyGameService implements IRummyGameService {
  constructor(
    private readonly gameDataService: IRummyGameDataService = new RummyGameDataService(),
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
      throw new ValidationError("Cannot join in-progress or completed game");
    }
    if (game.players.some((x) => x.userId === userId)) {
      throw new ValidationError("Already joined game");
    }
    game = await this.gameDataService.update(game.gameId, game.version, {
      players: game.players.concat([{ userId, cardsInHand: [], melds: [] }]),
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
    const deck = standardDeck();
    const roundNumber = game.completedRounds.length + 1;
    const firstToActIndex = (roundNumber - 1) % game.players.length;
    const updatedPlayers: IRummyPlayer[] = game.players.map(({ userId }) => {
      const player: IRummyPlayer = {
        userId,
        cardsInHand: [],
        melds: [],
      };
      for (let i = 0; i < CARDS_DEALT_PER_ROUND; i++) {
        const nextCard = deck.pop();
        if (nextCard == null) {
          throw new Error("Unexpected empty deck (dealing to players)");
        }
        player.cardsInHand.push(nextCard);
      }
      return player;
    });
    const discardState: IDiscardState = { piles: [] };
    for (
      let pileIndex = 0;
      pileIndex < game.options.numberOfDiscardPiles;
      pileIndex += 1
    ) {
      const nextCard = deck.pop();
      if (nextCard == null) {
        throw new Error("Unexpected empty deck (initializing discard piles)");
      }
      discardState.piles.push([nextCard]);
    }
    game = await this.gameDataService.update(gameId, game.version, {
      players: updatedPlayers,
      state: GameState.PICKUP,
      cardsInDeck: deck,
      discardState,
      actionToUserId: game.players[firstToActIndex].userId,
    });
    return await this.loadFullGame(userId, game);
  }

  async pickup(
    userId: number,
    gameId: number,
    input: IPickupInput
  ): Promise<IPickupOutput> {
    const game = await this.gameDataService.get(gameId);
    if (game.actionToUserId !== userId) {
      throw new ValidationError("Action is not to you");
    }
    if (game.state !== GameState.PICKUP) {
      throw new ValidationError("Invalid state to pickup");
    }
    const player = game.players.find((x) => x.userId === userId);
    if (player == null) {
      throw new Error("Player unexpectedly null");
    }
    const errorMessage = performPickup(
      input,
      game.cardsInDeck,
      game.discardState,
      player.cardsInHand
    );
    if (errorMessage != null) {
      throw new ValidationError(errorMessage);
    }
    if (input.deepPickupMeld != null) {
      const errorMessage = performMeld(
        input.deepPickupMeld,
        userId,
        player.cardsInHand,
        game.melds
      );
      if (errorMessage != null) {
        throw new ValidationError(errorMessage);
      }
    }
    const updatedState = GameState.MELD_OR_DISCARD;
    await this.gameDataService.update(game.gameId, game.version, {
      cardsInDeck: game.cardsInDeck,
      discardState: game.discardState,
      melds: game.melds,
      players: game.players,
      state: updatedState,
    });
    const result: IPickupOutput = {
      event: {
        userId,
        input,
        updatedGameState: updatedState,
        actionToUserId: game.actionToUserId,
      },
    };
    if (input.pickup == null) {
      result.cardPickedUpFromDeck = _.last(player.cardsInHand);
    }
    return result;
  }

  async meld(
    userId: number,
    gameId: number,
    input: IMeldInput
  ): Promise<IMeldEvent> {
    const game = await this.gameDataService.get(gameId);
    if (game.actionToUserId !== userId) {
      throw new ValidationError("Action is not to you");
    }
    if (game.state !== GameState.MELD_OR_DISCARD) {
      throw new ValidationError("Invalid state to meld");
    }
    const player = game.players.find((x) => x.userId === userId);
    if (player == null) {
      throw new Error("Player unexpectedly null");
    }
    const errorMessage = performMeld(
      input,
      userId,
      player.cardsInHand,
      game.melds
    );
    if (errorMessage != null) {
      throw new ValidationError(errorMessage);
    }
    if (player.cardsInHand.length == 0) {
      completeRound(game);
    }
    await this.gameDataService.update(game.gameId, game.version, {
      melds: game.melds,
      players: game.players,
      state: game.state,
      completedRounds: game.completedRounds,
    });
    const result: IMeldEvent = {
      userId,
      input,
      updatedGameState: game.state,
      actionToUserId: game.actionToUserId,
    };
    if ([GameState.ROUND_COMPLETE, GameState.COMPLETE].includes(game.state)) {
      result.roundScore = this.buildRoundScore(
        _.last(game.completedRounds) as IRummyPlayerScore[]
      );
    }
    return result;
  }

  async discard(
    userId: number,
    gameId: number,
    input: IDiscardInput
  ): Promise<IDiscardEvent> {
    const game = await this.gameDataService.get(gameId);
    if (game.actionToUserId !== userId) {
      throw new ValidationError("Action is not to you.");
    }
    if (game.state !== GameState.MELD_OR_DISCARD) {
      throw new ValidationError("Invalid state to pickup.");
    }
    const orderedPlayers = this.getPlayersOrderedToStartWithUser(
      game.players,
      userId
    );
    const player = orderedPlayers[0];
    const errorMessage = performDiscard(
      input,
      player.cardsInHand,
      game.discardState
    );
    if (errorMessage != null) {
      throw new ValidationError(errorMessage);
    }
    if (player.cardsInHand.length == 0) {
      completeRound(game);
    }
    const updatedActionToUserId = orderedPlayers[1].userId;
    await this.gameDataService.update(game.gameId, game.version, {
      players: game.players,
      state: game.state,
      discardState: game.discardState,
      actionToUserId: updatedActionToUserId,
      completedRounds: game.completedRounds,
    });
    const result: IDiscardEvent = {
      userId,
      input,
      updatedGameState: game.state,
      actionToUserId: updatedActionToUserId,
    };
    if ([GameState.ROUND_COMPLETE, GameState.COMPLETE].includes(game.state)) {
      result.roundScore = this.buildRoundScore(
        _.last(game.completedRounds) as IRummyPlayerScore[]
      );
    }
    return result;
  }

  async rearrangeCards(
    userId: number,
    gameId: number,
    cards: ICard[]
  ): Promise<void> {
    const game = await this.gameDataService.get(gameId);
    const player = game.players.find((x) => x.userId === userId);
    if (player == null) {
      throw new ValidationError("You are not a player in this game.");
    }
    if (!areCardHandsEquivalent(cards, player.cardsInHand)) {
      throw new ValidationError(
        "Rearranged cards are not equivalent to cards in hand."
      );
    }
    player.cardsInHand = cards;
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

  private getNextPlayerUserId(players: IRummyPlayer[], userId: number): number {
    const orderedPlayers = this.getPlayersOrderedToStartWithUser(
      players,
      userId
    );
    return orderedPlayers[1].userId;
  }

  private getPlayersOrderedToStartWithUser(
    playerStates: IRummyPlayer[],
    userId: number
  ): IRummyPlayer[] {
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
    game: ISerializedRummyGame
  ): Promise<IGame> {
    return {
      gameId: game.gameId,
      hostUserId: game.hostUserId,
      options: game.options,
      state: game.state,
      actionToUserId: game.actionToUserId,
      playerStates: await this.loadPlayerStates(userId, game),
      cardsInDeck: game.cardsInDeck,
      discardState: game.discardState,
      roundScores: game.completedRounds.map(this.buildRoundScore),
      melds: game.melds,
      createdAt: game.createdAt.toISOString(),
      updatedAt: game.updatedAt.toISOString(),
    };
  }

  private async loadPlayerStates(
    userId: number,
    game: ISerializedRummyGame
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
        numberOfCards: 0,
        cardsInHand: [],
      };
      if (
        game.state === GameState.PICKUP ||
        game.state === GameState.MELD_OR_DISCARD
      ) {
        out.numberOfCards = p.cardsInHand.length;
        if (userId === p.userId) {
          out.cardsInHand = p.cardsInHand;
        }
      }
      return out;
    });
  }

  private buildRoundScore(completedRounds: IRummyPlayerScore[]): IRoundScore {
    const out: IRoundScore = {};
    completedRounds.forEach((x) => {
      out[x.userId] = x.score;
    });
    return out;
  }
}
