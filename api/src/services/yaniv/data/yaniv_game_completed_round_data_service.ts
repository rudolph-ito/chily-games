import { YanivGameCompletedRound } from "../../../database/models";
import { ISerializedYanivGameCompletedRound } from "../../../database/models/yaniv_game_completed_round";
import { IRoundScore } from "../../../shared/dtos/yaniv/game";

export interface IYanivGameCompletedRoundDataService {
  createForRound: (
    gameId: number,
    roundNumber: number,
    roundScore: IRoundScore
  ) => Promise<void>;
  getAllForGame: (
    gameId: number
  ) => Promise<ISerializedYanivGameCompletedRound[]>;
}

export class YanivGameCompletedRoundDataService
  implements IYanivGameCompletedRoundDataService {
  async createForRound(
    gameId: number,
    roundNumber: number,
    roundScore: IRoundScore
  ): Promise<void> {
    for (const userId in roundScore) {
      const playerScore = roundScore[userId];
      const gameCompletedRound = YanivGameCompletedRound.build({
        gameId,
        roundNumber,
        userId,
        score: playerScore.score,
        scoreType: playerScore.scoreType,
      });
      await gameCompletedRound.save();
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
}
