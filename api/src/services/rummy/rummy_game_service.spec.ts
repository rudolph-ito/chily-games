import { createTestRummyGame } from "../../../test/rummy_test_helper";
import { expect } from "chai";
import {
  IGame,
  IPickupInput,
  IPickupOutput,
  GameState
} from "../../../../shared/dtos/rummy/game";
import {
  createTestCredentials,
  createTestUser,
  resetDatabaseBeforeEach,
} from "../../../test/test_helper";
import { NotFoundError, ValidationError } from "../shared/exceptions";
import { RummyGameService } from "./rummy_game_service";
import { CardRank, CardSuit } from "../../../../shared/dtos/card";

interface ITestPlayResult {
  error?: Error;
  result?: IPickupOutput;
  game?: IGame;
}

interface ITestPlaySuccessResult {
  result: IPickupOutput;
  game: IGame;
}

async function testPickup(
  userId: number,
  gameId: number,
  action: IPickupInput
): Promise<ITestPlayResult> {
  let error: Error | undefined;
  let game: IGame | undefined;
  let result: IPickupOutput | undefined;
  try {
    result = await new RummyGameService().pickup(userId, gameId, action);
    game = await new RummyGameService().get(userId, gameId);
  } catch (e) {
    error = e;
  }
  return { result, game, error };
}

async function testPickupExpectError(
  userId: number,
  gameId: number,
  input: IPickupInput
): Promise<Error> {
  const { result, error } = await testPickup(userId, gameId, input);
  if (error == null) {
    throw new Error(
      `Expected error but didn't get one, result: ${JSON.stringify(result)}`
    );
  }
  return error;
}

async function testPickupExpectSuccess(
  userId: number,
  gameId: number,
  input: IPickupInput
): Promise<ITestPlaySuccessResult> {
  const { result, game, error } = await testPickup(userId, gameId, input);
  if (result == null || game == null) {
    throw new Error(
      `Expected no error but got one, result: ${error}`
    );
  }
  return { result, game };
}

