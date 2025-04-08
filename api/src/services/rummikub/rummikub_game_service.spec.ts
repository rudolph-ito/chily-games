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
  IDoneWithTurnResponse,
  IUpdateSets,
} from "../../shared/dtos/rummikub/game";
import { createTestRummikubGame } from "../../../test/rummikub_test_helper";
import { TileColor } from "../../shared/dtos/rummikub/tile";
import { describe, it, expect } from "@jest/globals";

interface ITestSaveLatestUpdateSetsResult {
  error?: Error;
  game?: IGame;
}

interface ITestDoneWithTurnResult {
  error?: Error;
  result?: IDoneWithTurnResponse;
  game?: IGame;
}

interface ITestDoneWithTurnSuccessResult {
  result: IDoneWithTurnResponse;
  game: IGame;
}

async function testSaveLatestUpdateSets(
  userId: number,
  gameId: number,
  updateSets: IUpdateSets
): Promise<ITestSaveLatestUpdateSetsResult> {
  let error: Error | undefined;
  let game: IGame | undefined;
  try {
    await new RummikubGameService().saveLatestUpdateSets(
      userId,
      gameId,
      updateSets
    );
    game = await new RummikubGameService().get(userId, gameId);
  } catch (e) {
    error = e;
  }
  return { game, error };
}

async function testSaveLatestUpdateSetsExpectError(
  userId: number,
  gameId: number,
  updateSets: IUpdateSets
): Promise<Error> {
  const { error } = await testSaveLatestUpdateSets(userId, gameId, updateSets);
  if (error == null) {
    throw new Error("Expected error but didn't get one");
  }
  return error;
}

