import { expect } from "chai";
import { describe, it } from "mocha";
import { HexagonalBoard } from "../game/board/hexagonal_board";
import { CoordinateMap } from "../game/storage/coordinate_map";
import { PieceType } from "../../shared/dtos/piece_rule";
import { TerrainType } from "../../shared/dtos/terrain_rule";
import {
  IValidateGameSetupCompleteOptions,
  validateGameSetupComplete,
} from "./game_setup_complete_validator";
import { PlayerColor } from "../../shared/dtos/game";

describe("validateGameSetupComplete", () => {
  it("returns null if has correct pieces / terrains", () => {
    // Arrange
    const board = new HexagonalBoard(3);
    const coordinateMap = new CoordinateMap(board.getAllCoordinates());
    coordinateMap.addPiece(
      { x: 0, y: -1 },
      { pieceTypeId: PieceType.KING, playerColor: PlayerColor.ALABASTER }
    );
    coordinateMap.addTerrain(
      { x: 0, y: -1 },
      { terrainTypeId: TerrainType.FOREST, playerColor: PlayerColor.ALABASTER }
    );
    const options: IValidateGameSetupCompleteOptions = {
      coordinateMap,
      pieceTypeCountMap: new Map<PieceType, number>([[PieceType.KING, 1]]),
      terrainTypeCountMap: new Map<TerrainType, number>([
        [TerrainType.FOREST, 1],
      ]),
    };

    // Act
    const error = validateGameSetupComplete(options);

    // Assert
    expect(error).to.eql(null);
  });

  it("returns error if missing piece (expected 1)", () => {
    // Arrange
    const board = new HexagonalBoard(3);
    const options: IValidateGameSetupCompleteOptions = {
      coordinateMap: new CoordinateMap(board.getAllCoordinates()),
      pieceTypeCountMap: new Map<PieceType, number>([[PieceType.KING, 1]]),
      terrainTypeCountMap: new Map<TerrainType, number>([]),
    };

    // Act
    const error = validateGameSetupComplete(options);

    // Assert
    expect(error).to.eql("Should have 1 king (has 0)");
  });

  it("returns error if missing piece (expected more than 1)", () => {
    // Arrange
    const board = new HexagonalBoard(3);
    const coordinateMap = new CoordinateMap(board.getAllCoordinates());
    coordinateMap.addPiece(
      { x: 0, y: -1 },
      { pieceTypeId: PieceType.CROSSBOW, playerColor: PlayerColor.ALABASTER }
    );
    coordinateMap.addPiece(
      { x: 1, y: -1 },
      { pieceTypeId: PieceType.CROSSBOW, playerColor: PlayerColor.ALABASTER }
    );
    const options: IValidateGameSetupCompleteOptions = {
      coordinateMap,
      pieceTypeCountMap: new Map<PieceType, number>([[PieceType.CROSSBOW, 3]]),
      terrainTypeCountMap: new Map<TerrainType, number>([]),
    };

    // Act
    const error = validateGameSetupComplete(options);

    // Assert
    expect(error).to.eql("Should have 3 crossbows (has 2)");
  });

  it("returns error if missing terrain (expected 1)", () => {
    // Arrange
    const board = new HexagonalBoard(3);
    const options: IValidateGameSetupCompleteOptions = {
      coordinateMap: new CoordinateMap(board.getAllCoordinates()),
      pieceTypeCountMap: new Map<PieceType, number>([]),
      terrainTypeCountMap: new Map<TerrainType, number>([
        [TerrainType.FOREST, 1],
      ]),
    };

    // Act
    const error = validateGameSetupComplete(options);

    // Assert
    expect(error).to.eql("Should have 1 forest (has 0)");
  });

  it("returns error if missing terrain (expected more than 1)", () => {
    // Arrange
    const board = new HexagonalBoard(3);
    const coordinateMap = new CoordinateMap(board.getAllCoordinates());
    coordinateMap.addTerrain(
      { x: 0, y: -1 },
      { terrainTypeId: TerrainType.FOREST, playerColor: PlayerColor.ALABASTER }
    );
    coordinateMap.addTerrain(
      { x: 1, y: -1 },
      { terrainTypeId: TerrainType.FOREST, playerColor: PlayerColor.ALABASTER }
    );
    const options: IValidateGameSetupCompleteOptions = {
      coordinateMap,
      pieceTypeCountMap: new Map<PieceType, number>([]),
      terrainTypeCountMap: new Map<TerrainType, number>([
        [TerrainType.FOREST, 3],
      ]),
    };

    // Act
    const error = validateGameSetupComplete(options);

    // Assert
    expect(error).to.eql("Should have 3 forests (has 2)");
  });

  it("returns error if missing piece and terrain", () => {
    // Arrange
    const board = new HexagonalBoard(3);
    const options: IValidateGameSetupCompleteOptions = {
      coordinateMap: new CoordinateMap(board.getAllCoordinates()),
      pieceTypeCountMap: new Map<PieceType, number>([[PieceType.KING, 1]]),
      terrainTypeCountMap: new Map<TerrainType, number>([
        [TerrainType.FOREST, 1],
      ]),
    };

    // Act
    const error = validateGameSetupComplete(options);

    // Assert
    expect(error).to.eql(
      "Should have 1 king (has 0), Should have 1 forest (has 0)"
    );
  });
});
