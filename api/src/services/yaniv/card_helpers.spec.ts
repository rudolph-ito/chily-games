import { CardRank, CardSuit } from "../../shared/dtos/yaniv/card";
import { expect } from "chai";
import { deserializeCard, serializeCard } from "./card_helpers";

describe("YanivCardHelpers", () => {
  describe("serializeCard", () => {
    it("returns 0 for ace of clubs", () => {
      // arrange

      // act
      const result = serializeCard({
        rank: CardRank.ACE,
        suit: CardSuit.CLUBS,
      });

      // assert
      expect(result).to.eql(0);
    });

    it("returns 1 for two of clubs", () => {
      // arrange

      // act
      const result = serializeCard({
        rank: CardRank.TWO,
        suit: CardSuit.CLUBS,
      });

      // assert
      expect(result).to.eql(1);
    });

    it("returns 12 for king of clubs", () => {
      // arrange

      // act
      const result = serializeCard({
        rank: CardRank.KING,
        suit: CardSuit.CLUBS,
      });

      // assert
      expect(result).to.eql(12);
    });

    it("returns 13 for ace of diamonds", () => {
      // arrange

      // act
      const result = serializeCard({
        rank: CardRank.ACE,
        suit: CardSuit.DIAMONDS,
      });

      // assert
      expect(result).to.eql(13);
    });

    it("returns 52 for joken", () => {
      // arrange

      // act
      const result = serializeCard({ isJoker: true });

      // assert
      expect(result).to.eql(52);
    });
  });

  describe("deserializeCard", () => {
    it("returns ace of clubs for 0", () => {
      // arrange

      // act
      const result = deserializeCard(0);

      // assert
      expect(result).to.eql({ rank: CardRank.ACE, suit: CardSuit.CLUBS });
    });

    it("returns two of clubs for 1", () => {
      // arrange

      // act
      const result = deserializeCard(1);

      // assert
      expect(result).to.eql({ rank: CardRank.TWO, suit: CardSuit.CLUBS });
    });

    it("returns king of clubs for 12", () => {
      // arrange

      // act
      const result = deserializeCard(12);

      // assert
      expect(result).to.eql({ rank: CardRank.KING, suit: CardSuit.CLUBS });
    });

    it("returns ace of diamonds for 13", () => {
      // arrange

      // act
      const result = deserializeCard(13);

      // assert
      expect(result).to.eql({ rank: CardRank.ACE, suit: CardSuit.DIAMONDS });
    });

    it("returns joker for 52", () => {
      // arrange

      // act
      const result = deserializeCard(52);

      // assert
      expect(result).to.eql({ isJoker: true });
    });
  });
});
