import { expect } from "chai";
import {
  createTestCredentials,
  createTestUser,
  resetDatabaseBeforeEach,
} from "../../../test/test_helper";
import { CardRank, CardSuit } from "../../shared/dtos/yaniv/card";
import { NotFoundError, ValidationError } from "../shared/exceptions";
import { YanivGameDataService } from "./data/yaniv_game_data_service";
import { YanivGameService } from "./yaniv_game_service";
import {
  GameState,
  IGame,
  IGameActionRequest,
  IGameActionResponse,
  RoundScoreType,
} from "../../shared/dtos/yaniv/game";
import { createTestYanivRoundActiveGame } from "../../../test/yaniv_test_helper";

interface ITestPlayResult {
  error: Error;
  result: IGameActionResponse;
  game: IGame;
}

async function testPlay(
  userId: number,
  gameId: number,
  action: IGameActionRequest
): Promise<ITestPlayResult> {
  let error: Error;
  let game: IGame;
  let result: IGameActionResponse;
  try {
    result = await new YanivGameService().play(userId, gameId, action);
    game = await new YanivGameService().get(userId, gameId)
  } catch (e) {
    error = e;
  }
  return { result, game, error };
}

describe("YanivGameService", () => {
  resetDatabaseBeforeEach();

  describe("play", () => {
    it("throws a validation error if game not found", async () => {
      // arrange
      const userCreds = createTestCredentials("test");
      const userId = await createTestUser(userCreds);
      const gameId = 1;
      const action: IGameActionRequest = { callYaniv: true };

      // act
      const { error } = await testPlay(userId, gameId, action);

      // assert
      expect(error).to.be.instanceOf(NotFoundError);
      expect(error.message).to.eql(`Game does not exist with id: ${gameId}`);
    });

    it("throws a validation error if action is not to user", async () => {
      // arrange
      const {
        userIds: [, user2Id],
        gameId,
      } = await createTestYanivRoundActiveGame({
        playerCards: [[], []],
        cardsInDeck: [],
        cardsOnTopOfDiscardPile: [],
      });
      const action: IGameActionRequest = { callYaniv: true };

      // act
      const { error } = await testPlay(user2Id, gameId, action);

      // assert
      expect(error).to.be.instanceOf(ValidationError);
      expect(error.message).to.eql(
        'Validation errors: "Action is not to you."'
      );
    });

    describe("discard and pickup", () => {
      it("throws a validation error if discard contains multiple of the same card", async () => {
        // arrange
        const {
          userIds: [user1Id],
          gameId,
        } = await createTestYanivRoundActiveGame({
          playerCards: [
            [
              { rank: CardRank.ACE, suit: CardSuit.CLUBS },
              { rank: CardRank.ACE, suit: CardSuit.DIAMONDS },
            ],
            [],
          ],
          cardsInDeck: [],
          cardsOnTopOfDiscardPile: [],
        });
        const action: IGameActionRequest = {
          cardsDiscarded: [
            { rank: CardRank.ACE, suit: CardSuit.CLUBS },
            { rank: CardRank.ACE, suit: CardSuit.CLUBS },
          ],
        };

        // act
        const { error } = await testPlay(user1Id, gameId, action);

        // assert
        expect(error).to.be.instanceOf(ValidationError);
        expect(error.message).to.eql(
          'Validation errors: "Discard cannot contain duplicates."'
        );
      });

      it("throws a validation error if discarding a card not in the users hand", async () => {
        // arrange
        const {
          userIds: [user1Id],
          gameId,
        } = await createTestYanivRoundActiveGame({
          playerCards: [
            [
              { rank: CardRank.ACE, suit: CardSuit.CLUBS },
              { rank: CardRank.ACE, suit: CardSuit.DIAMONDS },
            ],
            [],
          ],
          cardsInDeck: [],
          cardsOnTopOfDiscardPile: [],
        });
        const action: IGameActionRequest = {
          cardsDiscarded: [{ rank: CardRank.ACE, suit: CardSuit.SPADES }],
        };

        // act
        const { error } = await testPlay(user1Id, gameId, action);

        // assert
        expect(error).to.be.instanceOf(ValidationError);
        expect(error.message).to.eql(
          'Validation errors: "Can only discard cards in your hand."'
        );
      });

      it("throws a validation error if invalid discard", async () => {
        // arrange
        const {
          userIds: [user1Id],
          gameId,
        } = await createTestYanivRoundActiveGame({
          playerCards: [
            [
              { rank: CardRank.ACE, suit: CardSuit.CLUBS },
              { rank: CardRank.TWO, suit: CardSuit.DIAMONDS },
            ],
            [],
          ],
          cardsInDeck: [],
          cardsOnTopOfDiscardPile: [],
        });
        const action: IGameActionRequest = {
          cardsDiscarded: [
            { rank: CardRank.ACE, suit: CardSuit.CLUBS },
            { rank: CardRank.TWO, suit: CardSuit.DIAMONDS },
          ],
        };

        // act
        const { error } = await testPlay(user1Id, gameId, action);

        // assert
        expect(error).to.be.instanceOf(ValidationError);
        expect(error.message).to.eql('Validation errors: "Invalid discard."');
      });

      it("throws a validation error if invalid pickup", async () => {
        // arrange
        const {
          userIds: [user1Id],
          gameId,
        } = await createTestYanivRoundActiveGame({
          playerCards: [
            [
              { rank: CardRank.ACE, suit: CardSuit.CLUBS },
              { rank: CardRank.TWO, suit: CardSuit.DIAMONDS },
            ],
            [],
          ],
          cardsInDeck: [],
          cardsOnTopOfDiscardPile: [
            { rank: CardRank.KING, suit: CardSuit.SPADES },
          ],
        });
        const action: IGameActionRequest = {
          cardsDiscarded: [{ rank: CardRank.TWO, suit: CardSuit.DIAMONDS }],
          cardPickedUp: { rank: CardRank.ACE, suit: CardSuit.SPADES },
        };

        // act
        const { error } = await testPlay(user1Id, gameId, action);

        // assert
        expect(error).to.be.instanceOf(ValidationError);
        expect(error.message).to.eql('Validation errors: "Invalid pickup."');
      });

      it("updates state appropriately when picking up from top of discard", async () => {
        // arrange
        const {
          userIds: [user1Id, user2Id],
          gameId,
        } = await createTestYanivRoundActiveGame({
          playerCards: [
            [
              { rank: CardRank.ACE, suit: CardSuit.CLUBS },
              { rank: CardRank.KING, suit: CardSuit.DIAMONDS },
            ],
            [],
          ],
          cardsInDeck: [],
          cardsOnTopOfDiscardPile: [
            { rank: CardRank.TWO, suit: CardSuit.SPADES },
          ],
        });
        const action: IGameActionRequest = {
          cardsDiscarded: [{ rank: CardRank.KING, suit: CardSuit.DIAMONDS }],
          cardPickedUp: { rank: CardRank.TWO, suit: CardSuit.SPADES },
        };

        // act
        const { game, error } = await testPlay(user1Id, gameId, action);

        // assert
        expect(error).to.be.undefined(error?.stack);
        expect(game.actionToUserId).to.eql(user2Id);
        expect(game.state).to.eql(GameState.ROUND_ACTIVE);
        expect(game.cardsOnTopOfDiscardPile).to.eql([
          { rank: CardRank.KING, suit: CardSuit.DIAMONDS },
        ]);
        expect(game.playerStates).to.eql([
          {
            cards: [
              {
                rank: CardRank.ACE,
                suit: CardSuit.CLUBS,
              },
              {
                rank: CardRank.TWO,
                suit: CardSuit.SPADES,
              },
            ],
            numberOfCards: 2,
            userId: user1Id,
            username: "test1",
          },
          {
            numberOfCards: 0,
            userId: user2Id,
            username: "test2",
          },
        ]);
      });

      it("updates state appropriately when picking up from deck", async () => {
        // arrange
        const {
          userIds: [user1Id, user2Id],
          gameId,
        } = await createTestYanivRoundActiveGame({
          playerCards: [
            [
              { rank: CardRank.ACE, suit: CardSuit.CLUBS },
              { rank: CardRank.KING, suit: CardSuit.DIAMONDS },
            ],
            [],
          ],
          cardsInDeck: [{ rank: CardRank.SEVEN, suit: CardSuit.HEARTS }],
          cardsOnTopOfDiscardPile: [
            { rank: CardRank.TWO, suit: CardSuit.SPADES },
          ],
        });
        const action: IGameActionRequest = {
          cardsDiscarded: [{ rank: CardRank.KING, suit: CardSuit.DIAMONDS }],
        };

        // act
        const { game, error } = await testPlay(user1Id, gameId, action);

        // assert
        expect(error).to.be.undefined(error?.stack);
        expect(game.actionToUserId).to.eql(user2Id);
        expect(game.state).to.eql(GameState.ROUND_ACTIVE);
        expect(game.cardsOnTopOfDiscardPile).to.eql([
          { rank: CardRank.KING, suit: CardSuit.DIAMONDS },
        ]);
        expect(game.playerStates).to.eql([
          {
            cards: [
              {
                rank: CardRank.ACE,
                suit: CardSuit.CLUBS,
              },
              {
                rank: CardRank.SEVEN,
                suit: CardSuit.HEARTS,
              },
            ],
            numberOfCards: 2,
            userId: user1Id,
            username: "test1",
          },
          {
            numberOfCards: 0,
            userId: user2Id,
            username: "test2",
          },
        ]);
        const updatedGame = await new YanivGameDataService().get(game.gameId);
        expect(updatedGame.cardsInDeck).to.eql([]);
      });
    });

    describe("call yaniv", () => {
      it("throws a validation error if total is above 7", async () => {
        // arrange
        const {
          userIds: [user1Id],
          gameId,
        } = await createTestYanivRoundActiveGame({
          playerCards: [
            [
              { rank: CardRank.ACE, suit: CardSuit.CLUBS },
              { rank: CardRank.SEVEN, suit: CardSuit.DIAMONDS },
            ],
            [{ rank: CardRank.TWO, suit: CardSuit.SPADES }],
            [
              { rank: CardRank.KING, suit: CardSuit.CLUBS },
              { rank: CardRank.EIGHT, suit: CardSuit.HEARTS },
            ],
          ],
          cardsInDeck: [],
          cardsOnTopOfDiscardPile: [],
        });
        const action: IGameActionRequest = {
          callYaniv: true,
        };

        // act
        const { error } = await testPlay(user1Id, gameId, action);

        // assert
        expect(error).to.be.instanceOf(ValidationError);
        expect(error.message).to.eql(
          'Validation errors: "Hand total must be less than or equal to 7 to call Yaniv."'
        );
      });

      it("records user score as YANIV if has lowest score and marks them to start the next round", async () => {
        // arrange
        const {
          userIds: [user1Id, user2Id, user3Id],
          gameId,
        } = await createTestYanivRoundActiveGame({
          playerCards: [
            [
              { rank: CardRank.ACE, suit: CardSuit.CLUBS },
              { rank: CardRank.THREE, suit: CardSuit.DIAMONDS },
            ],
            [
              { rank: CardRank.TWO, suit: CardSuit.SPADES },
              { rank: CardRank.SEVEN, suit: CardSuit.HEARTS },
            ],
            [
              { rank: CardRank.KING, suit: CardSuit.CLUBS },
              { rank: CardRank.EIGHT, suit: CardSuit.HEARTS },
            ],
          ],
          cardsInDeck: [],
          cardsOnTopOfDiscardPile: [],
        });
        const action: IGameActionRequest = {
          callYaniv: true,
        };

        // act
        const { game, error } = await testPlay(user1Id, gameId, action);

        // assert
        expect(error).to.be.undefined(error?.stack);
        expect(game.state).to.eql(GameState.ROUND_COMPLETE);
        expect(game.actionToUserId).to.eql(user1Id);
        expect(game.roundScores).to.eql([
          {
            [user1Id]: {
              score: 0,
              scoreType: RoundScoreType.YANIV,
            },
            [user2Id]: {
              score: 9,
              scoreType: RoundScoreType.DEFAULT,
            },
            [user3Id]: {
              score: 18,
              scoreType: RoundScoreType.DEFAULT,
            },
          },
        ]);
      });

      it("records user score as ASAF if does not have lowest score", async () => {
        // arrange
        const {
          userIds: [user1Id, user2Id, user3Id],
          gameId,
        } = await createTestYanivRoundActiveGame({
          playerCards: [
            [
              { rank: CardRank.ACE, suit: CardSuit.CLUBS },
              { rank: CardRank.THREE, suit: CardSuit.DIAMONDS },
            ],
            [{ rank: CardRank.TWO, suit: CardSuit.SPADES }],
            [
              { rank: CardRank.KING, suit: CardSuit.CLUBS },
              { rank: CardRank.EIGHT, suit: CardSuit.HEARTS },
            ],
          ],
          cardsInDeck: [],
          cardsOnTopOfDiscardPile: [],
        });
        const action: IGameActionRequest = {
          callYaniv: true,
        };

        // act
        const { game, error } = await testPlay(user1Id, gameId, action);

        // assert
        expect(error).to.be.undefined(error?.stack);
        expect(game.state).to.eql(GameState.ROUND_COMPLETE);
        expect(game.actionToUserId).to.eql(user2Id);
        expect(game.roundScores).to.eql([
          {
            [user1Id]: {
              score: 34,
              scoreType: RoundScoreType.ASAF,
            },
            [user2Id]: {
              score: 0,
              scoreType: RoundScoreType.YANIV,
            },
            [user3Id]: {
              score: 18,
              scoreType: RoundScoreType.DEFAULT,
            },
          },
        ]);
      });

      it("records user score as ASAF if tied for lowest score (two way tie)", async () => {
        // arrange
        const {
          userIds: [user1Id, user2Id, user3Id],
          gameId,
        } = await createTestYanivRoundActiveGame({
          playerCards: [
            [
              { rank: CardRank.ACE, suit: CardSuit.CLUBS },
              { rank: CardRank.THREE, suit: CardSuit.DIAMONDS },
            ],
            [{ rank: CardRank.FOUR, suit: CardSuit.SPADES }],
            [
              { rank: CardRank.KING, suit: CardSuit.CLUBS },
              { rank: CardRank.EIGHT, suit: CardSuit.HEARTS },
            ],
          ],
          cardsInDeck: [],
          cardsOnTopOfDiscardPile: [],
        });
        const action: IGameActionRequest = {
          callYaniv: true,
        };

        // act
        const { game, error } = await testPlay(user1Id, gameId, action);

        // assert
        expect(error).to.be.undefined(error?.stack);
        expect(game.state).to.eql(GameState.ROUND_COMPLETE);
        expect(game.actionToUserId).to.eql(user2Id);
        expect(game.roundScores).to.eql([
          {
            [user1Id]: {
              score: 34,
              scoreType: RoundScoreType.ASAF,
            },
            [user2Id]: {
              score: 0,
              scoreType: RoundScoreType.YANIV,
            },
            [user3Id]: {
              score: 18,
              scoreType: RoundScoreType.DEFAULT,
            },
          },
        ]);
      });

      it("records user score as ASAF if tied for lowest score (three way tie)", async () => {
        // arrange
        const {
          userIds: [user1Id, user2Id, user3Id, user4Id],
          gameId,
        } = await createTestYanivRoundActiveGame({
          playerCards: [
            [
              { rank: CardRank.ACE, suit: CardSuit.CLUBS },
              { rank: CardRank.THREE, suit: CardSuit.DIAMONDS },
            ],
            [{ rank: CardRank.FOUR, suit: CardSuit.SPADES }],
            [
              { rank: CardRank.TWO, suit: CardSuit.HEARTS },
              { rank: CardRank.TWO, suit: CardSuit.SPADES },
            ],
            [
              { rank: CardRank.KING, suit: CardSuit.CLUBS },
              { rank: CardRank.EIGHT, suit: CardSuit.HEARTS },
            ],
          ],
          cardsInDeck: [],
          cardsOnTopOfDiscardPile: [],
        });
        const action: IGameActionRequest = {
          callYaniv: true,
        };

        // act
        const { game, error } = await testPlay(user1Id, gameId, action);

        // assert
        expect(error).to.be.undefined(error?.stack);
        expect(game.state).to.eql(GameState.ROUND_COMPLETE);
        expect(game.actionToUserId).to.eql(user2Id);
        expect(game.roundScores).to.eql([
          {
            [user1Id]: {
              score: 34,
              scoreType: RoundScoreType.ASAF,
            },
            [user2Id]: {
              score: 0,
              scoreType: RoundScoreType.YANIV,
            },
            [user3Id]: {
              score: 0,
              scoreType: RoundScoreType.YANIV,
            },
            [user4Id]: {
              score: 18,
              scoreType: RoundScoreType.DEFAULT,
            },
          },
        ]);
      });
    });
  });
});
