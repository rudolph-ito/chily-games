import { CardRank, CardSuit } from "../../shared/dtos/card";

import {
  deserializeCard,
  serializeCard,
  standardDeckWithTwoJokers,
} from "./card_helpers";

describe("CardHelpers", () => {
  describe("serializeCard", () => {
    it("returns 0 for ace of clubs", () => {
      // arrange

      // act
      const result = serializeCard({
        rank: CardRank.ACE,
        suit: CardSuit.CLUBS,
      });

      // assert
      expect(result).toEqual(0);
    });

    it("returns 1 for two of clubs", () => {
      // arrange

      // act
      const result = serializeCard({
        rank: CardRank.TWO,
        suit: CardSuit.CLUBS,
      });

      // assert
      expect(result).toEqual(1);
    });

    it("returns 12 for king of clubs", () => {
      // arrange

      // act
      const result = serializeCard({
        rank: CardRank.KING,
        suit: CardSuit.CLUBS,
      });

      // assert
      expect(result).toEqual(12);
    });

    it("returns 13 for ace of diamonds", () => {
      // arrange

      // act
      const result = serializeCard({
        rank: CardRank.ACE,
        suit: CardSuit.DIAMONDS,
      });

      // assert
      expect(result).toEqual(13);
    });

    it("returns 52 + jokerNumber for joker", () => {
      // arrange

      // act
      const result = serializeCard({ isJoker: true, jokerNumber: 1 });

      // assert
      expect(result).toEqual(53);
    });
  });

  describe("deserializeCard", () => {
    it("returns ace of clubs for 0", () => {
      // arrange

      // act
      const result = deserializeCard(0);

      // assert
      expect(result).toEqual({ rank: CardRank.ACE, suit: CardSuit.CLUBS });
    });

    it("returns two of clubs for 1", () => {
      // arrange

      // act
      const result = deserializeCard(1);

      // assert
      expect(result).toEqual({ rank: CardRank.TWO, suit: CardSuit.CLUBS });
    });

    it("returns king of clubs for 12", () => {
      // arrange

      // act
      const result = deserializeCard(12);

      // assert
      expect(result).toEqual({ rank: CardRank.KING, suit: CardSuit.CLUBS });
    });

    it("returns ace of diamonds for 13", () => {
      // arrange

      // act
      const result = deserializeCard(13);

      // assert
      expect(result).toEqual({ rank: CardRank.ACE, suit: CardSuit.DIAMONDS });
    });

    it("returns joker for numbers greater than or equal to 52", () => {
      // arrange

      // act
      const result = deserializeCard(54);

      // assert
      expect(result).toEqual({ isJoker: true, jokerNumber: 2 });
    });
  });

  describe("standardDeckWithTwoJokers", () => {
    it("returns a list of 54 cards (standard deck and 2 jokers)", () => {
      // arrange

      // act
      const deck = standardDeckWithTwoJokers();

      // assert
      expect(deck.length).toEqual(54);
      expect(deck.filter((x) => x.suit === CardSuit.SPADES).length).toEqual(13);
      expect(deck.filter((x) => x.rank === CardRank.SEVEN).length).toEqual(4);
      expect(deck.filter((x) => x.isJoker).length).toEqual(2);
    });
  });
});
