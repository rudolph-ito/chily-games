import _ from "lodash";
import { ValidationError } from "../shared/exceptions";
import {
  areCardHandsEquivalent,
  areCardsEqual,
  standardDeckWithTwoJokers,
} from "../shared/card_helpers";
import { IPaginatedResponse } from "../../shared/dtos/search";
import {
  IUserDataService,
  UserDataService,
} from "../shared/data/user_data_service";
import { ICard } from "../../shared/dtos/card";
import {
  IOhHeckGameDataService,
  OhHeckGameDataService,
} from "./data/oh_heck_game_data_service";
import {
  GameState,
  IBetEvent,
  IGame,
  IGameOptions,
  IPlayerState,
  IRoundScore,
  ISearchedGame,
  ISearchGamesRequest,
  ITrickEvent,
} from "../../shared/dtos/oh_heck/game";
import {
  IOhHeckPlayer,
  IOhHeckRoundPlayerScore,
  ISerializedOhHeckGame,
} from "../../database/models/oh_heck_game";
import { validateBet } from "./bet_validator";
import { getNumberOfCardsToDeal } from "./round_helpers";
import { getTrickWinner, validatePlay } from "./trick_helper";

export interface IOhHeckGameService {
  abort: (userId: number, gameId: number) => Promise<IGame>;
  abortUnfinishedGames: () => Promise<number>;
  create: (userId: number, options: IGameOptions) => Promise<IGame>;
  get: (userId: number | null, gameId: number) => Promise<IGame>;
  join: (userId: number, gameId: number) => Promise<IGame>;
  startRound: (userId: number, gameId: number) => Promise<IGame>;
  placeBet: (userId: number, gameId: number, bet: number) => Promise<IBetEvent>;
  playCard: (
    userId: number,
    gameId: number,
    action: ICard
  ) => Promise<ITrickEvent>;
  rearrangeCards: (
    userId: number,
    gameId: number,
    cards: ICard[]
  ) => Promise<void>;
  search: (
    request: ISearchGamesRequest
  ) => Promise<IPaginatedResponse<ISearchedGame>>;
}

