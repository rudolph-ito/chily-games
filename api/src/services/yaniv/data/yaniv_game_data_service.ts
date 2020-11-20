import { ICard } from "../../../shared/dtos/yaniv/card";
import { doesHaveValue } from "../../../shared/utilities/value_checker";
import { YanivGame } from "../../../database/models";
import { ISerializedYanivGame } from "../../../database/models/yaniv_game";
import { GameState, IGameOptions } from "../../../shared/dtos/yaniv/game";
import { serializeCard } from "../card_helpers";

export interface IYanivGameCreateOptions {
  hostUserId: number;
  options: IGameOptions;
}

export interface IYanivGameUpdateOptions {
  options?: IGameOptions;
  state?: GameState;
  actionToUserId?: number;
  cardsInDeck?: ICard[];
  cardsBuriedInDiscardPile?: ICard[];
  cardsOnTopOfDiscardPile?: ICard[];
}

export interface IYanivGameDataService {
  create: (options: IYanivGameCreateOptions) => Promise<ISerializedYanivGame>;
  get: (gameId: number) => Promise<ISerializedYanivGame>;
  update: (
    gameId: number,
    options: IYanivGameUpdateOptions
  ) => Promise<ISerializedYanivGame>;
}

export class YanivGameDataService implements IYanivGameDataService {
  async create(
    options: IYanivGameCreateOptions
  ): Promise<ISerializedYanivGame> {
    const game = YanivGame.build({
      hostUserId: options.hostUserId,
      actionToUserId: options.hostUserId,
      options: options.options,
      state: GameState.PLAYERS_JOINING,
    });
    await game.save();
    return game.serialize();
  }

  async get(gameId: number): Promise<ISerializedYanivGame> {
    const game = await YanivGame.findByPk(gameId);
    if (doesHaveValue(game)) {
      return game.serialize();
    }
    return null;
  }

  async update(
    gameId: number,
    options: IYanivGameUpdateOptions
  ): Promise<ISerializedYanivGame> {
    const game = await YanivGame.findByPk(gameId);
    for (let [key, value] of Object.entries(options)) {
      if (
        [
          "cardsInDeck",
          "cardsBuriedInDiscardPile",
          "cardsOnTopOfDiscardPile",
        ].includes(key) &&
        doesHaveValue(value)
      ) {
        value = (value as ICard[]).map(serializeCard);
      }
      game[key] = value;
    }
    await game.save();
    return game.serialize();
  }
}
