import { expect } from "chai";
import {
  createTestCredentials,
  createTestUser,
  resetDatabaseBeforeEach,
} from "../../../test/test_helper";
import { NotFoundError, ValidationError } from "../shared/exceptions";
import { RummikubGameDataService } from "./data/rummikub_game_data_service";
import { RummikubGameService } from "./rummikub_game_service";
import {
  GameState,
  IGame,
  IGameActionRequest,
  IGameActionResponse,
} from "../../shared/dtos/rummikub/game";
import { createTestRummikubRoundActiveGame } from "../../../test/rummikub_test_helper";
import { TileColor } from "../../shared/dtos/rummikub/tile";

interface ITestPlayResult {
  error?: Error;
  result?: IGameActionResponse;
  game?: IGame;
}

async function testPlay(
  userId: number,
  gameId: number,
  action: IGameActionRequest
): Promise<ITestPlayResult> {
  let error: Error | undefined;
  let game: IGame | undefined;
  let result: IGameActionResponse | undefined;
  try {
    await new RummikubGameService().play(userId, gameId, action);
    game = await new RummikubGameService().get(userId, gameId);
  } catch (e) {
    error = e;
  }
  return { result, game, error };
}

async function testPlayExpectError(
  userId: number,
  gameId: number,
  action: IGameActionRequest
): Promise<Error> {
  const { result, error } = await testPlay(userId, gameId, action);
  if (error == null) {
    throw new Error(
      `Expected error but didn't get one, result: ${JSON.stringify(result)}`
    );
  }
  return error;
}

async function testPlayExpectSuccess(
  userId: number,
  gameId: number,
  action: IGameActionRequest
): Promise<IGame> {
  const { error, game } = await testPlay(userId, gameId, action);
  if (error != null) {
    throw new Error(
      `Expected no error but got one, error: ${error.stack ?? error.message}`
    );
  }
  if (game == null) {
    throw new Error(`Expected game but is null`);
  }
  return game;
}

