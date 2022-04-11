import { createTestRummyGame } from "../../../test/rummy_test_helper";
import { expect } from "chai";
import {
  IGame,
  IPickupEvent,
  IPickupInput,
} from "../../../../shared/dtos/rummy/game";
import {
  createTestCredentials,
  createTestUser,
  resetDatabaseBeforeEach,
} from "../../../test/test_helper";
import { NotFoundError, ValidationError } from "../shared/exceptions";
import { RummyGameService } from "./rummy_game_service";

interface ITestPlayResult {
  error?: Error;
  result?: IPickupEvent;
  game?: IGame;
}

async function testPickup(
  userId: number,
  gameId: number,
  action: IPickupInput
): Promise<ITestPlayResult> {
  let error: Error | undefined;
  let game: IGame | undefined;
  let result: IPickupEvent | undefined;
  try {
    await new RummyGameService().pickup(userId, gameId, action);
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
        'Validation errors: "Action is not to you."'
      );
    });
  });
});
