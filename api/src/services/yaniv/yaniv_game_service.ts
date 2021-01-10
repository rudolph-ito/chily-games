import _ from "lodash";
import { valueOrDefault } from "../../shared/utilities/value_checker";
import { ISerializedYanivGame, IYanivCompletedRound, IYanivPlayer } from "../../database/models/yaniv_game";
import {
  IGameOptions,
  IGame,
  IPlayerState,
  GameState,
  IRoundScore,
  IGameActionRequest,
  IGameActionResponse,
  RoundScoreType,
  ISearchGamesRequest,
  ISearchedGame,
  IActionToNextPlayerEvent,
  IRoundFinishedEvent,
} from "../../shared/dtos/yaniv/game";
import { ValidationError } from "../shared/exceptions";
import {
  IYanivGameDataService,
  YanivGameDataService,
} from "./data/yaniv_game_data_service";
import { areCardsEqual, standardDeckWithTwoJokers } from "./card_helpers";
import { isValidDiscard, isValidPickup } from "./discard_validator";
import { ISerializedYanivGameCompletedRound } from "../../database/models/yaniv_game_completed_round";
import { getCardsScore } from "./score_helpers";
import { ISerializedYanivGamePlayer } from "src/database/models/yaniv_game_player";
import shuffle from "knuth-shuffle-seeded";
import { IPaginatedResponse } from "src/shared/dtos/search";
import {
  IUserDataService,
  UserDataService,
} from "../shared/data/user_data_service";
import { ICard } from "src/shared/dtos/yaniv/card";

interface IPlayDiscardAndPickupResult {
  cardPickedUpFromDeck?: ICard;
  actionToNextPlayerEvent: IActionToNextPlayerEvent;
}

interface IPlayCallYanivResult {
  roundFinishedEvent: IRoundFinishedEvent;
}

export interface IYanivGameService {
  create: (userId: number, options: IGameOptions) => Promise<IGame>;
  get: (userId: number | null, gameId: number) => Promise<IGame>;
  join: (userId: number, gameId: number) => Promise<IGame>;
  startRound: (userId: number, gameId: number) => Promise<IGame>;
  play: (
    userId: number,
    gameId: number,
    action: IGameActionRequest
  ) => Promise<IGameActionResponse>;
  search: (
    request: ISearchGamesRequest
  ) => Promise<IPaginatedResponse<ISearchedGame>>;
}

