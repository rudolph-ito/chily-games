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

describe("RummikubGameService", () => {
  resetDatabaseBeforeEach();

  describe("play", () => {
    it("throws a validation error if game not found", async () => {
      // arrange
      const userCreds = createTestCredentials("test");
      const userId = await createTestUser(userCreds);
      const gameId = 1;
      const action: IGameActionRequest = { pickUpTileOrPass: true };

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
      const action: IGameActionRequest = { pickUpTileOrPass: true };

      // act
      const error = await testPlayExpectError(user2Id, gameId, action);

      // assert
      expect(error).to.be.instanceOf(ValidationError);
      expect(error.message).to.eql(
        'Validation errors: "Action is not to you."'
      );
    });

    describe("initial meld", () => {
      it("throws a validation error if includes tiles not in user hand", async () => {
        // Arrange
        const {
          userIds: [user1Id],
          gameId,
        } = await createTestRummikubRoundActiveGame({
          sets: [],
          playerTiles: [
            [
              { rank: 10, color: TileColor.BLACK },
              { rank: 10, color: TileColor.RED },
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
        const error = await testPlayExpectError(user1Id, gameId, action);

        // assert
        expect(error).to.be.instanceOf(ValidationError);
        expect(error.message).to.eql(
          'Validation errors: "Initial meld: includes a tile not in hand."'
        );
      });

      it("throws a validation error if invalid set", async () => {
        // Arrange
        const {
          userIds: [user1Id],
          gameId,
        } = await createTestRummikubRoundActiveGame({
          sets: [],
          playerTiles: [
            [
              { rank: 10, color: TileColor.BLACK },
              { rank: 10, color: TileColor.RED },
              { rank: 11, color: TileColor.BLUE },
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
              { rank: 11, color: TileColor.BLUE },
            ],
          ],
        };

        // act
        const error = await testPlayExpectError(user1Id, gameId, action);

        // assert
        expect(error).to.be.instanceOf(ValidationError);
        expect(error.message).to.eql(
          'Validation errors: "Initial meld: a set is invalid."'
        );
      });

      it("throws a validation error if total is less than 30", async () => {
        // Arrange
        const {
          userIds: [user1Id],
          gameId,
        } = await createTestRummikubRoundActiveGame({
          sets: [],
          playerTiles: [
            [
              { rank: 9, color: TileColor.BLACK },
              { rank: 9, color: TileColor.RED },
              { rank: 9, color: TileColor.BLUE },
              { rank: 5, color: TileColor.YELLOW },
            ],
            [],
          ],
          tilePool: [],
        });
        const action: IGameActionRequest = {
          initialMeld: [
            [
              { rank: 9, color: TileColor.BLACK },
              { rank: 9, color: TileColor.RED },
              { rank: 9, color: TileColor.BLUE },
            ],
          ],
        };

        // act
        const error = await testPlayExpectError(user1Id, gameId, action);

        // assert
        expect(error).to.be.instanceOf(ValidationError);
        expect(error.message).to.eql(
          'Validation errors: "Initial meld: tile score must be at least 30."'
        );
      });

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
            passedLastTurn: false,
            userId: user1Id,
            displayName: "test1",
          },
          {
            tiles: [],
            numberOfTiles: 0,
            hasPlayedInitialMeld: false,
            passedLastTurn: false,
            userId: user2Id,
            displayName: "test2",
          },
        ]);
      });
    });

    describe("update sets", () => {
      it("throws a validation error if user has not played initial meld", async () => {
        // Arrange
        const {
          userIds: [user1Id],
          gameId,
        } = await createTestRummikubRoundActiveGame({
          sets: [
            [
              { rank: 10, color: TileColor.YELLOW },
              { rank: 10, color: TileColor.RED },
              { rank: 10, color: TileColor.BLUE },
            ],
          ],
          playerTiles: [
            [
              { rank: 10, color: TileColor.BLACK },
              { rank: 1, color: TileColor.RED },
            ],
            [],
          ],
          playerHasPlayedInitialMeld: [false, true],
          tilePool: [],
        });
        const action: IGameActionRequest = {
          updateSets: {
            sets: [
              [
                { rank: 10, color: TileColor.YELLOW },
                { rank: 10, color: TileColor.RED },
                { rank: 10, color: TileColor.BLUE },
                { rank: 10, color: TileColor.BLACK },
              ],
            ],
            tilesAdded: [{ rank: 10, color: TileColor.BLACK }],
          },
        };

        // act
        const error = await testPlayExpectError(user1Id, gameId, action);

        // assert
        expect(error).to.be.instanceOf(ValidationError);
        expect(error.message).to.eql(
          'Validation errors: "Update sets: must first play initial meld."'
        );
      });

      it("throws a validation error if includes tile not in user hand", async () => {
        // Arrange
        const {
          userIds: [user1Id],
          gameId,
        } = await createTestRummikubRoundActiveGame({
          sets: [
            [
              { rank: 10, color: TileColor.YELLOW },
              { rank: 10, color: TileColor.RED },
              { rank: 10, color: TileColor.BLUE },
            ],
          ],
          playerTiles: [
            [
              { rank: 2, color: TileColor.BLACK },
              { rank: 1, color: TileColor.RED },
            ],
            [],
          ],
          playerHasPlayedInitialMeld: [true, true],
          tilePool: [],
        });
        const action: IGameActionRequest = {
          updateSets: {
            sets: [
              [
                { rank: 10, color: TileColor.YELLOW },
                { rank: 10, color: TileColor.RED },
                { rank: 10, color: TileColor.BLUE },
                { rank: 10, color: TileColor.BLACK },
              ],
            ],
            tilesAdded: [{ rank: 10, color: TileColor.BLACK }],
          },
        };

        // act
        const error = await testPlayExpectError(user1Id, gameId, action);

        // assert
        expect(error).to.be.instanceOf(ValidationError);
        expect(error.message).to.eql(
          'Validation errors: "Update sets: includes a tile not in hand."'
        );
      });

      it("throws a validation error if updated sets are not existing sets plus tiles added", async () => {
        // Arrange
        const {
          userIds: [user1Id],
          gameId,
        } = await createTestRummikubRoundActiveGame({
          sets: [
            [
              { rank: 10, color: TileColor.YELLOW },
              { rank: 10, color: TileColor.RED },
              { rank: 10, color: TileColor.BLUE },
            ],
          ],
          playerTiles: [
            [
              { rank: 10, color: TileColor.BLACK },
              { rank: 1, color: TileColor.RED },
            ],
            [],
          ],
          playerHasPlayedInitialMeld: [true, true],
          tilePool: [],
        });
        const action: IGameActionRequest = {
          updateSets: {
            sets: [
              [
                { rank: 10, color: TileColor.YELLOW },
                { rank: 10, color: TileColor.RED },
                { rank: 10, color: TileColor.BLACK },
              ],
            ],
            tilesAdded: [{ rank: 10, color: TileColor.BLACK }],
          },
        };

        // act
        const error = await testPlayExpectError(user1Id, gameId, action);

        // assert
        expect(error).to.be.instanceOf(ValidationError);
        expect(error.message).to.eql(
          'Validation errors: "Update sets: tiles in updated sets are not equal to existing sets plus tiles added."'
        );
      });

      it("throws a validation error if set is invalid", async () => {
        // Arrange
        const {
          userIds: [user1Id],
          gameId,
        } = await createTestRummikubRoundActiveGame({
          sets: [
            [
              { rank: 10, color: TileColor.YELLOW },
              { rank: 10, color: TileColor.RED },
              { rank: 10, color: TileColor.BLUE },
            ],
          ],
          playerTiles: [
            [
              { rank: 1, color: TileColor.BLACK },
              { rank: 2, color: TileColor.RED },
              { rank: 3, color: TileColor.BLACK },
            ],
            [],
          ],
          playerHasPlayedInitialMeld: [true, true],
          tilePool: [],
        });
        const action: IGameActionRequest = {
          updateSets: {
            sets: [
              [
                { rank: 10, color: TileColor.YELLOW },
                { rank: 10, color: TileColor.RED },
                { rank: 10, color: TileColor.BLUE },
              ],
              [
                { rank: 1, color: TileColor.BLACK },
                { rank: 2, color: TileColor.RED },
                { rank: 3, color: TileColor.BLACK },
              ],
            ],
            tilesAdded: [
              { rank: 1, color: TileColor.BLACK },
              { rank: 2, color: TileColor.RED },
              { rank: 3, color: TileColor.BLACK },
            ],
          },
        };

        // act
        const error = await testPlayExpectError(user1Id, gameId, action);

        // assert
        expect(error).to.be.instanceOf(ValidationError);
        expect(error.message).to.eql(
          'Validation errors: "Update sets: a set is invalid."'
        );
      });

      it("updates state appropriately if valid play (round active)", async () => {
        // Arrange
        const {
          userIds: [user1Id, user2Id],
          gameId,
        } = await createTestRummikubRoundActiveGame({
          sets: [
            [
              { rank: 10, color: TileColor.YELLOW },
              { rank: 10, color: TileColor.RED },
              { rank: 10, color: TileColor.BLUE },
            ],
          ],
          playerTiles: [
            [
              { rank: 10, color: TileColor.BLACK },
              { rank: 1, color: TileColor.RED },
            ],
            [],
          ],
          playerHasPlayedInitialMeld: [true, true],
          tilePool: [],
        });
        const action: IGameActionRequest = {
          updateSets: {
            sets: [
              [
                { rank: 10, color: TileColor.YELLOW },
                { rank: 10, color: TileColor.RED },
                { rank: 10, color: TileColor.BLUE },
                { rank: 10, color: TileColor.BLACK },
              ],
            ],
            tilesAdded: [{ rank: 10, color: TileColor.BLACK }],
          },
        };

        // act
        const game = await testPlayExpectSuccess(user1Id, gameId, action);

        // assert
        expect(game.actionToUserId).to.eql(user2Id);
        expect(game.state).to.eql(GameState.ROUND_ACTIVE);
        expect(game.sets).to.eql([
          [
            { rank: 10, color: TileColor.YELLOW },
            { rank: 10, color: TileColor.RED },
            { rank: 10, color: TileColor.BLUE },
            { rank: 10, color: TileColor.BLACK },
          ],
        ]);
        expect(game.playerStates).to.eql([
          {
            tiles: [{ rank: 1, color: TileColor.RED }],
            numberOfTiles: 1,
            hasPlayedInitialMeld: true,
            passedLastTurn: false,
            userId: user1Id,
            displayName: "test1",
          },
          {
            tiles: [],
            numberOfTiles: 0,
            hasPlayedInitialMeld: true,
            passedLastTurn: false,
            userId: user2Id,
            displayName: "test2",
          },
        ]);
      });

      it("updates state appropriately if valid play (round complete)", async () => {
        // Arrange
        const {
          userIds: [user1Id, user2Id],
          gameId,
        } = await createTestRummikubRoundActiveGame({
          sets: [
            [
              { rank: 10, color: TileColor.YELLOW },
              { rank: 10, color: TileColor.RED },
              { rank: 10, color: TileColor.BLUE },
            ],
          ],
          playerTiles: [
            [{ rank: 10, color: TileColor.BLACK }],
            [
              { rank: 5, color: TileColor.RED },
              { rank: 7, color: TileColor.BLUE },
            ],
          ],
          playerHasPlayedInitialMeld: [true, true],
          tilePool: [],
        });
        const action: IGameActionRequest = {
          updateSets: {
            sets: [
              [
                { rank: 10, color: TileColor.YELLOW },
                { rank: 10, color: TileColor.RED },
                { rank: 10, color: TileColor.BLUE },
                { rank: 10, color: TileColor.BLACK },
              ],
            ],
            tilesAdded: [{ rank: 10, color: TileColor.BLACK }],
          },
        };

        // act
        const game = await testPlayExpectSuccess(user1Id, gameId, action);

        // assert
        expect(game.actionToUserId).to.eql(user1Id);
        expect(game.state).to.eql(GameState.ROUND_COMPLETE);
        expect(game.sets).to.eql([
          [
            { rank: 10, color: TileColor.YELLOW },
            { rank: 10, color: TileColor.RED },
            { rank: 10, color: TileColor.BLUE },
            { rank: 10, color: TileColor.BLACK },
          ],
        ]);
        expect(game.playerStates).to.eql([
          {
            tiles: [],
            numberOfTiles: 0,
            hasPlayedInitialMeld: true,
            passedLastTurn: false,
            userId: user1Id,
            displayName: "test1",
          },
          {
            tiles: [
              { rank: 5, color: TileColor.RED },
              { rank: 7, color: TileColor.BLUE },
            ],
            numberOfTiles: 2,
            hasPlayedInitialMeld: true,
            passedLastTurn: false,
            userId: user2Id,
            displayName: "test2",
          },
        ]);
        expect(game.roundScores).to.eql([{ [user1Id]: 12, [user2Id]: -12 }]);
      });

      it("updates state appropriately if valid play (game complete)", async () => {
        // Arrange
        const {
          userIds: [user1Id, user2Id],
          gameId,
        } = await createTestRummikubRoundActiveGame({
          sets: [
            [
              { rank: 10, color: TileColor.YELLOW },
              { rank: 10, color: TileColor.RED },
              { rank: 10, color: TileColor.BLUE },
            ],
          ],
          playerTiles: [
            [{ rank: 10, color: TileColor.BLACK }],
            [
              { rank: 5, color: TileColor.RED },
              { rank: 7, color: TileColor.BLUE },
            ],
          ],
          playerHasPlayedInitialMeld: [true, true],
          tilePool: [],
          playerRoundScores: [
            [20, -20],
            [-10, 10],
            [80, -80],
          ],
          createOptions: { playTo: 100, hideTileCount: false },
        });
        const action: IGameActionRequest = {
          updateSets: {
            sets: [
              [
                { rank: 10, color: TileColor.YELLOW },
                { rank: 10, color: TileColor.RED },
                { rank: 10, color: TileColor.BLUE },
                { rank: 10, color: TileColor.BLACK },
              ],
            ],
            tilesAdded: [{ rank: 10, color: TileColor.BLACK }],
          },
        };

        // act
        const game = await testPlayExpectSuccess(user1Id, gameId, action);

        // assert
        expect(game.actionToUserId).to.eql(user1Id);
        expect(game.state).to.eql(GameState.COMPLETE);
        expect(game.sets).to.eql([
          [
            { rank: 10, color: TileColor.YELLOW },
            { rank: 10, color: TileColor.RED },
            { rank: 10, color: TileColor.BLUE },
            { rank: 10, color: TileColor.BLACK },
          ],
        ]);
        expect(game.playerStates).to.eql([
          {
            tiles: [],
            numberOfTiles: 0,
            hasPlayedInitialMeld: true,
            passedLastTurn: false,
            userId: user1Id,
            displayName: "test1",
          },
          {
            tiles: [
              { rank: 5, color: TileColor.RED },
              { rank: 7, color: TileColor.BLUE },
            ],
            numberOfTiles: 2,
            hasPlayedInitialMeld: true,
            passedLastTurn: false,
            userId: user2Id,
            displayName: "test2",
          },
        ]);
        expect(game.roundScores).to.eql([
          { [user1Id]: 20, [user2Id]: -20 },
          { [user1Id]: -10, [user2Id]: 10 },
          { [user1Id]: 80, [user2Id]: -80 },
          { [user1Id]: 12, [user2Id]: -12 },
        ]);
      });
    });

    describe("pickup tile or pass", () => {
      it("updates state appropriately if valid pickup", async () => {
        // arrange
        const {
          userIds: [user1Id, user2Id],
          gameId,
        } = await createTestRummikubRoundActiveGame({
          sets: [],
          playerTiles: [[{ rank: 10, color: TileColor.BLACK }], []],
          tilePool: [
            { rank: 5, color: TileColor.BLUE },
            { rank: 11, color: TileColor.YELLOW },
          ],
        });
        const action: IGameActionRequest = {
          pickUpTileOrPass: true,
        };

        // act
        const game = await testPlayExpectSuccess(user1Id, gameId, action);

        // assert
        expect(game.actionToUserId).to.eql(user2Id);
        expect(game.state).to.eql(GameState.ROUND_ACTIVE);
        expect(game.tilePoolCount).to.eql(1);
        expect(game.playerStates).to.eql([
          {
            tiles: [
              { rank: 10, color: TileColor.BLACK },
              { rank: 11, color: TileColor.YELLOW },
            ],
            numberOfTiles: 2,
            hasPlayedInitialMeld: false,
            passedLastTurn: false,
            userId: user1Id,
            displayName: "test1",
          },
          {
            tiles: [],
            numberOfTiles: 0,
            hasPlayedInitialMeld: false,
            passedLastTurn: false,
            userId: user2Id,
            displayName: "test2",
          },
        ]);
      });

      it("updates state appropriately if pass (round active)", async () => {
        // arrange
        const {
          userIds: [user1Id, user2Id],
          gameId,
        } = await createTestRummikubRoundActiveGame({
          sets: [],
          playerTiles: [[{ rank: 10, color: TileColor.BLACK }], []],
          tilePool: [],
        });
        const action: IGameActionRequest = {
          pickUpTileOrPass: true,
        };

        // act
        const game = await testPlayExpectSuccess(user1Id, gameId, action);

        // assert
        expect(game.actionToUserId).to.eql(user2Id);
        expect(game.state).to.eql(GameState.ROUND_ACTIVE);
        expect(game.playerStates).to.eql([
          {
            tiles: [{ rank: 10, color: TileColor.BLACK }],
            numberOfTiles: 1,
            hasPlayedInitialMeld: false,
            passedLastTurn: true,
            userId: user1Id,
            displayName: "test1",
          },
          {
            tiles: [],
            numberOfTiles: 0,
            hasPlayedInitialMeld: false,
            passedLastTurn: false,
            userId: user2Id,
            displayName: "test2",
          },
        ]);
      });

      it("updates state appropriately if pass (round complete)", async () => {
        // arrange
        const {
          userIds: [user1Id, user2Id],
          gameId,
        } = await createTestRummikubRoundActiveGame({
          sets: [],
          playerTiles: [
            [{ rank: 10, color: TileColor.BLACK }],
            [{ rank: 7, color: TileColor.YELLOW }],
          ],
          playerPassedLastTurn: [false, true],
          tilePool: [],
        });
        const action: IGameActionRequest = {
          pickUpTileOrPass: true,
        };

        // act
        const game = await testPlayExpectSuccess(user1Id, gameId, action);

        // assert
        expect(game.actionToUserId).to.eql(user2Id);
        expect(game.state).to.eql(GameState.ROUND_COMPLETE);
        expect(game.playerStates).to.eql([
          {
            tiles: [{ rank: 10, color: TileColor.BLACK }],
            numberOfTiles: 1,
            hasPlayedInitialMeld: false,
            passedLastTurn: true,
            userId: user1Id,
            displayName: "test1",
          },
          {
            tiles: [{ rank: 7, color: TileColor.YELLOW }],
            numberOfTiles: 1,
            hasPlayedInitialMeld: false,
            passedLastTurn: true,
            userId: user2Id,
            displayName: "test2",
          },
        ]);
        expect(game.roundScores).to.eql([{ [user1Id]: -10, [user2Id]: 10 }]);
      });

      it("updates state appropriately if pass (game complete)", async () => {
        // arrange
        const {
          userIds: [user1Id, user2Id],
          gameId,
        } = await createTestRummikubRoundActiveGame({
          sets: [],
          playerTiles: [
            [{ rank: 10, color: TileColor.BLACK }],
            [{ rank: 7, color: TileColor.YELLOW }],
          ],
          playerPassedLastTurn: [false, true],
          tilePool: [],
          playerRoundScores: [
            [-20, 20],
            [5, -5],
            [-80, 80],
          ],
        });
        const action: IGameActionRequest = {
          pickUpTileOrPass: true,
        };

        // act
        const game = await testPlayExpectSuccess(user1Id, gameId, action);

        // assert
        expect(game.actionToUserId).to.eql(user2Id);
        expect(game.state).to.eql(GameState.COMPLETE);
        expect(game.playerStates).to.eql([
          {
            tiles: [{ rank: 10, color: TileColor.BLACK }],
            numberOfTiles: 1,
            hasPlayedInitialMeld: false,
            passedLastTurn: true,
            userId: user1Id,
            displayName: "test1",
          },
          {
            tiles: [{ rank: 7, color: TileColor.YELLOW }],
            numberOfTiles: 1,
            hasPlayedInitialMeld: false,
            passedLastTurn: true,
            userId: user2Id,
            displayName: "test2",
          },
        ]);
        expect(game.roundScores).to.eql([
          { [user1Id]: -20, [user2Id]: 20 },
          { [user1Id]: 5, [user2Id]: -5 },
          { [user1Id]: -80, [user2Id]: 80 },
          { [user1Id]: -10, [user2Id]: 10 },
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
          passedLastTurn: false,
          tiles: [
            { rank: 1, color: TileColor.RED },
            { rank: 1, color: TileColor.BLACK },
          ],
        },
        {
          userId: user2Id,
          hasPlayedInitialMeld: false,
          passedLastTurn: false,
          tiles: [{ rank: 2, color: TileColor.BLUE }],
        },
      ]);
    });
  });
});
