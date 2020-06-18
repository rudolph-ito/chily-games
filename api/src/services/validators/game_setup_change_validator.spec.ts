import { expect } from "chai";
import { describe, it } from "mocha";
import {
  validateGameSetupChange,
  IValidateGameSetupChangeOptions,
} from "./game_setup_change_validator";
import { HexagonalBoard } from "../game/board/hexagonal_board";
import { CoordinateMap } from "../game/storage/coordinate_map";
import { PieceType } from "../../shared/dtos/piece_rule";
import { TerrainType } from "../../shared/dtos/terrain_rule";
import { PlayerColor } from "../../shared/dtos/game";

describe("validateGameSetupChange", () => {
  it("returns error if no piece change or terrain change", () => {
    // Arrange
    const board = new HexagonalBoard(3);
    const options: IValidateGameSetupChangeOptions = {
      board,
      coordinateMap: new CoordinateMap(board.getAllCoordinates()),
      change: {},
      pieceTypeCountMap: new Map<PieceType, number>([[PieceType.KING, 1]]),
      playerColor: PlayerColor.ALABASTER,
      terrainTypeCountMap: new Map<TerrainType, number>([]),
    };

    // Act
    const error = validateGameSetupChange(options);

    // Assert
    expect(error).to.eql(
      "Setup change must exactly one piece change or terrain change"
    );
  });

  it("returns null if happy path adding a piece", () => {
    // Arrange
    const board = new HexagonalBoard(3);
    const options: IValidateGameSetupChangeOptions = {
      board,
      coordinateMap: new CoordinateMap(board.getAllCoordinates()),
      change: {
        pieceChange: {
          pieceTypeId: PieceType.KING,
          to: { x: 0, y: -1 },
        },
      },
      pieceTypeCountMap: new Map<PieceType, number>([[PieceType.KING, 1]]),
      playerColor: PlayerColor.ALABASTER,
      terrainTypeCountMap: new Map<TerrainType, number>([]),
    };

    // Act
    const error = validateGameSetupChange(options);

    // Assert
    expect(error).to.eql(null);
  });

  it("returns null if happy path deleting a piece", () => {
    // Arrange
    const board = new HexagonalBoard(3);
    const coordinateMap = new CoordinateMap(board.getAllCoordinates());
    coordinateMap.addPiece(
      { x: 0, y: -1 },
      { pieceTypeId: PieceType.KING, playerColor: PlayerColor.ALABASTER }
    );
    const options: IValidateGameSetupChangeOptions = {
      board,
      coordinateMap,
      change: {
        pieceChange: {
          from: { x: 0, y: -1 },
          pieceTypeId: PieceType.KING,
        },
      },
      pieceTypeCountMap: new Map<PieceType, number>([[PieceType.KING, 1]]),
      playerColor: PlayerColor.ALABASTER,
      terrainTypeCountMap: new Map<TerrainType, number>([]),
    };

    // Act
    const error = validateGameSetupChange(options);

    // Assert
    expect(error).to.eql(null);
  });

  it("returns null if happy path moving a piece", () => {
    // Arrange
    const board = new HexagonalBoard(3);
    const coordinateMap = new CoordinateMap(board.getAllCoordinates());
    coordinateMap.addPiece(
      { x: 0, y: -1 },
      { pieceTypeId: PieceType.KING, playerColor: PlayerColor.ALABASTER }
    );
    const options: IValidateGameSetupChangeOptions = {
      board,
      coordinateMap,
      change: {
        pieceChange: {
          from: { x: 0, y: -1 },
          pieceTypeId: PieceType.KING,
          to: { x: 0, y: -2 },
        },
      },
      pieceTypeCountMap: new Map<PieceType, number>([[PieceType.KING, 1]]),
      playerColor: PlayerColor.ALABASTER,
      terrainTypeCountMap: new Map<TerrainType, number>([]),
    };

    // Act
    const error = validateGameSetupChange(options);

    // Assert
    expect(error).to.eql(null);
  });
});
