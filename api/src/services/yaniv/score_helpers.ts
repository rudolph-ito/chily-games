import { valueOrDefault } from "../../shared/utilities/value_checker";
import { CardRank, ICard } from "../../shared/dtos/card";

const rankToScore = {
  [CardRank.ACE]: 1,
  [CardRank.TWO]: 2,
  [CardRank.THREE]: 3,
  [CardRank.FOUR]: 4,
  [CardRank.FIVE]: 5,
  [CardRank.SIX]: 6,
  [CardRank.SEVEN]: 7,
  [CardRank.EIGHT]: 8,
  [CardRank.NINE]: 9,
  [CardRank.TEN]: 10,
  [CardRank.JACK]: 10,
  [CardRank.QUEEN]: 10,
  [CardRank.KING]: 10,
};

export function getCardsScore(cards: ICard[]): number {
  return cards.reduce((sum: number, card: ICard) => {
    if (valueOrDefault(card.isJoker, false)) {
      return sum;
    }
    if (card.rank == null) {
      throw new Error("Card missing rank");
    }
    return sum + rankToScore[card.rank];
  }, 0);
}
