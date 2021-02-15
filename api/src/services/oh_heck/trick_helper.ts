import _ from "lodash";
import { CardRank, CardSuit, ICard } from "../../shared/dtos/card";
import { ITrickPlayerCard } from "../../shared/dtos/oh_heck/game";
import { areCardsEqual } from "../shared/card_helpers";

export function validatePlay(
  cardsInHand: ICard[],
  currentTrick: ITrickPlayerCard[],
  cardPlayed: ICard
): null | string {
  const isCardInHand = cardsInHand.some((card) =>
    areCardsEqual(card, cardPlayed)
  );
  if (!isCardInHand) {
    return "Card is not in your hand.";
  }
  if (currentTrick.length > 0) {
    const initialCard = currentTrick[0].card;
    const canFollowSuit = cardsInHand.some(
      (card) => card.suit === initialCard.suit
    );
    if (canFollowSuit && cardPlayed.suit !== initialCard.suit) {
      return `You must follow suit of first card played (${initialCard.suit}) if you can.`;
    }
  }
  return null;
}

export function getTrickWinner(currentTrick: ITrickPlayerCard[]): number {
  const trumpPlayedCards = currentTrick.filter(
    (x) => x.card.suit === CardSuit.SPADES
  );
  if (trumpPlayedCards.length > 0) {
    return getHighestRank(trumpPlayedCards);
  }
  const initialSuit = currentTrick[0].card.suit;
  const cardsOfInitialSuit = currentTrick.filter(
    (x) => x.card.suit === initialSuit
  );
  return getHighestRank(cardsOfInitialSuit);
}

function getHighestRank(filteredTrick: ITrickPlayerCard[]): number {
  const maxPlayerCard = _.maxBy(filteredTrick, (x) =>
    getCardOhHeckRankValue(x.card)
  );
  if (maxPlayerCard == null) {
    throw new Error("Unexpectedly couldn't find a max");
  }
  return maxPlayerCard.userId;
}

const rankToOhHeckValue = {
  [CardRank.TWO]: 1,
  [CardRank.THREE]: 2,
  [CardRank.FOUR]: 3,
  [CardRank.FIVE]: 4,
  [CardRank.SIX]: 5,
  [CardRank.SEVEN]: 6,
  [CardRank.EIGHT]: 7,
  [CardRank.NINE]: 8,
  [CardRank.TEN]: 9,
  [CardRank.JACK]: 10,
  [CardRank.QUEEN]: 11,
  [CardRank.KING]: 12,
  [CardRank.ACE]: 13,
};

export function getCardOhHeckRankValue(card: ICard): number {
  if (card.rank == null) {
    throw new Error("Expected card rank to be defined");
  }
  return rankToOhHeckValue[card.rank];
}
