import {
  GameState,
  IGame,
  IRoundPlayerScore,
  RoundScoreType,
} from "src/app/shared/dtos/yaniv/game";
import { computeTotalScore } from "./score-helpers";

interface RoundResult {
  userId: string;
  scoreType: RoundScoreType;
}

interface IFullRoundPlayerScore {
  userId: string;
  roundScore: IRoundPlayerScore;
}

export function getGameMessage(game: IGame): string {
  if (game.state === GameState.COMPLETE) {
    const totalScoreMap = computeTotalScore(
      game.playerStates,
      game.roundScores
    );
    const roundScores: IFullRoundPlayerScore[] = Object.keys(totalScoreMap).map(
      (userId) => ({
        userId,
        roundScore: totalScoreMap[userId],
      })
    );
    const minScore = Math.min(...roundScores.map((x) => x.roundScore.score));
    const winners = roundScores.filter((x) => x.roundScore.score === minScore);
    const usernames = winners.map((x) => getUsername(game, x.userId));
    if (usernames.length === 1) {
      return `Game over. The winner is: ${usernames[0]}`;
    }
    return `Game over. The winners are: ${usernames.join(",")}`;
  }
  return "";
}

export function getRoundMessage(game: IGame): string {
  if (hasRoundMessage(game)) {
    const result = getLastRoundResult(game);
    const username = getUsername(game, result.userId);
    if (result.scoreType === RoundScoreType.ASAF) {
      return `ASAF! ${username} called yaniv but did not have the lowest score`;
    }
    return `YANIV! ${username} called yaniv and had the lowest score`;
  }
  return "";
}

export function getLastRoundResult(game: IGame): RoundResult {
  const lastRound = game.roundScores[game.roundScores.length - 1];
  const roundScores: IFullRoundPlayerScore[] = Object.keys(lastRound).map(
    (userId) => ({
      userId,
      roundScore: lastRound[userId],
    })
  );
  const yanivScores = roundScores.filter(
    (x) => x.roundScore.scoreType === RoundScoreType.YANIV
  );
  const asafScores = roundScores.filter(
    (x) => x.roundScore.scoreType === RoundScoreType.ASAF
  );
  if (asafScores.length === 1) {
    return { userId: asafScores[0].userId, scoreType: RoundScoreType.ASAF };
  }
  return { userId: yanivScores[0].userId, scoreType: RoundScoreType.YANIV };
}

export function getUsername(game: IGame, userId: string): string {
  return game.playerStates.filter((x) => x.userId.toString() === userId)[0]
    .username;
}

function hasRoundMessage(game: IGame): boolean {
  return (
    game.state === GameState.ROUND_COMPLETE || game.state === GameState.COMPLETE
  );
}
