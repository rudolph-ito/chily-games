import _ from "lodash";
import { valueOrDefault } from "../../shared/utilities/value_checker";
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
import { IOhHeckGameDataService, OhHeckGameDataService } from "./data/oh_heck_game_data_service";
import { GameState, IBetEvent, IGame, IGameOptions, IPlayerState, IRoundScore, ISearchedGame, ISearchGamesRequest, ITrickEvent } from "../../shared/dtos/oh_heck/game";
import { IOhHeckPlayer, IOhHeckRoundPlayerScore, ISerializedOhHeckGame } from "../../database/models/oh_heck_game";
import { validateBet } from "./bet_validator"

export interface IOhHeckGameService {
  abort: (userId: number, gameId: number) => Promise<IGame>;
  abortUnfinishedGames: () => Promise<number>;
  create: (userId: number, options: IGameOptions) => Promise<IGame>;
  get: (userId: number | null, gameId: number) => Promise<IGame>;
  join: (userId: number, gameId: number) => Promise<IGame>;
  startRound: (userId: number, gameId: number) => Promise<IGame>;
  placeBet: (userId: number, gameId: number, bet: number) => Promise<IBetEvent>;
  playCard: (userId: number, gameId: number, action: ICard) => Promise<ITrickEvent>;
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
    game = await this.gameDataService.update(game.gameId, game.version, {
      players: game.players.concat([{ userId, cardsInHand: [], bet: null, tricksTaken: 0 }]),
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
    const updatedPlayers: IOhHeckPlayer[] = game.players.map((x) => ({ userId: x.userId, cardsInHand: [], bet: null, tricksTaken: 0 }));
    // for (let i = 0; i < 5; i++) {
    //   updatedPlayers.forEach((x) => {
    //     const nextCard = deck.pop();
    //     if (nextCard == null) {
    //       throw new Error("Unexpected empty deck (dealing to players)");
    //     }
    //     x.cardsInHand.push(nextCard);
    //   });
    // }
    // const initialDiscard = deck.pop();
    // if (initialDiscard == null) {
    //   throw new Error("Unexpected empty deck (initial discard)");
    // }
    // game = await this.gameDataService.update(gameId, game.version, {
    //   state: GameState.ROUND_ACTIVE,
    //   cardsBuriedInDiscardPile: [],
    //   cardsOnTopOfDiscardPile: [initialDiscard],
    //   cardsInDeck: deck,
    //   players: updatedPlayers,
    // });
    return await this.loadFullGame(userId, game);
  }

  async placeBet(
    userId: number,
    gameId: number,
    bet: number,
  ): Promise<IBetEvent> {
    const game = await this.gameDataService.get(gameId);
    if (game.actionToUserId !== userId) {
      throw new ValidationError("Action is not to you.");
    }
    if (game.state !== GameState.BETTING) {
      throw new ValidationError("Invalid state to place bet.");
    }
    const betErrorMessage = validateBet(game.players, bet);
    if (betErrorMessage !== null) {
      throw new ValidationError(betErrorMessage);
    }
    const updatedPlayers = game.players.map(player => {
      if (player.userId == userId) {
        return { ...player, bet }
      }
      return player;
    })
    const allBetsPlaced = updatedPlayers.filter(player => player.bet == null).length == 0;
    const updatedState = allBetsPlaced ? GameState.TRICK_ACTIVE : GameState.BETTING
    const updatedActionToUserId = this.getNextPlayerUserId(game.players, userId);
    await this.gameDataService.update(game.gameId, game.version, {
      players: updatedPlayers,
      state: updatedState,
      actionToUserId: updatedActionToUserId
    })
    const result: IBetEvent = {
      betPlaced: { userId, bet },
      updatedGameState: updatedState,
      actionToUserId: updatedActionToUserId
    }
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
    // validate play is valid
    // remove card from player hand, update game current trick
    // if trick over, update player tricks taken
    // if round over, compute and save round score
    // if game over, updated game state
    const result: ITrickEvent = {
      cardPlayed: { userId, card },
      updatedGameState: GameState.TRICK_ACTIVE,
      actionToUserId: userId
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

  private getNextPlayerUserId(players: IOhHeckPlayer[], userId: number): number {
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
        tricksTaken: p.tricksTaken
      };
      if (game.state === GameState.BETTING || game.state == GameState.TRICK_ACTIVE || game.state == GameState.TRICK_COMPLETE) {
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
      out[x.userId] = { score: x.score, bet: x.bet, betWasCorrect: x.betWasCorrect };
    });
    return out;
  }

  private isGameComplete(
    completedRounds: IOhHeckRoundPlayerScore[][],
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
