import _ from "lodash";
import {
  doesHaveValue,
  doesNotHaveValue,
} from "../../shared/utilities/value_checker";
import { ISerializedYanivGame } from "../../database/models/yaniv_game";
import {
  IGameOptions,
  IGame,
  IPlayerState,
  GameState,
  IRoundScore,
  IGameActionRequest,
  RoundScoreType,
} from "../../shared/dtos/yaniv/game";
import { throwGameNotFoundError, ValidationError } from "../shared/exceptions";
import {
  IYanivGameCompletedRoundDataService,
  YanivGameCompletedRoundDataService,
} from "./data/yaniv_game_completed_round_data_service";
import {
  IYanivGameDataService,
  YanivGameDataService,
} from "./data/yaniv_game_data_service";
import {
  IYanivGamePlayerDataService,
  YanivGamePlayerDataService,
} from "./data/yaniv_game_player_data_service";
import {
  areCardsEqual,
  standardDeckWithTwoJokers,
} from "./card_helpers";
import { isValidDiscard, isValidPickup } from "./discard_validator";
import { ISerializedYanivGameCompletedRound } from "../../database/models/yaniv_game_completed_round";
import { getCardsScore } from "./score_helpers";
import shuffle from "knuth-shuffle-seeded";

export interface IYanivGameService {
  create: (userId: number, options: IGameOptions) => Promise<IGame>;
  get: (userId: number, gameId: number) => Promise<IGame>;
  join: (userId: number, gameId: number) => Promise<IGame>;
  startRound: (userId: number, gameId: number) => Promise<IGame>;
  play: (
    userId: number,
    gameId: number,
    action: IGameActionRequest
  ) => Promise<IGame>;
}

export class YanivGameService implements IYanivGameService {
  constructor(
    private readonly gameDataService: IYanivGameDataService = new YanivGameDataService(),
    private readonly gamePlayerDataService: IYanivGamePlayerDataService = new YanivGamePlayerDataService(),
    private readonly gameCompletedRoundDataService: IYanivGameCompletedRoundDataService = new YanivGameCompletedRoundDataService()
  ) {}

  async create(userId: number, options: IGameOptions): Promise<IGame> {
    // validate options
    const game = await this.gameDataService.create({
      hostUserId: userId,
      options,
    });
    await this.gamePlayerDataService.create(game.gameId, game.hostUserId, 0);
    return await this.loadFullGame(userId, game);
  }

  async get(userId: number, gameId: number): Promise<IGame> {
    const game = await this.gameDataService.get(gameId);
    if (doesNotHaveValue(game)) {
      throwGameNotFoundError(gameId);
    }
    return await this.loadFullGame(userId, game);
  }

  async join(userId: number, gameId: number): Promise<IGame> {
    const game = await this.gameDataService.get(gameId);
    if (doesNotHaveValue(game)) {
      throwGameNotFoundError(gameId);
    }
    if (game.state !== GameState.PLAYERS_JOINING) {
      throw new ValidationError("Cannot join in-progress or completed game.");
    }
    const playerStates = await this.gamePlayerDataService.getAllForGame(
      game.gameId
    );
    const nextPosition = Math.max(...playerStates.map((x) => x.position)) + 1;
    await this.gamePlayerDataService.create(gameId, userId, nextPosition);
    return await this.loadFullGame(userId, game);
  }

  async startRound(userId: number, gameId: number): Promise<IGame> {
    let game = await this.gameDataService.get(gameId);
    if (doesNotHaveValue(game)) {
      throwGameNotFoundError(gameId);
    }
    if (game.hostUserId !== userId) {
      throw new ValidationError("Only the host can start rounds");
    }
    if (game.state === GameState.ROUND_ACTIVE) {
      throw new ValidationError("Round already active");
    }
    if (game.state === GameState.COMPLETE) {
      throw new ValidationError("Game is already complete");
    }
    const playerStates = await this.gamePlayerDataService.getAllForGame(
      game.gameId
    );
    if (game.state === GameState.PLAYERS_JOINING && playerStates.length === 1) {
      throw new ValidationError("Must have at least two players to start");
    }
    const deck = standardDeckWithTwoJokers();
    playerStates.forEach((x) => (x.cardsInHand = []));
    for (let i = 0; i < 5; i++) {
      playerStates.forEach((x) => x.cardsInHand.push(deck.pop()));
    }
    await this.gamePlayerDataService.updateAll(playerStates);
    game = await this.gameDataService.update(gameId, {
      state: GameState.ROUND_ACTIVE,
      cardsBuriedInDiscardPile: [],
      cardsOnTopOfDiscardPile: [deck.pop()],
      cardsInDeck: deck,
    });
    return await this.loadFullGame(userId, game);
  }

  async play(
    userId: number,
    gameId: number,
    action: IGameActionRequest
  ): Promise<IGame> {
    let game = await this.gameDataService.get(gameId);
    if (doesNotHaveValue(game)) {
      throwGameNotFoundError(gameId);
    }
    if (game.actionToUserId !== userId) {
      throw new ValidationError("Action is not to you.");
    }
    if (action.callYaniv) {
      game = await this.playCallYaniv(userId, game);
    } else {
      game = await this.playDiscardAndPickup(userId, action, game);
    }
    return await this.loadFullGame(userId, game);
  }