export class OhHeckGameService implements IOhHeckGameService {
  constructor(
    private readonly gameDataService: IOhHeckGameDataService = new OhHeckGameDataService(),
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
    // validate cannot have more than 7 players
    game = await this.gameDataService.update(game.gameId, game.version, {
      players: game.players.concat([
        { userId, cardsInHand: [], bet: null, tricksTaken: 0 },
      ]),
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
    const deck = standardDeckWithTwoJokers();
    const roundNumber = game.completedRounds.length + 1;
    const cardsToDeal = getNumberOfCardsToDeal(roundNumber);
    const firstToActIndex = (roundNumber - 1) % game.players.length;
    const updatedPlayers: IOhHeckPlayer[] = game.players.map(({ userId }) => {
      const player: IOhHeckPlayer = {
        userId,
        cardsInHand: [],
        bet: null,
        tricksTaken: 0,
      };
      for (let i = 0; i < cardsToDeal; i++) {
        const nextCard = deck.pop();
        if (nextCard == null) {
          throw new Error("Unexpected empty deck (dealing to players)");
        }
        player.cardsInHand.push(nextCard);
      }
      return player;
    });
    game = await this.gameDataService.update(gameId, game.version, {
      players: updatedPlayers,
      state: GameState.BETTING,
      currentTrick: [],
      actionToUserId: game.players[firstToActIndex].userId,
    });
    return await this.loadFullGame(userId, game);
  }

  async placeBet(
    userId: number,
    gameId: number,
    bet: number
  ): Promise<IBetEvent> {
    const game = await this.gameDataService.get(gameId);
    if (game.actionToUserId !== userId) {
      throw new ValidationError("Action is not to you.");
    }
    if (game.state !== GameState.BETTING) {
      throw new ValidationError("Invalid state to place bet.");
    }
    const errorMessage = validateBet(game.players, bet);
    if (errorMessage != null) {
      throw new ValidationError(errorMessage);
    }
    const updatedPlayers = game.players.map((player) => {
      if (player.userId === userId) {
        return { ...player, bet };
      }
      return player;
    });
    const allBetsPlaced =
      updatedPlayers.filter((player) => player.bet == null).length === 0;
    const updatedState = allBetsPlaced
      ? GameState.TRICK_ACTIVE
      : GameState.BETTING;
    const updatedActionToUserId = this.getNextPlayerUserId(
      game.players,
      userId
    );
    await this.gameDataService.update(game.gameId, game.version, {
      players: updatedPlayers,
      state: updatedState,
      actionToUserId: updatedActionToUserId,
    });
    const result: IBetEvent = {
      betPlaced: { userId, bet },
      updatedGameState: updatedState,
      actionToUserId: updatedActionToUserId,
    };
    return result;
  }

  async playCard(
    userId: number,
    gameId: number,
    card: ICard
  ): Promise<ITrickEvent> {
    const game = await this.gameDataService.get(gameId);
    if (game.actionToUserId !== userId) {
      throw new ValidationError("Action is not to you.");
    }
    if (
      game.state !== GameState.TRICK_ACTIVE &&
      game.state !== GameState.TRICK_COMPLETE
    ) {
      throw new ValidationError("Invalid state to play card.");
    }
    const orderedPlayers = this.getPlayersOrderedToStartWithUser(
      game.players,
      userId
    );
    const player = orderedPlayers[0];
    const errorMessage = validatePlay(
      player.cardsInHand,
      game.currentTrick,
      card
    );
    if (errorMessage != null) {
      throw new ValidationError(errorMessage);
    }
    player.cardsInHand = player.cardsInHand.filter(
      (x) => !areCardsEqual(x, card)
    );
    const updatedCurrentTrick = game.currentTrick.concat([{ userId, card }]);
    const updatedCompletedRounds = game.completedRounds;
    let updatedState = GameState.TRICK_ACTIVE;
    let updatedActionToUserId = orderedPlayers[1].userId;
    let roundScore: undefined | IRoundScore;
    let trickTakenByUserId: undefined | number;
    if (updatedCurrentTrick.length === game.players.length) {
      trickTakenByUserId = getTrickWinner(game.currentTrick);
      game.players.forEach((x) => {
        if (x.userId === trickTakenByUserId) {
          x.tricksTaken += 1;
        }
      });
      updatedState = GameState.TRICK_COMPLETE;
      updatedActionToUserId = trickTakenByUserId;
      if (player.cardsInHand.length === 0) {
        const newCompletedRound: IOhHeckRoundPlayerScore[] = this.determineScores(
          game.players
        );
        roundScore = this.buildRoundScore(newCompletedRound);
        updatedCompletedRounds.push(newCompletedRound);
        updatedState =
          updatedCompletedRounds.length === (game.options.halfGame ? 7 : 14)
            ? GameState.COMPLETE
            : GameState.ROUND_COMPLETE;
      }
    }
    await this.gameDataService.update(game.gameId, game.version, {
      players: game.players,
      currentTrick: updatedCurrentTrick,
      state: updatedState,
      actionToUserId: updatedActionToUserId,
      completedRounds: updatedCompletedRounds,
    });
    const result: ITrickEvent = {
      cardPlayed: { userId, card },
      updatedGameState: updatedState,
      actionToUserId: updatedActionToUserId,
      trickTakenByUserId,
      roundScore,
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
    players: IOhHeckPlayer[],
    userId: number
  ): number {
    const orderedPlayers = this.getPlayersOrderedToStartWithUser(
      players,
      userId
    );
    return orderedPlayers[1].userId;
  }

  private getPlayersOrderedToStartWithUser(
    playerStates: IOhHeckPlayer[],
    userId: number
  ): IOhHeckPlayer[] {
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
    game: ISerializedOhHeckGame
  ): Promise<IGame> {
    return {
      gameId: game.gameId,
      hostUserId: game.hostUserId,
      options: game.options,
      state: game.state,
      actionToUserId: game.actionToUserId,
      playerStates: await this.loadPlayerStates(userId, game),
      currentTrick: game.currentTrick,
      roundScores: game.completedRounds.map(this.buildRoundScore),
      createdAt: game.createdAt.toISOString(),
      updatedAt: game.updatedAt.toISOString(),
    };
  }

  private async loadPlayerStates(
    userId: number,
    game: ISerializedOhHeckGame
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
        cards: [],
        bet: p.bet,
        tricksTaken: p.tricksTaken,
      };
      if (
        game.state === GameState.BETTING ||
        game.state === GameState.TRICK_ACTIVE ||
        game.state === GameState.TRICK_COMPLETE
      ) {
        out.numberOfCards = p.cardsInHand.length;
        if (userId === p.userId) {
          out.cards = p.cardsInHand;
        }
      }
      return out;
    });
  }

  private buildRoundScore(
    completedRounds: IOhHeckRoundPlayerScore[]
  ): IRoundScore {
    const out: IRoundScore = {};
    completedRounds.forEach((x) => {
      out[x.userId] = {
        score: x.score,
        bet: x.bet,
        tricksTaken: x.tricksTaken,
      };
    });
    return out;
  }

  private determineScores(players: IOhHeckPlayer[]): IOhHeckRoundPlayerScore[] {
    return players.map((player) => {
      if (player.bet == null) {
        throw Error("Bet unexpectedly null");
      }
      return {
        userId: player.userId,
        score: player.bet === player.tricksTaken ? player.bet + 5 : 0,
        bet: player.bet,
        tricksTaken: player.tricksTaken,
      };
    });
  }
}
