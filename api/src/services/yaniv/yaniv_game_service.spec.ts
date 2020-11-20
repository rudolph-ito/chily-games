import { expect } from "chai";
import {
  createTestCredentials,
  createTestUser,
  resetDatabaseBeforeEach,
} from "../../../test/test_helper";
import { CardRank, CardSuit, ICard } from "../../shared/dtos/yaniv/card";
import { NotFoundError, ValidationError } from "../shared/exceptions";
import { YanivGameDataService } from "./data/yaniv_game_data_service";
import { YanivGameService } from "./yaniv_game_service";
import bluebird from "bluebird";
import { YanivGamePlayerDataService } from "./data/yaniv_game_player_data_service";
import {
  GameState,
  IGame,
  IGameActionRequest,
} from "../../shared/dtos/yaniv/game";

interface ITestGameOptions {
  playerCards: ICard[][];
  cardsOnTopOfDiscardPile: ICard[];
  cardsInDeck: ICard[];
}

interface ITestGame {
  userIds: number[];
  gameId: number;
}

async function createTestGame(options: ITestGameOptions): Promise<ITestGame> {
  const gameService = new YanivGameService();
  const gameDataService = new YanivGameDataService();
  const gamePlayerDataService = new YanivGamePlayerDataService();
  const userIds = await bluebird.map(options.playerCards, async (_, index) => {
    const userCreds = createTestCredentials(`test${index}`);
    return await createTestUser(userCreds);
  });
  const game = await gameService.create(userIds[0], { playTo: 100 });
  await bluebird.map(
    userIds.slice(1),
    async (userId) => await gameService.join(userId, game.gameId)
  );
  const playerStates = await gamePlayerDataService.getAllForGame(game.gameId);
  playerStates.forEach(
    (x, index) => (x.cardsInHand = options.playerCards[index])
  );
  await gamePlayerDataService.updateAll(playerStates);
  await gameDataService.update(game.gameId, {
    state: GameState.ROUND_ACTIVE,
    actionToUserId: userIds[0],
    cardsBuriedInDiscardPile: [],
    cardsOnTopOfDiscardPile: options.cardsOnTopOfDiscardPile,
    cardsInDeck: options.cardsInDeck,
  });
  return { userIds, gameId: game.gameId };
}

interface ITestPlayResult {
  error: Error;
  game: IGame;
}

async function testPlay(
  userId: number,
  gameId: number,
  action: IGameActionRequest
): Promise<ITestPlayResult> {
  let error: Error;
  let game: IGame;
  try {
    game = await new YanivGameService().play(userId, gameId, action);
  } catch (e) {
    error = e;
  }
  return { game, error };
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
      } = await createTestGame({
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
        } = await createTestGame({
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
        } = await createTestGame({
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
        } = await createTestGame({
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
        } = await createTestGame({
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
        } = await createTestGame({
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
          },
          {
            numberOfCards: 0,
            userId: user2Id,
          },
        ]);
      });

      it("updates state appropriately when picking up from deck", async () => {
        // arrange
        const {
          userIds: [user1Id, user2Id],
          gameId,
        } = await createTestGame({
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
          },
          {
            numberOfCards: 0,
            userId: user2Id,
          },
        ]);
        const updatedGame = await new YanivGameDataService().get(game.gameId);
        expect(updatedGame.cardsInDeck).to.eql([]);
      });
    });

    describe("call yaniv", () => {
      // it("records user score as YANIV if has lowest score", () => {
      // })
      // it("records user score as ASAF if tied for lowest score (two way tie)", () => {
      // })
      // it("records user score as ASAF if tied for lowest score (three way tie)", () => {
      // })
      // it("records user score as ASAF if does not have lowest score", () => {
      // })
    });
  });
});
