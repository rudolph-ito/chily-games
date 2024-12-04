import { IPlayerState, IRoundScore } from "../../shared/dtos/rummikub/game";

export interface ITotalPlayerScore {
  score: number;
  isTotal: boolean;
}

export interface ITotalScore {
  [userId: string]: ITotalPlayerScore;
}

export function computeTotalScore(
  playerStates: IPlayerState[],
  roundScores: IRoundScore[]
): ITotalScore {
  const out: ITotalScore = {};
  playerStates.forEach((x) => {
    out[x.userId] = { score: 0, isTotal: true };
  });
  roundScores.forEach((roundScore) => {
    for (const userId in roundScore) {
      out[userId].score += roundScore[userId];
    }
  });
  return out;
}
