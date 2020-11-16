import _ from "lodash";
import { doesNotHaveValue } from '../../shared/utilities/value_checker';
import { ISerializedYanivGame } from "../../database/models/yaniv_game";
import {
  IGameOptions,
  IGame,
  IPlayerState,
  GameState,
  IRoundScore,
} from "../../shared/dtos/yaniv/game";
import { throwGameNotFoundError, ValidationError } from '../shared/exceptions';
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
import { getShuffledDeck, serializeCard } from './card_helpers';

export interface IYanivGameService {
  create: (userId: number, options: IGameOptions) => Promise<IGame>;
  get: (userId: number, gameId: number) => Promise<IGame>;
  join: (userId: number, gameId: number) => Promise<IGame>;
  startRound: (userId: number, gameId: number) => Promise<IGame>;
  
  // takeAction: (userId: number, gameId: number, action: IGameActionRequest) => Promise<void>;
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
      throwGameNotFoundError(gameId) 
    }
    return await this.loadFullGame(userId, game);
  }

  async join(userId: number, gameId: number): Promise<IGame> {
    const game = await this.gameDataService.get(gameId);
    if (doesNotHaveValue(game)) {
      throwGameNotFoundError(gameId) 
    }
    const playerStates = await this.gamePlayerDataService.getAllForGame(
      game.gameId
    );
    const nextPosition = Math.max(...playerStates.map(x => x.position)) + 1
    await this.gamePlayerDataService.create(gameId, userId, nextPosition);
    return await this.loadFullGame(userId, game);
  }

  async startRound(userId: number, gameId: number): Promise<IGame> {
    let game = await this.gameDataService.get(gameId);
    if (doesNotHaveValue(game)) {
      throwGameNotFoundError(gameId) 
    }
    if (game.hostUserId !== userId) {
      throw new ValidationError("Only the host can start rounds")
    }
    // validate state is players joining (has at least two players) or round completed / 
    const playerStates = await this.gamePlayerDataService.getAllForGame(
      game.gameId
    );
    const deck = getShuffledDeck();
    playerStates.forEach(x => x.cardsInHand = [])
    for (let i = 0; i < 5; i++) {
      playerStates.forEach(x => x.cardsInHand.push(deck.pop()))
    }
    await this.gamePlayerDataService.updateAll(playerStates)
    game = await this.gameDataService.update(gameId, {
      actionToUserId: playerStates[0].userId,
      state: GameState.ROUND_ACTIVE,
      cardsBuriedInDiscardPile: [],
      cardsOnTopOfDiscardPile: [deck.pop()],
      cardsInDeck: deck
    })
    return await this.loadFullGame(userId, game);
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