export class YanivGameService implements IYanivGameService {
  constructor(
    private readonly gameDataService: IYanivGameDataService = new YanivGameDataService(),
    private readonly userDataService: IUserDataService = new UserDataService()
  ) {}

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
    const nextPosition = Math.max(...game.players.map((x) => x.position)) + 1;
    game = await this.gameDataService.update(game.gameId, game.version, {
      players: game.players.concat([{userId, position: nextPosition, cardsInHand: []}])
    });
    return await this.loadFullGame(userId, game);
  }

  async startRound(userId: number, gameId: number): Promise<IGame> {
    let game = await this.gameDataService.get(gameId);
    if (game.hostUserId !== userId) {
      throw new ValidationError("Only the host can start rounds");
    }
    if (game.state === GameState.ROUND_ACTIVE) {
      throw new ValidationError("Round already active");
    }
    if (game.state === GameState.COMPLETE) {
      throw new ValidationError("Game is already complete");
    }
    if (game.state === GameState.PLAYERS_JOINING && game.players.length === 1) {
      throw new ValidationError("Must have at least two players to start");
    }
    const deck = standardDeckWithTwoJokers();
    const updatedPlayers: IYanivPlayer[] = game.players.map(x => ({ ...x }))
    updatedPlayers.forEach((x) => (x.cardsInHand = []));
    for (let i = 0; i < 5; i++) {
      updatedPlayers.forEach((x) => {
        const nextCard = deck.pop();
        if (nextCard == null) {
          throw new Error("Unexpected empty deck (dealing to players)");
        }
        x.cardsInHand.push(nextCard);
      });
    }
    const initialDiscard = deck.pop();
    if (initialDiscard == null) {
      throw new Error("Unexpected empty deck (initial discard)");
    }
    game = await this.gameDataService.update(gameId, game.version, {
      state: GameState.ROUND_ACTIVE,
      cardsBuriedInDiscardPile: [],
      cardsOnTopOfDiscardPile: [initialDiscard],
      cardsInDeck: deck,
      players: updatedPlayers
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
    if (valueOrDefault(action.callYaniv, false)) {
      const callYanivResult = await this.playCallYaniv(userId, game);
      result.roundFinishedEvent = callYanivResult.roundFinishedEvent;
    } else {
      if (action.cardsDiscarded == null) {
        throw new ValidationError(
          "Cards discarded is required if not calling yaniv."
        );
      }
      const discardAndPickupResult = await this.playDiscardAndPickup(
        userId,
        action.cardsDiscarded,
        action.cardPickedUp,
        game
      );
      result.actionToNextPlayerEvent =
        discardAndPickupResult.actionToNextPlayerEvent;
      result.cardPickedUpFromDeck = discardAndPickupResult.cardPickedUpFromDeck;
    }
    return result;
  }

  async search(
    request: ISearchGamesRequest
  ): Promise<IPaginatedResponse<ISearchedGame>> {
    const result = await this.gameDataService.search(request);
    const userIds: number[] = []
    result.data.forEach(game => {
      game.players.forEach(player => userIds.push(player.userId))
    })
    const users = await this.userDataService.getUsers(userIds);
    const userIdToUsername = _.fromPairs(
      users.map((u) => [u.userId, u.username])
    );
    return {
      data: result.data.map((x) => ({
        gameId: x.gameId,
        hostUserId: x.hostUserId,
        players: x.players.map((x) => ({
          userId: x.userId,
          username: userIdToUsername[x.userId],
        })),
        state: x.state,
        createdAt: x.createdAt.toISOString(),
        updatedAt: x.updatedAt.toISOString(),
      })),
      total: result.total,
    };
  }

  private async playCallYaniv(
    userId: number,
    game: ISerializedYanivGame
  ): Promise<IPlayCallYanivResult> {
    const orderedPlayers = this.getPlayersOrderedToStartWithUser(game.players, userId);
    const playerState = orderedPlayers[0];
    if (getCardsScore(playerState.cardsInHand) > 7) {
      throw new ValidationError(
        "Hand total must be less than or equal to 7 to call Yaniv."
      );
    }
    const completedRounds: IYanivCompletedRound[] = game.players.map(
      (playerState) => {
        return {
          userId: playerState.userId,
          score: getCardsScore(playerState.cardsInHand),
          scoreType: RoundScoreType.DEFAULT,
        };
      }
    );
    const minRoundScore = _.minBy(completedRounds, (x) => x.score)?.score ?? 0;
    const hasMultipleWinners =
      completedRounds.filter((x) => x.score === minRoundScore).length > 1;
    completedRounds.forEach((x) => {
      if (
        x.userId === userId &&
        (x.score > minRoundScore ||
          (x.score === minRoundScore && hasMultipleWinners))
      ) {
        x.score += 30;
        x.scoreType = RoundScoreType.ASAF;
      } else if (x.score === minRoundScore) {
        x.score = 0;
        x.scoreType = RoundScoreType.YANIV;
      }
    });
    const roundScore = this.buildRoundScore(completedRounds);
    const isGameComplete = await this.isGameComplete(game);
    const winner = completedRounds.find(
      (x) => x.scoreType === RoundScoreType.YANIV
    );
    if (winner == null) {
      throw new Error("Unable to find winner");
    }
    const updatedGameState = isGameComplete
      ? GameState.COMPLETE
      : GameState.ROUND_COMPLETE;
    const updatedGame = await this.gameDataService.update(game.gameId, game.version, {
      actionToUserId: winner.userId,
      state: updatedGameState,
      completedRounds: game.completedRounds.concat([completedRounds])
    });
    return {
      roundFinishedEvent: {
        playerStates: await this.loadPlayerStates(userId, updatedGame),
        roundScore,
        updatedGameState,
      },
    };
  }

  private async playDiscardAndPickup(
    userId: number,
    cardsDiscarded: ICard[],
    cardPickedUp: ICard | undefined,
    game: ISerializedYanivGame
  ): Promise<IPlayDiscardAndPickupResult> {
    if (
      _.uniqWith(cardsDiscarded, areCardsEqual).length < cardsDiscarded.length
    ) {
      throw new ValidationError("Discard cannot contain duplicates.");
    }
    const orderedPlayers = this.getPlayersOrderedToStartWithUser(game.players, userId);
    const playerState = orderedPlayers[0];
    if (
      _.differenceWith(cardsDiscarded, playerState.cardsInHand, areCardsEqual)
        .length !== 0
    ) {
      throw new ValidationError("Can only discard cards in your hand.");
    }
    if (!isValidDiscard(cardsDiscarded)) {
      throw new ValidationError("Invalid discard.");
    }
    if (
      cardPickedUp != null &&
      !isValidPickup(cardPickedUp, game.cardsOnTopOfDiscardPile)
    ) {
      throw new ValidationError("Invalid pickup.");
    }
    let discardsToBury = game.cardsOnTopOfDiscardPile;
    let cardPickedUpFromDeck: ICard | undefined;
    playerState.cardsInHand = _.differenceWith(
      playerState.cardsInHand,
      cardsDiscarded,
      areCardsEqual
    );
    if (cardPickedUp != null) {
      playerState.cardsInHand.push(cardPickedUp);
      discardsToBury = discardsToBury.filter((x) =>
        areCardsEqual(x, cardPickedUp)
      );
    } else {
      cardPickedUpFromDeck = game.cardsInDeck.pop();
      if (cardPickedUpFromDeck == null) {
        throw new Error("Unexpected empty deck");
      }
      playerState.cardsInHand.push(cardPickedUpFromDeck);
      if (game.cardsInDeck.length === 0) {
        game.cardsInDeck = game.cardsBuriedInDiscardPile;
        game.cardsBuriedInDiscardPile = [];
        shuffle(game.cardsInDeck);
      }
    }
    const updatedGame = await this.gameDataService.update(game.gameId, game.version, {
      actionToUserId: orderedPlayers[1].userId,
      cardsBuriedInDiscardPile: game.cardsBuriedInDiscardPile.concat(
        discardsToBury
      ),
      cardsOnTopOfDiscardPile: cardsDiscarded,
      cardsInDeck: game.cardsInDeck,
      players: game.players
    });
    return {
      cardPickedUpFromDeck,
      actionToNextPlayerEvent: {
        lastAction: {
          userId,
          cardsDiscarded,
          cardPickedUp,
        },
        actionToUserId: updatedGame.actionToUserId,
      },
    };
  }

  private getPlayersOrderedToStartWithUser(
    playerStates: IYanivPlayer[],
    userId: number
  ): IYanivPlayer[] {
    const reorderedPlayers = playerStates.slice()
    while (reorderedPlayers[0].userId !== userId) {
      const playerState = reorderedPlayers.shift();
      if (playerState != null) {
        reorderedPlayers.push(playerState);
      }
    }
    return reorderedPlayers
  }

  private async loadFullGame(
    userId: number,
    game: ISerializedYanivGame
  ): Promise<IGame> {
    return {
      gameId: game.gameId,
      hostUserId: game.hostUserId,
      options: game.options,
      state: game.state,
      actionToUserId: game.actionToUserId,
      cardsOnTopOfDiscardPile: game.cardsOnTopOfDiscardPile,
      playerStates: await this.loadPlayerStates(userId, game),
      roundScores: game.completedRounds.map(this.buildRoundScore),
    };
  }

  private async loadPlayerStates(
    userId: number,
    game: ISerializedYanivGame
  ): Promise<IPlayerState[]> {
    const users = await this.userDataService.getUsers(
      game.players.map((x) => x.userId)
    );
    const userIdToUsername = _.fromPairs(
      users.map((u) => [u.userId, u.username])
    );
    return game.players.map((p) => {
      const out: IPlayerState = {
        userId: p.userId,
        username: userIdToUsername[p.userId],
        numberOfCards: 0,
        cards: [],
      };
      if (
        game.state === GameState.ROUND_COMPLETE ||
        game.state === GameState.COMPLETE
      ) {
        out.numberOfCards = p.cardsInHand.length;
        out.cards = p.cardsInHand;
      } else if (game.state === GameState.ROUND_ACTIVE) {
        out.numberOfCards = p.cardsInHand.length;
        if (userId === p.userId) {
          out.cards = p.cardsInHand;
        }
      }
      return out;
    });
  }

  private buildRoundScore(
    completedRounds: IYanivCompletedRound[]
  ): IRoundScore {
    const out: IRoundScore = {};
    completedRounds.forEach((x) => {
      out[x.userId] = { score: x.score, scoreType: x.scoreType };
    });
    return out;
  }

  private isGameComplete(
    game: ISerializedYanivGame,
  ): boolean {
    const playerTotals: Record<number, number> = {}
    game.completedRounds.forEach((completedRound) => {
      completedRound.forEach(playerScore => {
        if (playerTotals[playerScore.userId] == null) {
          playerTotals[playerScore.userId] = 0
        }
        playerTotals[playerScore.userId] += playerScore.score
      })
    });
    return Object.values(playerTotals).some(playerTotal => playerTotal >= game.options.playTo)
  }
}