describe("RummyGameService", () => {
  resetDatabaseBeforeEach();

  describe("pickup", () => {
    it("throws a validation error if game not found", async () => {
      // arrange
      const userCreds = createTestCredentials("test");
      const userId = await createTestUser(userCreds);
      const gameId = 1;
      const input: IPickupInput = {};

      // act
      const error = await testPickupExpectError(userId, gameId, input);

      // assert
      expect(error).to.be.instanceOf(NotFoundError);
      expect(error.message).to.eql(`Game does not exist with id: ${gameId}`);
    });

    it("throws a validation error if action not to you", async () => {
      // arrange
      const {
        userIds: [, user2Id],
        gameId,
      } = await createTestRummyGame({
        playerCards: [[], []],
      });
      const input: IPickupInput = {};

      // act
      const error = await testPickupExpectError(user2Id, gameId, input);

      // assert
      expect(error).to.be.instanceOf(ValidationError);
      expect(error.message).to.eql(
        'Validation errors: "Action is not to you"'
      );
    });

    it("throws a validation error if not in correct state for pickup", async () => {
      // arrange
      const {
        userIds: [user1Id],
        gameId,
      } = await createTestRummyGame({
        playerCards: [[], []],
        state: GameState.MELD_OR_DISCARD,
      });
      const input: IPickupInput = {};

      // act
      const error = await testPickupExpectError(user1Id, gameId, input);

      // assert
      expect(error).to.be.instanceOf(ValidationError);
      expect(error.message).to.eql(
        'Validation errors: "Invalid state to pickup"'
      );
    });

    it("throws a validation error if pickup is invalid", async () => {
      // arrange
      const {
        userIds: [user1Id],
        gameId,
      } = await createTestRummyGame({
        playerCards: [[], []],
      });
      const input: IPickupInput = {
        pickup: {suit: CardSuit.CLUBS, rank: CardRank.TWO}
      };

      // act
      const error = await testPickupExpectError(user1Id, gameId, input);

      // assert
      expect(error).to.be.instanceOf(ValidationError);
      expect(error.message).to.eql(
        'Validation errors: "Invalid pickup. Should be null or card from one of the discard piles"'
      );
    });

    it("throws a validation error if deep meld is invalid", async () => {
      // arrange
      const {
        userIds: [user1Id],
        gameId,
      } = await createTestRummyGame({
        playerCards: [[{suit: CardSuit.CLUBS, rank: CardRank.THREE}], []],
        discardState: {
          piles: [[{suit: CardSuit.CLUBS, rank: CardRank.TWO}, {suit: CardSuit.SPADES, rank: CardRank.JACK},]],
        }
      });
      const input: IPickupInput = {
        pickup: {suit: CardSuit.CLUBS, rank: CardRank.TWO},
        deepPickupMeld: {
          cards:[
            {suit: CardSuit.CLUBS, rank: CardRank.TWO},
            {suit: CardSuit.CLUBS, rank: CardRank.THREE},
          ]
        }
      };

      // act
      const error = await testPickupExpectError(user1Id, gameId, input);

      // assert
      expect(error).to.be.instanceOf(ValidationError);
      expect(error.message).to.eql(
        'Validation errors: "Invalid meld"'
      );
    });

    it("picks up from deck if no pickup provided", async () => {
      // arrange
      const {
        userIds: [user1Id],
        gameId,
      } = await createTestRummyGame({
        playerCards: [[], []],
        cardsInDeck: [{suit: CardSuit.CLUBS, rank: CardRank.TWO}],
      });
      const input: IPickupInput = {};

      // act
      const { result, game } = await testPickupExpectSuccess(user1Id, gameId, input);

      // assert
      expect(result).to.eql({
        event: {
          actionToUserId: user1Id,
          input,
          updatedGameState: GameState.MELD_OR_DISCARD,
          userId: user1Id,
        },
        cardPickedUpFromDeck: {suit: CardSuit.CLUBS, rank: CardRank.TWO}
      });
      expect(game.cardsInDeck).to.eql([])
      expect(game.playerStates[0].cardsInHand).to.eql([{suit: CardSuit.CLUBS, rank: CardRank.TWO}])
    });

    it("picks up from discard pile (no deep meld) if valid", async () => {
      // arrange
      const {
        userIds: [user1Id],
        gameId,
      } = await createTestRummyGame({
        playerCards: [[], []],
        discardState: {
          piles: [[{suit: CardSuit.CLUBS, rank: CardRank.TWO}]],
        }
      });
      const input: IPickupInput = {
        pickup: {suit: CardSuit.CLUBS, rank: CardRank.TWO}
      };

      // act
      const { result, game } = await testPickupExpectSuccess(user1Id, gameId, input);

      // assert
      expect(result).to.eql({
        event: {
          actionToUserId: user1Id,
          input,
          updatedGameState: GameState.MELD_OR_DISCARD,
          userId: user1Id,
        },
      });
      expect(game.discardState.piles).to.eql([[]])
      expect(game.playerStates[0].cardsInHand).to.eql([{suit: CardSuit.CLUBS, rank: CardRank.TWO}])
    });

    it("picks up from discard pile (with deep meld) if valid", async () => {
      // arrange
      const {
        userIds: [user1Id],
        gameId,
      } = await createTestRummyGame({
        playerCards: [
          [
            {suit: CardSuit.CLUBS, rank: CardRank.THREE},
            {suit: CardSuit.CLUBS, rank: CardRank.FOUR},
          ],
          []
        ],
        discardState: {
          piles: [[
            {suit: CardSuit.HEARTS, rank: CardRank.EIGHT},
            {suit: CardSuit.CLUBS, rank: CardRank.FIVE},
            {suit: CardSuit.CLUBS, rank: CardRank.SIX},
            {suit: CardSuit.SPADES, rank: CardRank.JACK},
          ]],
        }
      });
      const input: IPickupInput = {
        pickup: {suit: CardSuit.CLUBS, rank: CardRank.FIVE},
        deepPickupMeld: {
          cards:[
            {suit: CardSuit.CLUBS, rank: CardRank.THREE},
            {suit: CardSuit.CLUBS, rank: CardRank.FOUR},
            {suit: CardSuit.CLUBS, rank: CardRank.FIVE},
            {suit: CardSuit.CLUBS, rank: CardRank.SIX},
          ]
        }
      };

      // act
      const { result, game } = await testPickupExpectSuccess(user1Id, gameId, input);

      // assert
      expect(result).to.eql({
        event: {
          actionToUserId: user1Id,
          input,
          updatedGameState: GameState.MELD_OR_DISCARD,
          userId: user1Id,
        },
      });
      expect(game.discardState.piles).to.eql([[{suit: CardSuit.HEARTS, rank: CardRank.EIGHT},]])
      expect(game.playerStates[0].cardsInHand).to.eql([{suit: CardSuit.SPADES, rank: CardRank.JACK}])
      expect(game.melds).to.eql([
        {
          id: 1,
          elements: [
            { userId: user1Id, card: {suit: CardSuit.CLUBS, rank: CardRank.THREE} },
            { userId: user1Id, card: {suit: CardSuit.CLUBS, rank: CardRank.FOUR} },
            { userId: user1Id, card: {suit: CardSuit.CLUBS, rank: CardRank.FIVE} },
            { userId: user1Id, card: {suit: CardSuit.CLUBS, rank: CardRank.SIX} }
          ]
        }
      ])
    });
  });
});
