import {
  YanivGamePlayer,
  ISerializedYanivGamePlayer,
} from "../../../database/models/yaniv_game_player";

import { serializeCard } from "../card_helpers";

export interface IYanivGamePlayerDataService {
  create: (gameId: number, userId: number, position: number) => Promise<void>;
  getAllForGames: (gameIds: number[]) => Promise<ISerializedYanivGamePlayer[]>;
  getAllForGame: (gameId: number) => Promise<ISerializedYanivGamePlayer[]>;
  updateAll: (playerStates: ISerializedYanivGamePlayer[]) => Promise<void>;
}

export class YanivGamePlayerDataService implements IYanivGamePlayerDataService {
  async create(
    gameId: number,
    userId: number,
    position: number
  ): Promise<void> {
    const gamePlayer = YanivGamePlayer.build({
      gameId,
      userId,
      position,
      cardsInHand: [],
    });
    await gamePlayer.save();
  }

  async getAllForGames(
    gameIds: number[]
  ): Promise<ISerializedYanivGamePlayer[]> {
    const gamePlayers = await YanivGamePlayer.findAll({
      order: [["position", "ASC"]],
      where: { gameId: gameIds },
    });
    return gamePlayers.map((x) => x.serialize());
  }

  async getAllForGame(gameId: number): Promise<ISerializedYanivGamePlayer[]> {
    const gamePlayers = await YanivGamePlayer.findAll({
      order: [["position", "ASC"]],
      where: { gameId },
    });
    return gamePlayers.map((x) => x.serialize());
  }

  async updateAll(playerStates: ISerializedYanivGamePlayer[]): Promise<void> {
    for (const playerState of playerStates) {
      await YanivGamePlayer.update(
        {
          position: playerState.position,
          cardsInHand: playerState.cardsInHand.map(serializeCard),
        },
        {
          where: {
            gameId: playerState.gameId,
            userId: playerState.userId,
          },
        }
      );
    }
  }
}