describe.only("RummikubGameService", () => {
  resetDatabaseBeforeEach();

  describe("play", () => {
    it("throws a validation error if game not found", async () => {
      // arrange
      const userCreds = createTestCredentials("test");
      const userId = await createTestUser(userCreds);
      const gameId = 1;
      const action: IGameActionRequest = { pickUpTile: true };

      // act
      const error = await testPlayExpectError(userId, gameId, action);

      // assert
      expect(error).to.be.instanceOf(NotFoundError);
      expect(error.message).to.eql(`Game does not exist with id: ${gameId}`);
    });

    it("throws a validation error if action is not to user", async () => {
      // arrange
      const {
        userIds: [, user2Id],
        gameId,
      } = await createTestRummikubRoundActiveGame({
        sets: [],
        playerTiles: [[], []],
        tilePool: [],
      });
      const action: IGameActionRequest = { pickUpTile: true };

      // act
      const error = await testPlayExpectError(user2Id, gameId, action);

      // assert
      expect(error).to.be.instanceOf(ValidationError);
      expect(error.message).to.eql(
        'Validation errors: "Action is not to you."'
      );
    });

    describe("initial meld", () => {
      it("updates state appropriately if valid play", async () => {
        // arrange
        const {
          userIds: [user1Id, user2Id],
          gameId,
        } = await createTestRummikubRoundActiveGame({
          sets: [],
          playerTiles: [
            [
              { rank: 10, color: TileColor.BLACK },
              { rank: 10, color: TileColor.RED },
              { rank: 10, color: TileColor.BLUE },
              { rank: 5, color: TileColor.YELLOW },
            ],
            [],
          ],
          tilePool: [],
        });
        const action: IGameActionRequest = {
          initialMeld: [
            [
              { rank: 10, color: TileColor.BLACK },
              { rank: 10, color: TileColor.RED },
              { rank: 10, color: TileColor.BLUE },
            ],
          ],
        };

        // act
        const game = await testPlayExpectSuccess(user1Id, gameId, action);

        // assert
        expect(game.actionToUserId).to.eql(user2Id);
        expect(game.state).to.eql(GameState.ROUND_ACTIVE);
        expect(game.sets).to.eql([
          [
            { rank: 10, color: TileColor.BLACK },
            { rank: 10, color: TileColor.RED },
            { rank: 10, color: TileColor.BLUE },
          ],
        ]);
        expect(game.playerStates).to.eql([
          {
            tiles: [{ rank: 5, color: TileColor.YELLOW }],
            numberOfTiles: 1,
            hasPlayedInitialMeld: true,
            userId: user1Id,
            displayName: "test1",
          },
          {
            tiles: [],
            numberOfTiles: 0,
            hasPlayedInitialMeld: false,
            userId: user2Id,
            displayName: "test2",
          },
        ]);
      });
    });
  });

  describe("rearrange tiles", () => {
    it("throws a validation error if player is not in game", async () => {
      // arrange
      const { gameId } = await createTestRummikubRoundActiveGame({
        sets: [],
        playerTiles: [[], []],
        tilePool: [],
      });
      const user3Id = await createTestUser(createTestCredentials("user3"));

      // act
      let error: Error | null = null;
      try {
        await new RummikubGameService().rearrangeTiles(user3Id, gameId, []);
      } catch (e) {
        error = e;
      }

      // assert
      expect(error).to.be.instanceOf(ValidationError);
      expect(error?.message).to.eql(
        'Validation errors: "You are not a player in this game."'
      );
    });

    it("throws a validation error if player attempts to add a card", async () => {
      // arrange
      const {
        userIds: [user1Id],
        gameId,
      } = await createTestRummikubRoundActiveGame({
        sets: [],
        playerTiles: [[{ rank: 1, color: TileColor.BLACK }], []],
        tilePool: [],
      });

      // act
      let error: Error | null = null;
      try {
        await new RummikubGameService().rearrangeTiles(user1Id, gameId, [
          { rank: 1, color: TileColor.BLACK },
          { rank: 1, color: TileColor.RED },
        ]);
      } catch (e) {
        error = e;
      }

      // assert
      expect(error).to.be.instanceOf(ValidationError);
      expect(error?.message).to.eql(
        'Validation errors: "Rearranged cards are not equivalent to cards in hand."'
      );
    });

    it("throws a validation error if player attempts to remove a card", async () => {
      // arrange
      const {
        userIds: [user1Id],
        gameId,
      } = await createTestRummikubRoundActiveGame({
        sets: [],
        playerTiles: [
          [
            { rank: 1, color: TileColor.BLACK },
            { rank: 1, color: TileColor.RED },
          ],
          [],
        ],
        tilePool: [],
      });

      // act
      let error: Error | null = null;
      try {
        await new RummikubGameService().rearrangeTiles(user1Id, gameId, [
          { rank: 1, color: TileColor.BLACK },
        ]);
      } catch (e) {
        error = e;
      }

      // assert
      expect(error).to.be.instanceOf(ValidationError);
      expect(error?.message).to.eql(
        'Validation errors: "Rearranged cards are not equivalent to cards in hand."'
      );
    });

    it("succeeds if passed in cards are equivalent to existing cards", async () => {
      // arrange
      const {
        userIds: [user1Id, user2Id],
        gameId,
      } = await createTestRummikubRoundActiveGame({
        sets: [],
        playerTiles: [
          [
            { rank: 1, color: TileColor.BLACK },
            { rank: 1, color: TileColor.RED },
          ],
          [{ rank: 2, color: TileColor.BLUE }],
        ],
        tilePool: [],
      });

      // act
      await new RummikubGameService().rearrangeTiles(user1Id, gameId, [
        { rank: 1, color: TileColor.RED },
        { rank: 1, color: TileColor.BLACK },
      ]);

      // assert
      const updatedGame = await new RummikubGameDataService().get(gameId);
      expect(updatedGame.players).to.eql([
        {
          userId: user1Id,
          hasPlayedInitialMeld: false,
          tiles: [
            { rank: 1, color: TileColor.RED },
            { rank: 1, color: TileColor.BLACK },
          ],
        },
        {
          userId: user2Id,
          hasPlayedInitialMeld: false,
          tiles: [{ rank: 2, color: TileColor.BLUE }],
        },
      ]);
    });
  });
});
