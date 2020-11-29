import {
  YanivGameCompletedRound,
  ISerializedYanivGameCompletedRound,
} from "../../../database/models/yaniv_game_completed_round";

export interface IYanivGameCompletedRoundDataService {
  createMany: (
    completedRounds: ISerializedYanivGameCompletedRound[]
  ) => Promise<void>;
  getAllForGame: (
    gameId: number
  ) => Promise<ISerializedYanivGameCompletedRound[]>;
  getNextRoundNumber: (gameId: number) => Promise<number>;
}

export class YanivGameCompletedRoundDataService
  implements IYanivGameCompletedRoundDataService {
  async createMany(
    completedRounds: ISerializedYanivGameCompletedRound[]
  ): Promise<void> {
    for (const completedRound of completedRounds) {
      await YanivGameCompletedRound.build(completedRound).save();
    }
  }

  async getAllForGame(
    gameId: number
  ): Promise<ISerializedYanivGameCompletedRound[]> {
    const gameCompletedRounds = await YanivGameCompletedRound.findAll({
      order: [["roundNumber", "ASC"]],
      where: { gameId },
    });
    return gameCompletedRounds.map((x) => x.serialize());
  }

  async getNextRoundNumber(gameId: number): Promise<number> {
    const gameCompletedRounds = await YanivGameCompletedRound.findAll({
      order: [["roundNumber", "DESC"]],
      where: { gameId },
      limit: 1,
    });
    return gameCompletedRounds.length === 1
      ? gameCompletedRounds[0].roundNumber + 1
      : 1;
  }
}
