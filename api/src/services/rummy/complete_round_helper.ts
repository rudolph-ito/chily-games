import _ from "lodash";
import { ISerializedRummyGame } from "src/database/models/rummy_game";
import { CardRank, ICard } from "../../shared/dtos/card";
import { GameState } from "../../shared/dtos/rummy/game";

// Updates game state / completedRounds
export function completeRound(game: ISerializedRummyGame): void {
  const roundScores: Record<number, number> = {};
  game.players.forEach((player) => {
    let score = 0;
    player.cardsInHand.forEach((card) => (score -= getCardValue(card)));
    roundScores[player.userId] = score;
  });
  game.melds.forEach((meld) => {
    meld.elements.forEach((element) => {
      roundScores[element.userId] += getCardValue(element.card);
    });
  });
  const completedRound = game.players.map(({ userId }) => ({
    userId,
    score: roundScores[userId],
  }));
  const totalScores = _.clone(roundScores);
  game.completedRounds.forEach((playerScores) => {
    playerScores.forEach(({ userId, score }) => (totalScores[userId] += score));
  });
  const maxScore = Math.max(...Object.values(totalScores));
  game.completedRounds.push(completedRound);
  game.state =
    maxScore >= game.options.pointThreshold
      ? GameState.COMPLETE
      : GameState.ROUND_COMPLETE;
}

function getCardValue(card: ICard): number {
  if (card.isJoker) {
    return 15;
  }
  switch (card.rank) {
    case CardRank.TEN:
    case CardRank.JACK:
    case CardRank.QUEEN:
    case CardRank.KING:
      return 10;
    default:
      return 5;
  }
}
