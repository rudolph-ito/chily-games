export enum CardRank {
  ACE = "ace",
  TWO = "2",
  THREE = "3",
  FOUR = "4",
  FIVE = "5",
  SIX = "6",
  SEVEN = "7",
  EIGHT = "8",
  NINE = "9",
  TEN = "10",
  JACK = "jack",
  QUEEN = "queen",
  KING = "king",
}

export enum CardSuit {
  CLUBS = "clubs",
  DIAMONDS = "diamonds",
  HEARTS = "hearts",
  SPADES = "spades",
}

export interface ICard {
  isJoker?: boolean;
  jokerNumber?: number;
  rank?: CardRank;
  suit?: CardSuit;
}
