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
  IGame,
  IGameOptions,
  IPickupEvent,
  IPickupInput,
  IPlayerState,
  IRoundScore,
  ISearchedGame,
  ISearchGamesRequest,
} from "../../shared/dtos/double_rummy/game";
import {
  DoubleRummyGameDataService,
  IDoubleRummyGameDataService,
} from "./data/double_rummy_game_data_service";
import {
  IDoubleRummyPlayer,
  IDoubleRummyPlayerScore,
  ISerializedDoubleRummyGame,
} from "../../database/models/double_rummy_game";
import { validatePickup } from "./pickup_validator";

export interface IDoubleRummyGameService {
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
  ) => Promise<IPickupEvent>;
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

export class DoubleRummyGameService implements IDoubleRummyGameService {
  constructor(
    private readonly gameDataService: IDoubleRummyGameDataService = new DoubleRummyGameDataService(),
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
    const updatedPlayers: IDoubleRummyPlayer[] = game.players.map(
      ({ userId }) => {
        const player: IDoubleRummyPlayer = {
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
      }
    );
    game = await this.gameDataService.update(gameId, game.version, {
      players: updatedPlayers,
      state: GameState.PICKUP,
      cardsInDeck: deck,
      discardPile: {
        A: [],
        B: [],
        mustDiscardToA: false,
        mustDiscardToB: false,
      },
      actionToUserId: game.players[firstToActIndex].userId,
    });
    return await this.loadFullGame(userId, game);
  }

  async pickup(
    userId: number,
    gameId: number,
    input: IPickupInput
  ): Promise<IPickupEvent> {
    const game = await this.gameDataService.get(gameId);
    if (game.actionToUserId !== userId) {
      throw new ValidationError("Action is not to you.");
    }
    if (game.state !== GameState.PICKUP) {
      throw new ValidationError("Invalid state to pickup.");
    }
    const errorMessage = validatePickup(input, game.discardPile, []); // TODO pass in player cards
    if (errorMessage != null) {
      throw new ValidationError(errorMessage);
    }
    // TODO validate meld
    // TODO update player hand + meld
    const updatedPlayers = game.players;
    const updatedState = GameState.DISCARD;
    await this.gameDataService.update(game.gameId, game.version, {
      players: updatedPlayers,
      state: updatedState,
    });
    const result: IPickupEvent = {
      pickup: { userId, pickup: input.pickup }, // TODO set meld
      updatedGameState: updatedState,
      actionToUserId: game.actionToUserId,
    };
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
    if (game.state !== GameState.DISCARD) {
      throw new ValidationError("Invalid state to pickup.");
    }
    // TODO validate discard
    // TODO update players / discard pile + if must discard to specific pile
    const updatedPlayers = game.players;
    const updatedState = GameState.PICKUP; // TODO could be round complete
    const updatedDiscardPile = game.discardPile;
    const updatedActionToUserId = this.getNextPlayerUserId(
      game.players,
      userId
    );
    await this.gameDataService.update(game.gameId, game.version, {
      players: updatedPlayers,
      state: updatedState,
      discardPile: updatedDiscardPile,
      actionToUserId: updatedActionToUserId,
    });
    const result: IDiscardEvent = {
      discard: { userId, discard: input.discard, melds: [] }, // TODO melds
      updatedGameState: updatedState,
      actionToUserId: updatedActionToUserId,
    };
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

  private getNextPlayerUserId(
    players: IDoubleRummyPlayer[],
    userId: number
  ): number {
    const orderedPlayers = this.getPlayersOrderedToStartWithUser(
      players,
      userId
    );
    return orderedPlayers[1].userId;
  }

  private getPlayersOrderedToStartWithUser(
    playerStates: IDoubleRummyPlayer[],
    userId: number
  ): IDoubleRummyPlayer[] {
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
    game: ISerializedDoubleRummyGame
  ): Promise<IGame> {
    return {
      gameId: game.gameId,
      hostUserId: game.hostUserId,
      options: game.options,
      state: game.state,
      actionToUserId: game.actionToUserId,
      playerStates: await this.loadPlayerStates(userId, game),
      cardsInDeck: game.cardsInDeck,
      discardPile: game.discardPile,
      roundScores: game.completedRounds.map(this.buildRoundScore),
      createdAt: game.createdAt.toISOString(),
      updatedAt: game.updatedAt.toISOString(),
    };
  }

  private async loadPlayerStates(
    userId: number,
    game: ISerializedDoubleRummyGame
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
        melds: p.melds,
      };
      if (game.state === GameState.PICKUP || game.state === GameState.DISCARD) {
        out.numberOfCards = p.cardsInHand.length;
        if (userId === p.userId) {
          out.cardsInHand = p.cardsInHand;
        }
      }
      return out;
    });
  }

  private buildRoundScore(
    completedRounds: IDoubleRummyPlayerScore[]
  ): IRoundScore {
    const out: IRoundScore = {};
    completedRounds.forEach((x) => {
      out[x.userId] = {
        score: x.score,
      };
    });
    return out;
  }

  private determineScores(
    players: IDoubleRummyPlayer[]
  ): IDoubleRummyPlayerScore[] {
    return players.map((player) => {
      return {
        userId: player.userId,
        score: 0, // TODO points for meld, minus points for cards in hand
      };
    });
  }
}
