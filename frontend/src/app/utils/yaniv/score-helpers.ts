import {
  IPlayerState,
  IRoundScore,
  RoundScoreType,
} from "../../shared/dtos/yaniv/game";

export function computeTotalScore(
  playerStates: IPlayerState[],
  roundScores: IRoundScore[]
): IRoundScore {
  const out: IRoundScore = {};
  playerStates.forEach((x) => {
    out[x.userId] = { scoreType: RoundScoreType.TOTAL, score: 0 };
  });
  roundScores.forEach((roundScore) => {
    for (const userId in roundScore) {
      out[userId].score += roundScore[userId].score;
    }
  });
  return out;
}