async function testSaveLatestUpdateSetsExpectSuccess(
  userId: number,
  gameId: number,
  updateSets: IUpdateSets
): Promise<IGame> {
  const { error, game } = await testSaveLatestUpdateSets(
    userId,
    gameId,
    updateSets
  );
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

async function testDoneWithTurn(
  userId: number,
  gameId: number
): Promise<ITestDoneWithTurnResult> {
  let error: Error | undefined;
  let game: IGame | undefined;
  let result: IDoneWithTurnResponse | undefined;
  try {
    result = await new RummikubGameService().doneWithTurn(userId, gameId);
    game = await new RummikubGameService().get(userId, gameId);
  } catch (e) {
    error = e;
  }
  return { result, game, error };
}

async function testDoneWithTurnExpectError(
  userId: number,
  gameId: number
): Promise<Error> {
  const { result, error } = await testDoneWithTurn(userId, gameId);
  if (error == null) {
    throw new Error(
      `Expected error but didn't get one, result: ${JSON.stringify(result)}`
    );
  }
  return error;
}

async function testDoneWithTurnExpectSuccess(
  userId: number,
  gameId: number
): Promise<ITestDoneWithTurnSuccessResult> {
  const { error, game, result } = await testDoneWithTurn(userId, gameId);
  if (error != null) {
    throw new Error(
      `Expected no error but got one, error: ${error.stack ?? error.message}`
    );
  }
  if (game == null) {
    throw new Error(`Expected game but is null`);
  }
  if (result == null) {
    throw new Error(`Expected result but is null`);
  }
  return { game, result };
}

describe("RummikubGameService", () => {
  resetDatabaseBeforeEach();

  describe("join", () => {
    it("throws a validation error if game not found", async () => {
      // arrange
      const user1Id = await createTestUser(createTestCredentials("test1"));

      // act
      let error: Error | null = null;
      try {
        await new RummikubGameService().join(user1Id, 1);
      } catch (e) {
        error = e;
      }

      // assert
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error?.message).toEqual(`Game does not exist with id: 1`);
    });

    it("throws a validation error if user already in game", async () => {
      // arrange
      const user1Id = await createTestUser(createTestCredentials("test1"));
      const { gameId } = await new RummikubGameService().create(user1Id, {
        displayPlayerTileCounts: true,
        scoreSystem: "high_score_zero_sum",
        scoreThreshold: 200,
      });

      // act
      let error: Error | null = null;
      try {
        await new RummikubGameService().join(user1Id, gameId);
      } catch (e) {
        error = e;
      }

      // assert
      expect(error).toBeInstanceOf(ValidationError);
      expect(error?.message).toEqual(
        'Validation errors: "Already joined game."'
      );
    });

    it("throws a validation error if game is full", async () => {
      // arrange
      const { gameId } = await createTestRummikubGame({
        state: GameState.PLAYERS_JOINING,
        sets: [],
        playerTiles: [[], [], [], [], [], []],
        tilePool: [],
      });
      const user7Id = await createTestUser(createTestCredentials("test7"));

      // act
      let error: Error | null = null;
      try {
        await new RummikubGameService().join(user7Id, gameId);
      } catch (e) {
        error = e;
      }

      // assert
      expect(error).toBeInstanceOf(ValidationError);
      expect(error?.message).toEqual('Validation errors: "Game is full."');
    });
  });

  describe("start round", () => {
    it("gives players 20 tiles if only two players", async () => {
      // arrange
      const {
        userIds: [user1Id],
        gameId,
      } = await createTestRummikubGame({
        state: GameState.PLAYERS_JOINING,
        sets: [],
        playerTiles: [[], []],
        tilePool: [],
        createOptions: {
          displayPlayerTileCounts: true,
          scoreSystem: "high_score_zero_sum",
          scoreThreshold: 200,
        },
      });

      // act
      const updatedGame = await new RummikubGameService().startRound(
        user1Id,
        gameId
      );

      // assert
      expect(updatedGame.playerStates[0].numberOfTiles).toEqual(20);
    });

    it("gives players 14 tiles if 3 or more players", async () => {
      // arrange
      const {
        userIds: [user1Id],
        gameId,
      } = await createTestRummikubGame({
        state: GameState.PLAYERS_JOINING,
        sets: [],
        playerTiles: [[], [], []],
        tilePool: [],
        createOptions: {
          displayPlayerTileCounts: true,
          scoreSystem: "high_score_zero_sum",
          scoreThreshold: 200,
        },
      });

      // act
      const updatedGame = await new RummikubGameService().startRound(
        user1Id,
        gameId
      );

      // assert
      expect(updatedGame.playerStates[0].numberOfTiles).toEqual(14);
    });

    it("uses a total of 106 tiles if 4 or less players", async () => {
      // arrange
      const {
        userIds: [user1Id],
        gameId,
      } = await createTestRummikubGame({
        state: GameState.PLAYERS_JOINING,
        sets: [],
        playerTiles: [[], [], [], []],
        tilePool: [],
      });

      // act
      const updatedGame = await new RummikubGameService().startRound(
        user1Id,
        gameId
      );

      // assert
      expect(updatedGame.tilePoolCount).toEqual(106 - 4 * 14);
    });

    it("uses a total of 160 tiles if 5 or 6 players", async () => {
      // arrange
      const {
        userIds: [user1Id],
        gameId,
      } = await createTestRummikubGame({
        state: GameState.PLAYERS_JOINING,
        sets: [],
        playerTiles: [[], [], [], [], []],
        tilePool: [],
      });

      // act
      const updatedGame = await new RummikubGameService().startRound(
        user1Id,
        gameId
      );

      // assert
      expect(updatedGame.tilePoolCount).toEqual(160 - 5 * 14);
    });
  });

  describe("saveLatestUpdateSets", () => {
    it("throws a validation error if game not found", async () => {
      // arrange
      const userCreds = createTestCredentials("test");
      const userId = await createTestUser(userCreds);
      const gameId = 1;
      const updateSets: IUpdateSets = {
        sets: [],
        tilesAdded: [],
        remainingTiles: [],
      };

      // act
      const error = await testSaveLatestUpdateSetsExpectError(
        userId,
        gameId,
        updateSets
      );

      // assert
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toEqual(`Game does not exist with id: ${gameId}`);
    });

    it("throws a validation error if round is not active", async () => {
      // arrange
      const {
        userIds: [user1Id],
        gameId,
      } = await createTestRummikubGame({
        state: GameState.ROUND_COMPLETE,
        sets: [],
        playerTiles: [[], []],
        tilePool: [],
      });
      const updateSets: IUpdateSets = {
        sets: [],
        tilesAdded: [],
        remainingTiles: [],
      };

      // act
      const error = await testSaveLatestUpdateSetsExpectError(
        user1Id,
        gameId,
        updateSets
      );

      // assert
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toEqual(
        'Validation errors: "Round is not active."'
      );
    });

    it("throws a validation error if sets includes tile not in user hand", async () => {
      // Arrange
      const {
        userIds: [user1Id],
        gameId,
      } = await createTestRummikubGame({
        sets: [
          { rank: 10, color: TileColor.YELLOW },
          { rank: 10, color: TileColor.RED },
          { rank: 10, color: TileColor.BLUE },
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
      const updateSets: IUpdateSets = {
        sets: [
          { rank: 10, color: TileColor.YELLOW },
          { rank: 10, color: TileColor.RED },
          { rank: 10, color: TileColor.BLUE },
          { rank: 10, color: TileColor.BLACK },
        ],
        tilesAdded: [{ rank: 10, color: TileColor.BLACK }],
        remainingTiles: [
          { rank: 2, color: TileColor.BLACK },
          { rank: 1, color: TileColor.RED },
        ],
      };

      // act
      const error = await testSaveLatestUpdateSetsExpectError(
        user1Id,
        gameId,
        updateSets
      );

      // assert
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toEqual(
        'Validation errors: "Update sets: includes a tile not in hand."'
      );
    });

    it("throws a validation error if updated sets are not existing sets plus tiles added", async () => {
      // Arrange
      const {
        userIds: [user1Id],
        gameId,
      } = await createTestRummikubGame({
        sets: [
          { rank: 10, color: TileColor.YELLOW },
          { rank: 10, color: TileColor.RED },
          { rank: 10, color: TileColor.BLUE },
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
      const updateSets: IUpdateSets = {
        sets: [
          { rank: 10, color: TileColor.YELLOW },
          { rank: 10, color: TileColor.RED },
          { rank: 10, color: TileColor.BLACK },
        ],
        tilesAdded: [{ rank: 10, color: TileColor.BLACK }],
        remainingTiles: [{ rank: 1, color: TileColor.RED }],
      };

      // act
      const error = await testSaveLatestUpdateSetsExpectError(
        user1Id,
        gameId,
        updateSets
      );

      // assert
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toEqual(
        'Validation errors: "Update sets: tiles in updated sets are not equal to existing sets plus tiles added."'
      );
    });

    it("throws a validation error if player tiles is not remaining hand plus tiles added", async () => {
      // Arrange
      const {
        userIds: [user1Id],
        gameId,
      } = await createTestRummikubGame({
        sets: [
          { rank: 10, color: TileColor.YELLOW },
          { rank: 10, color: TileColor.RED },
          { rank: 10, color: TileColor.BLUE },
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
      const updateSets: IUpdateSets = {
        sets: [
          { rank: 10, color: TileColor.YELLOW },
          { rank: 10, color: TileColor.RED },
          { rank: 10, color: TileColor.BLUE },
        ],
        tilesAdded: [],
        remainingTiles: [{ rank: 1, color: TileColor.RED }],
      };

      // act
      const error = await testSaveLatestUpdateSetsExpectError(
        user1Id,
        gameId,
        updateSets
      );

      // assert
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toEqual(
        'Validation errors: "Update sets: remaining tiles is invalid."'
      );
    });

    it("updates state appropriately if valid play (all sets valid)", async () => {
      // Arrange
      const {
        userIds: [user1Id],
        gameId,
      } = await createTestRummikubGame({
        sets: [
          { rank: 10, color: TileColor.YELLOW },
          { rank: 10, color: TileColor.RED },
          { rank: 10, color: TileColor.BLUE },
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
      const updateSets: IUpdateSets = {
        sets: [
          { rank: 10, color: TileColor.YELLOW },
          { rank: 10, color: TileColor.RED },
          { rank: 10, color: TileColor.BLUE },
          { rank: 10, color: TileColor.BLACK },
        ],
        tilesAdded: [{ rank: 10, color: TileColor.BLACK }],
        remainingTiles: [{ rank: 1, color: TileColor.RED }],
      };

      // act
      const game = await testSaveLatestUpdateSetsExpectSuccess(
        user1Id,
        gameId,
        updateSets
      );

      // assert
      expect(game.actionToUserId).toEqual(user1Id);
      expect(game.latestUpdateSets).toEqual(null);
      expect(game.lastValidUpdateSets).toEqual(updateSets);
    });

    it("updates state appropriately if valid play (not all sets valid)", async () => {
      // Arrange
      const {
        userIds: [user1Id],
        gameId,
      } = await createTestRummikubGame({
        sets: [
          { rank: 10, color: TileColor.YELLOW },
          { rank: 10, color: TileColor.RED },
          { rank: 10, color: TileColor.BLUE },
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
      const updateSets: IUpdateSets = {
        sets: [
          { rank: 10, color: TileColor.YELLOW },
          { rank: 10, color: TileColor.RED },
          { rank: 10, color: TileColor.BLUE },
          null,
          { rank: 1, color: TileColor.RED },
        ],
        tilesAdded: [{ rank: 1, color: TileColor.RED }],
        remainingTiles: [{ rank: 10, color: TileColor.BLACK }],
      };

      // act
      const game = await testSaveLatestUpdateSetsExpectSuccess(
        user1Id,
        gameId,
        updateSets
      );

      // assert
      expect(game.actionToUserId).toEqual(user1Id);
      expect(game.latestUpdateSets).toEqual(updateSets);
      expect(game.lastValidUpdateSets).toEqual(null);
    });
  });

  describe("done with turn", () => {
    it("throws a validation error if game not found", async () => {
      // arrange
      const userCreds = createTestCredentials("test");
      const userId = await createTestUser(userCreds);
      const gameId = 1;

      // act
      const error = await testDoneWithTurnExpectError(userId, gameId);

      // assert
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toEqual(`Game does not exist with id: ${gameId}`);
    });

    it("throws a validation error if round is not active", async () => {
      // arrange
      const {
        userIds: [user1Id],
        gameId,
      } = await createTestRummikubGame({
        state: GameState.ROUND_COMPLETE,
        sets: [],
        playerTiles: [[], []],
        tilePool: [],
      });

      // act
      const error = await testDoneWithTurnExpectError(user1Id, gameId);

      // assert
      expect(error).toBeInstanceOf(ValidationError);
      expect(error?.message).toEqual(
        'Validation errors: "Round is not active."'
      );
    });

    it("throws a validation error if action is not to user", async () => {
      // arrange
      const {
        userIds: [, user2Id],
        gameId,
      } = await createTestRummikubGame({
        sets: [],
        playerTiles: [[], []],
        tilePool: [],
      });

      // act
      const error = await testDoneWithTurnExpectError(user2Id, gameId);

      // assert
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toEqual(
        'Validation errors: "Action is not to you."'
      );
    });

    describe("finalize update sets", () => {
      it("throws a validation error if user has not played initial meld and modifying existing set", async () => {
        // Arrange
        const {
          userIds: [user1Id],
          gameId,
        } = await createTestRummikubGame({
          sets: [
            { rank: 8, color: TileColor.BLACK },
            { rank: 8, color: TileColor.RED },
            { rank: 8, color: TileColor.YELLOW },
            null,

            { rank: 8, color: TileColor.YELLOW },
            { rank: 9, color: TileColor.YELLOW },
            { rank: 10, color: TileColor.YELLOW },
          ],
          playerTiles: [
            [
              { rank: 8, color: TileColor.BLUE },
              { rank: 11, color: TileColor.YELLOW },
              { rank: 12, color: TileColor.YELLOW },
              { rank: 1, color: TileColor.RED },
            ],
            [],
          ],
          playerHasPlayedInitialMeld: [false, true],
          tilePool: [],
          lastValidUpdateSets: {
            sets: [
              { rank: 8, color: TileColor.BLACK },
              { rank: 8, color: TileColor.RED },
              { rank: 8, color: TileColor.YELLOW },
              { rank: 8, color: TileColor.BLUE },
              null,

              { rank: 8, color: TileColor.YELLOW },
              { rank: 9, color: TileColor.YELLOW },
              { rank: 10, color: TileColor.YELLOW },
              { rank: 11, color: TileColor.YELLOW },
              { rank: 12, color: TileColor.YELLOW },
            ],
            tilesAdded: [
              { rank: 8, color: TileColor.BLUE },
              { rank: 11, color: TileColor.YELLOW },
              { rank: 12, color: TileColor.YELLOW },
            ],
            remainingTiles: [{ rank: 1, color: TileColor.RED }],
          },
        });

        // act
        const error = await testDoneWithTurnExpectError(user1Id, gameId);

        // assert
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.message).toEqual(
          'Validation errors: "Finalize update sets: cannot modify existing sets on initial play"'
        );
      });

      it("throws a validation error if user has not played initial meld and sum total is less than 30", async () => {
        // Arrange
        const {
          userIds: [user1Id],
          gameId,
        } = await createTestRummikubGame({
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
          lastValidUpdateSets: {
            sets: [
              { rank: 9, color: TileColor.BLACK },
              { rank: 9, color: TileColor.RED },
              { rank: 9, color: TileColor.BLUE },
            ],
            tilesAdded: [
              { rank: 9, color: TileColor.BLACK },
              { rank: 9, color: TileColor.RED },
              { rank: 9, color: TileColor.BLUE },
            ],
            remainingTiles: [{ rank: 5, color: TileColor.YELLOW }],
          },
        });

        // act
        const error = await testDoneWithTurnExpectError(user1Id, gameId);

        // assert
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.message).toEqual(
          'Validation errors: "Finalize update sets: sum of tiles in initial play must be at least 30 (is only 27)"'
        );
      });

      it("throws a validation error if lastest state is invalid", async () => {
        // Arrange
        const {
          userIds: [user1Id],
          gameId,
        } = await createTestRummikubGame({
          sets: [
            { rank: 10, color: TileColor.YELLOW },
            { rank: 10, color: TileColor.RED },
            { rank: 10, color: TileColor.BLUE },
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
          latestUpdateSets: {
            sets: [
              { rank: 10, color: TileColor.YELLOW },
              { rank: 10, color: TileColor.RED },
              { rank: 10, color: TileColor.BLUE },
              null,

              { rank: 1, color: TileColor.BLACK },
              { rank: 2, color: TileColor.RED },
              { rank: 3, color: TileColor.BLACK },
            ],
            tilesAdded: [
              { rank: 1, color: TileColor.BLACK },
              { rank: 2, color: TileColor.RED },
              { rank: 3, color: TileColor.BLACK },
            ],
            remainingTiles: [],
          },
        });

        // act
        const error = await testDoneWithTurnExpectError(user1Id, gameId);

        // assert
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.message).toEqual(
          'Validation errors: "Finalize update sets: latest state is invalid."'
        );
      });

      it("updates state appropriately if valid play (round active, initial meld)", async () => {
        // arrange
        const {
          userIds: [user1Id, user2Id],
          gameId,
        } = await createTestRummikubGame({
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
          playerHasPlayedInitialMeld: [false, false],
          tilePool: [],
          lastValidUpdateSets: {
            sets: [
              { rank: 10, color: TileColor.BLACK },
              { rank: 10, color: TileColor.RED },
              { rank: 10, color: TileColor.BLUE },
            ],
            tilesAdded: [
              { rank: 10, color: TileColor.BLACK },
              { rank: 10, color: TileColor.RED },
              { rank: 10, color: TileColor.BLUE },
            ],
            remainingTiles: [{ rank: 5, color: TileColor.YELLOW }],
          },
        });

        // act
        const { game } = await testDoneWithTurnExpectSuccess(user1Id, gameId);

        // assert
        expect(game.actionToUserId).toEqual(user2Id);
        expect(game.state).toEqual(GameState.ROUND_ACTIVE);
        expect(game.sets).toEqual([
          { rank: 10, color: TileColor.BLACK },
          { rank: 10, color: TileColor.RED },
          { rank: 10, color: TileColor.BLUE },
        ]);
        expect(game.lastValidUpdateSets).toEqual(null);
        expect(game.playerStates).toEqual([
          {
            tiles: [{ rank: 5, color: TileColor.YELLOW }],
            numberOfTiles: 0,
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

      it("updates state appropriately if valid play (round active, not initial meld)", async () => {
        // Arrange
        const {
          userIds: [user1Id, user2Id],
          gameId,
        } = await createTestRummikubGame({
          sets: [
            { rank: 10, color: TileColor.YELLOW },
            { rank: 10, color: TileColor.RED },
            { rank: 10, color: TileColor.BLUE },
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
          lastValidUpdateSets: {
            sets: [
              { rank: 10, color: TileColor.YELLOW },
              { rank: 10, color: TileColor.RED },
              { rank: 10, color: TileColor.BLUE },
              { rank: 10, color: TileColor.BLACK },
            ],
            tilesAdded: [{ rank: 10, color: TileColor.BLACK }],
            remainingTiles: [{ rank: 1, color: TileColor.RED }],
          },
        });

        // act
        const { game } = await testDoneWithTurnExpectSuccess(user1Id, gameId);

        // assert
        expect(game.actionToUserId).toEqual(user2Id);
        expect(game.state).toEqual(GameState.ROUND_ACTIVE);
        expect(game.sets).toEqual([
          { rank: 10, color: TileColor.YELLOW },
          { rank: 10, color: TileColor.RED },
          { rank: 10, color: TileColor.BLUE },
          { rank: 10, color: TileColor.BLACK },
        ]);
        expect(game.lastValidUpdateSets).toEqual(null);
        expect(game.playerStates).toEqual([
          {
            tiles: [{ rank: 1, color: TileColor.RED }],
            numberOfTiles: 0,
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

      it("updates state appropriately if valid play (round complete, scoring system - high score zero sum)", async () => {
        // Arrange
        const {
          userIds: [user1Id, user2Id],
          gameId,
        } = await createTestRummikubGame({
          sets: [
            { rank: 10, color: TileColor.YELLOW },
            { rank: 10, color: TileColor.RED },
            { rank: 10, color: TileColor.BLUE },
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
          lastValidUpdateSets: {
            sets: [
              { rank: 10, color: TileColor.YELLOW },
              { rank: 10, color: TileColor.RED },
              { rank: 10, color: TileColor.BLUE },
              { rank: 10, color: TileColor.BLACK },
            ],
            tilesAdded: [{ rank: 10, color: TileColor.BLACK }],
            remainingTiles: [],
          },
          createOptions: {
            displayPlayerTileCounts: false,
            scoreSystem: "high_score_zero_sum",
            scoreThreshold: 200,
          },
        });

        // act
        const { game } = await testDoneWithTurnExpectSuccess(user1Id, gameId);

        // assert
        expect(game.actionToUserId).toEqual(user1Id);
        expect(game.state).toEqual(GameState.ROUND_COMPLETE);
        expect(game.sets).toEqual([
          { rank: 10, color: TileColor.YELLOW },
          { rank: 10, color: TileColor.RED },
          { rank: 10, color: TileColor.BLUE },
          { rank: 10, color: TileColor.BLACK },
        ]);
        expect(game.lastValidUpdateSets).toEqual(null);
        expect(game.playerStates).toEqual([
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
            numberOfTiles: 0,
            hasPlayedInitialMeld: true,
            passedLastTurn: false,
            userId: user2Id,
            displayName: "test2",
          },
        ]);
        expect(game.roundScores).toEqual([
          { [user1Id]: { score: 12 }, [user2Id]: { score: -12 } },
        ]);
      });

      it("updates state appropriately if valid play (round complete, scoring system - low score)", async () => {
        // Arrange
        const {
          userIds: [user1Id, user2Id],
          gameId,
        } = await createTestRummikubGame({
          sets: [
            { rank: 10, color: TileColor.YELLOW },
            { rank: 10, color: TileColor.RED },
            { rank: 10, color: TileColor.BLUE },
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
          lastValidUpdateSets: {
            sets: [
              { rank: 10, color: TileColor.YELLOW },
              { rank: 10, color: TileColor.RED },
              { rank: 10, color: TileColor.BLUE },
              { rank: 10, color: TileColor.BLACK },
            ],
            tilesAdded: [{ rank: 10, color: TileColor.BLACK }],
            remainingTiles: [],
          },
          createOptions: {
            displayPlayerTileCounts: false,
            scoreSystem: "low_score",
            scoreThreshold: 200,
          },
        });

        // act
        const { game } = await testDoneWithTurnExpectSuccess(user1Id, gameId);

        // assert
        expect(game.actionToUserId).toEqual(user1Id);
        expect(game.state).toEqual(GameState.ROUND_COMPLETE);
        expect(game.sets).toEqual([
          { rank: 10, color: TileColor.YELLOW },
          { rank: 10, color: TileColor.RED },
          { rank: 10, color: TileColor.BLUE },
          { rank: 10, color: TileColor.BLACK },
        ]);
        expect(game.lastValidUpdateSets).toEqual(null);
        expect(game.playerStates).toEqual([
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
            numberOfTiles: 0,
            hasPlayedInitialMeld: true,
            passedLastTurn: false,
            userId: user2Id,
            displayName: "test2",
          },
        ]);
        expect(game.roundScores).toEqual([
          { [user1Id]: { score: 0 }, [user2Id]: { score: 12 } },
        ]);
      });

      it("updates state appropriately if valid play (game complete)", async () => {
        // Arrange
        const {
          userIds: [user1Id, user2Id],
          gameId,
        } = await createTestRummikubGame({
          sets: [
            { rank: 10, color: TileColor.YELLOW },
            { rank: 10, color: TileColor.RED },
            { rank: 10, color: TileColor.BLUE },
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
          lastValidUpdateSets: {
            sets: [
              { rank: 10, color: TileColor.YELLOW },
              { rank: 10, color: TileColor.RED },
              { rank: 10, color: TileColor.BLUE },
              { rank: 10, color: TileColor.BLACK },
            ],
            tilesAdded: [{ rank: 10, color: TileColor.BLACK }],
            remainingTiles: [],
          },
          playerRoundScores: [
            [20, -20],
            [-10, 10],
            [80, -80],
          ],
          createOptions: {
            displayPlayerTileCounts: false,
            scoreSystem: "high_score_zero_sum",
            scoreThreshold: 100,
          },
        });

        // act
        const { game } = await testDoneWithTurnExpectSuccess(user1Id, gameId);

        // assert
        expect(game.actionToUserId).toEqual(user1Id);
        expect(game.state).toEqual(GameState.COMPLETE);
        expect(game.sets).toEqual([
          { rank: 10, color: TileColor.YELLOW },
          { rank: 10, color: TileColor.RED },
          { rank: 10, color: TileColor.BLUE },
          { rank: 10, color: TileColor.BLACK },
        ]);
        expect(game.lastValidUpdateSets).toEqual(null);
        expect(game.playerStates).toEqual([
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
            numberOfTiles: 0,
            hasPlayedInitialMeld: true,
            passedLastTurn: false,
            userId: user2Id,
            displayName: "test2",
          },
        ]);
        expect(game.roundScores).toEqual([
          { [user1Id]: { score: 20 }, [user2Id]: { score: -20 } },
          { [user1Id]: { score: -10 }, [user2Id]: { score: 10 } },
          { [user1Id]: { score: 80 }, [user2Id]: { score: -80 } },
          { [user1Id]: { score: 12 }, [user2Id]: { score: -12 } },
        ]);
      });
    });

    describe("pickup tile or pass", () => {
      it("updates state appropriately if pickup (last valid update sets is undefined) ", async () => {
        // arrange
        const {
          userIds: [user1Id, user2Id],
          gameId,
        } = await createTestRummikubGame({
          sets: [],
          playerTiles: [[{ rank: 10, color: TileColor.BLACK }], []],
          tilePool: [
            { rank: 5, color: TileColor.BLUE },
            { rank: 11, color: TileColor.YELLOW },
          ],
        });

        // act
        const { game } = await testDoneWithTurnExpectSuccess(user1Id, gameId);

        // assert
        expect(game.actionToUserId).toEqual(user2Id);
        expect(game.state).toEqual(GameState.ROUND_ACTIVE);
        expect(game.tilePoolCount).toEqual(1);
        expect(game.playerStates).toEqual([
          {
            tiles: [
              { rank: 10, color: TileColor.BLACK },
              { rank: 11, color: TileColor.YELLOW },
            ],
            numberOfTiles: 0,
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

      it("updates state appropriately if pickup (last valid update sets is defined) ", async () => {
        // arrange
        const {
          userIds: [user1Id, user2Id],
          gameId,
        } = await createTestRummikubGame({
          sets: [],
          playerTiles: [
            [
              { rank: 10, color: TileColor.BLACK },
              { rank: 10, color: TileColor.BLUE },
            ],
            [],
          ],
          tilePool: [
            { rank: 5, color: TileColor.BLUE },
            { rank: 11, color: TileColor.YELLOW },
          ],
          lastValidUpdateSets: {
            sets: [],
            tilesAdded: [],
            remainingTiles: [
              { rank: 10, color: TileColor.BLUE },
              { rank: 10, color: TileColor.BLACK },
            ],
          },
        });

        // act
        const { game } = await testDoneWithTurnExpectSuccess(user1Id, gameId);

        // assert
        expect(game.actionToUserId).toEqual(user2Id);
        expect(game.state).toEqual(GameState.ROUND_ACTIVE);
        expect(game.tilePoolCount).toEqual(1);
        expect(game.lastValidUpdateSets).toEqual(null);
        expect(game.playerStates).toEqual([
          {
            tiles: [
              { rank: 10, color: TileColor.BLUE },
              { rank: 10, color: TileColor.BLACK },
              { rank: 11, color: TileColor.YELLOW },
            ],
            numberOfTiles: 0,
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

      it("updates state appropriately if pickup (placed at end of tiles) ", async () => {
        // arrange
        const {
          userIds: [user1Id, user2Id],
          gameId,
        } = await createTestRummikubGame({
          sets: [],
          playerTiles: [[{ rank: 10, color: TileColor.BLACK }], []],
          tilePool: [
            { rank: 5, color: TileColor.BLUE },
            { rank: 11, color: TileColor.YELLOW },
          ],
        });

        // act
        const { game, result } = await testDoneWithTurnExpectSuccess(
          user1Id,
          gameId
        );

        // assert
        expect(game.actionToUserId).toEqual(user2Id);
        expect(game.state).toEqual(GameState.ROUND_ACTIVE);
        expect(game.tilePoolCount).toEqual(1);
        expect(game.playerStates).toEqual([
          {
            tiles: [
              { rank: 10, color: TileColor.BLACK },
              { rank: 11, color: TileColor.YELLOW },
            ],
            numberOfTiles: 0,
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
        expect(result.pickedUpTileData?.playerTileIndex).toEqual(1);
      });

      it("updates state appropriately if pickup (placed at first empty spot) ", async () => {
        // arrange
        const {
          userIds: [user1Id, user2Id],
          gameId,
        } = await createTestRummikubGame({
          sets: [],
          playerTiles: [[null, null, { rank: 10, color: TileColor.BLACK }], []],
          tilePool: [
            { rank: 5, color: TileColor.BLUE },
            { rank: 11, color: TileColor.YELLOW },
          ],
        });

        // act
        const { game, result } = await testDoneWithTurnExpectSuccess(
          user1Id,
          gameId
        );

        // assert
        expect(game.actionToUserId).toEqual(user2Id);
        expect(game.state).toEqual(GameState.ROUND_ACTIVE);
        expect(game.tilePoolCount).toEqual(1);
        expect(game.playerStates).toEqual([
          {
            tiles: [
              { rank: 11, color: TileColor.YELLOW },
              null,
              { rank: 10, color: TileColor.BLACK },
            ],
            numberOfTiles: 0,
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
        expect(result.pickedUpTileData?.playerTileIndex).toEqual(0);
      });

      it("updates state appropriately if pass (round active)", async () => {
        // arrange
        const {
          userIds: [user1Id, user2Id],
          gameId,
        } = await createTestRummikubGame({
          sets: [],
          playerTiles: [[{ rank: 10, color: TileColor.BLACK }], []],
          tilePool: [],
        });

        // act
        const { game } = await testDoneWithTurnExpectSuccess(user1Id, gameId);

        // assert
        expect(game.actionToUserId).toEqual(user2Id);
        expect(game.state).toEqual(GameState.ROUND_ACTIVE);
        expect(game.playerStates).toEqual([
          {
            tiles: [{ rank: 10, color: TileColor.BLACK }],
            numberOfTiles: 0,
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
        } = await createTestRummikubGame({
          sets: [],
          playerTiles: [
            [{ rank: 10, color: TileColor.BLACK }],
            [{ rank: 7, color: TileColor.YELLOW }],
          ],
          playerPassedLastTurn: [false, true],
          tilePool: [],
        });

        // act
        const { game } = await testDoneWithTurnExpectSuccess(user1Id, gameId);

        // assert
        expect(game.actionToUserId).toEqual(user2Id);
        expect(game.state).toEqual(GameState.ROUND_COMPLETE);
        expect(game.playerStates).toEqual([
          {
            tiles: [{ rank: 10, color: TileColor.BLACK }],
            numberOfTiles: 0,
            hasPlayedInitialMeld: false,
            passedLastTurn: true,
            userId: user1Id,
            displayName: "test1",
          },
          {
            tiles: [{ rank: 7, color: TileColor.YELLOW }],
            numberOfTiles: 0,
            hasPlayedInitialMeld: false,
            passedLastTurn: true,
            userId: user2Id,
            displayName: "test2",
          },
        ]);
        expect(game.roundScores).toEqual([
          { [user1Id]: { score: -10 }, [user2Id]: { score: 10 } },
        ]);
      });

      it("updates state appropriately if pass (game complete)", async () => {
        // arrange
        const {
          userIds: [user1Id, user2Id],
          gameId,
        } = await createTestRummikubGame({
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

        // act
        const { game } = await testDoneWithTurnExpectSuccess(user1Id, gameId);

        // assert
        expect(game.actionToUserId).toEqual(user2Id);
        expect(game.state).toEqual(GameState.COMPLETE);
        expect(game.playerStates).toEqual([
          {
            tiles: [{ rank: 10, color: TileColor.BLACK }],
            numberOfTiles: 0,
            hasPlayedInitialMeld: false,
            passedLastTurn: true,
            userId: user1Id,
            displayName: "test1",
          },
          {
            tiles: [{ rank: 7, color: TileColor.YELLOW }],
            numberOfTiles: 0,
            hasPlayedInitialMeld: false,
            passedLastTurn: true,
            userId: user2Id,
            displayName: "test2",
          },
        ]);
        expect(game.roundScores).toEqual([
          { [user1Id]: { score: -20 }, [user2Id]: { score: 20 } },
          { [user1Id]: { score: 5 }, [user2Id]: { score: -5 } },
          { [user1Id]: { score: -80 }, [user2Id]: { score: 80 } },
          { [user1Id]: { score: -10 }, [user2Id]: { score: 10 } },
        ]);
      });
    });
  });

  describe("rearrange tiles", () => {
    it("throws a validation error if round is not active", async () => {
      // arrange
      const {
        userIds: [user1Id],
        gameId,
      } = await createTestRummikubGame({
        state: GameState.ROUND_COMPLETE,
        sets: [],
        playerTiles: [[], []],
        tilePool: [],
      });

      // act
      let error: Error | null = null;
      try {
        await new RummikubGameService().rearrangeTiles(user1Id, gameId, []);
      } catch (e) {
        error = e;
      }

      // assert
      expect(error).toBeInstanceOf(ValidationError);
      expect(error?.message).toEqual(
        'Validation errors: "Round is not active."'
      );
    });

    it("throws a validation error if player is not in game", async () => {
      // arrange
      const { gameId } = await createTestRummikubGame({
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
      expect(error).toBeInstanceOf(ValidationError);
      expect(error?.message).toEqual(
        'Validation errors: "You are not a player in this game."'
      );
    });

    it("throws a validation error if player attempts to add a tile", async () => {
      // arrange
      const {
        userIds: [user1Id],
        gameId,
      } = await createTestRummikubGame({
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
      expect(error).toBeInstanceOf(ValidationError);
      expect(error?.message).toEqual(
        'Validation errors: "Rearranged tiles are not equivalent to tiles in hand."'
      );
    });

    it("throws a validation error if player attempts to remove a tile", async () => {
      // arrange
      const {
        userIds: [user1Id],
        gameId,
      } = await createTestRummikubGame({
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
      expect(error).toBeInstanceOf(ValidationError);
      expect(error?.message).toEqual(
        'Validation errors: "Rearranged tiles are not equivalent to tiles in hand."'
      );
    });

    it("throws a validation error if action to player and there is a latest update sets", async () => {
      // arrange
      const {
        userIds: [user1Id],
        gameId,
      } = await createTestRummikubGame({
        sets: [],
        playerTiles: [
          [
            { rank: 1, color: TileColor.BLACK },
            { rank: 1, color: TileColor.RED },
          ],
          [],
        ],
        tilePool: [],
        latestUpdateSets: {
          sets: [{ rank: 1, color: TileColor.BLACK }],
          tilesAdded: [{ rank: 1, color: TileColor.BLACK }],
          remainingTiles: [{ rank: 1, color: TileColor.RED }],
        },
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
      expect(error).toBeInstanceOf(ValidationError);
      expect(error?.message).toEqual(
        'Validation errors: "Cannot rearrange tiles while have update sets in progress."'
      );
    });

    it("throws a validation error if action to player and there is a last valid update sets", async () => {
      // arrange
      const {
        userIds: [user1Id],
        gameId,
      } = await createTestRummikubGame({
        sets: [],
        playerTiles: [
          [
            { rank: 1, color: TileColor.BLACK },
            { rank: 1, color: TileColor.RED },
            { rank: 1, color: TileColor.YELLOW },
            { rank: 2, color: TileColor.BLUE },
          ],
          [],
        ],
        tilePool: [],
        lastValidUpdateSets: {
          sets: [
            { rank: 1, color: TileColor.BLACK },
            { rank: 1, color: TileColor.RED },
            { rank: 1, color: TileColor.YELLOW },
          ],
          tilesAdded: [
            { rank: 1, color: TileColor.BLACK },
            { rank: 1, color: TileColor.RED },
            { rank: 1, color: TileColor.YELLOW },
          ],
          remainingTiles: [{ rank: 2, color: TileColor.BLUE }],
        },
      });

      // act
      let error: Error | null = null;
      try {
        await new RummikubGameService().rearrangeTiles(user1Id, gameId, [
          { rank: 2, color: TileColor.BLUE },
        ]);
      } catch (e) {
        error = e;
      }

      // assert
      expect(error).toBeInstanceOf(ValidationError);
      expect(error?.message).toEqual(
        'Validation errors: "Cannot rearrange tiles while have update sets in progress."'
      );
    });

    it("succeeds if passed in tiles are equivalent to existing tiles", async () => {
      // arrange
      const {
        userIds: [user1Id, user2Id],
        gameId,
      } = await createTestRummikubGame({
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
      expect(updatedGame.players).toEqual([
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