  private async playCallYaniv(
    userId: number,
    game: ISerializedYanivGame
  ): Promise<ISerializedYanivGame> {
    const playerStates = await this.gamePlayerDataService.getAllForGame(
      game.gameId
    );
    const currentRoundNumber = await this.gameCompletedRoundDataService.getNextRoundNumber(
      game.gameId
    );
    const completedRounds: ISerializedYanivGameCompletedRound[] = playerStates.map(
      (playerState) => {
        return {
          gameId: game.gameId,
          userId: playerState.userId,
          roundNumber: currentRoundNumber,
          score: getCardsScore(playerState.cardsInHand),
          scoreType: RoundScoreType.DEFAULT,
        };
      }
    );
    const minRoundScore = _.minBy(completedRounds, (x) => x.score).score;
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
    playerStates.forEach((x) => (x.cardsInHand = []));
    await this.gameCompletedRoundDataService.createMany(completedRounds);
    await this.gamePlayerDataService.updateAll(playerStates);
    return await this.gameDataService.update(game.gameId, {
      actionToUserId: null,
      state: GameState.ROUND_COMPLETE, // TODO set to complete if game over
      cardsBuriedInDiscardPile: [],
      cardsOnTopOfDiscardPile: [],
      cardsInDeck: [],
    });
  }

  private async playDiscardAndPickup(
    userId: number,
    action: IGameActionRequest,
    game: ISerializedYanivGame
  ): Promise<ISerializedYanivGame> {
    if (
      _.uniqWith(action.cardsDiscarded, areCardsEqual).length <
      action.cardsDiscarded.length
    ) {
      throw new ValidationError("Discard cannot contain duplicates.");
    }
    const playerStates = await this.gamePlayerDataService.getAllForGame(
      game.gameId
    );
    const playerState = playerStates.find((x) => x.userId === userId);
    if (
      _.differenceWith(
        action.cardsDiscarded,
        playerState.cardsInHand,
        areCardsEqual
      ).length !== 0
    ) {
      throw new ValidationError("Can only discard cards in your hand.");
    }
    if (!isValidDiscard(action.cardsDiscarded)) {
      throw new ValidationError("Invalid discard.");
    }
    if (
      doesHaveValue(action.cardPickedUp) &&
      !isValidPickup(action.cardPickedUp, game.cardsOnTopOfDiscardPile)
    ) {
      throw new ValidationError("Invalid pickup.");
    }
    const nextPosition = (playerState.position + 1) % playerStates.length;
    const updatedDeck = game.cardsInDeck;
    let discardsToBury = game.cardsOnTopOfDiscardPile;
    playerState.cardsInHand = _.differenceWith(
      playerState.cardsInHand,
      action.cardsDiscarded,
      areCardsEqual
    );
    if (doesHaveValue(action.cardPickedUp)) {
      playerState.cardsInHand.push(action.cardPickedUp);
      discardsToBury = discardsToBury.filter((x) =>
        areCardsEqual(x, action.cardPickedUp)
      );
    } else {
      // TODO if cards in deck is empty, shuffle buried discards into deck
      playerState.cardsInHand.push(updatedDeck.pop());
    }
    await this.gamePlayerDataService.updateAll([playerState]);
    return await this.gameDataService.update(game.gameId, {
      actionToUserId: playerStates.find((x) => x.position === nextPosition)
        .userId,
      cardsBuriedInDiscardPile: game.cardsBuriedInDiscardPile.concat(
        discardsToBury
      ),
      cardsOnTopOfDiscardPile: action.cardsDiscarded,
      cardsInDeck: updatedDeck,
    });
  }

  private async loadFullGame(
    userId: number,
    game: ISerializedYanivGame
  ): Promise<IGame> {
    const result: IGame = {
      gameId: game.gameId,
      hostUserId: game.hostUserId,
      options: game.options,
      state: game.state,
      playerStates: await this.loadPlayerStates(userId, game),
      roundScores: await this.loadRoundScores(game.gameId),
    };
    if (result.state === GameState.ROUND_ACTIVE) {
      result.actionToUserId = game.actionToUserId;
      result.cardsOnTopOfDiscardPile = game.cardsOnTopOfDiscardPile;
    }
    return result;
  }

  private async loadPlayerStates(
    userId: number,
    game: ISerializedYanivGame
  ): Promise<IPlayerState[]> {
    const playerStates = await this.gamePlayerDataService.getAllForGame(
      game.gameId
    );
    return playerStates.map((ps) => {
      const out: IPlayerState = { userId: ps.userId };
      if (game.state === GameState.ROUND_ACTIVE) {
        out.numberOfCards = ps.cardsInHand.length;
        if (userId === ps.userId) {
          out.cards = ps.cardsInHand;
        }
      }
      return out;
    });
  }

  private async loadRoundScores(gameId: number): Promise<IRoundScore[]> {
    const completedRounds = await this.gameCompletedRoundDataService.getAllForGame(
      gameId
    );
    return Object.values(_.groupBy(completedRounds, (x) => x.roundNumber)).map(
      (roundResults) => {
        const out: IRoundScore = {};
        roundResults.forEach((x) => {
          out[x.userId] = { score: x.score, scoreType: x.scoreType };
        });
        return out;
      }
    );
  }
}
