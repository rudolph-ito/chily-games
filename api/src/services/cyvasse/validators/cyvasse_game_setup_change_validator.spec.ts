import { expect } from "chai";
import { describe, it } from "mocha";
import {
  validateGameSetupChange,
  IValidateGameSetupChangeOptions,
} from "./cyvasse_game_setup_change_validator";
import { HexagonalBoard } from "../game/board/hexagonal_board";
import { CoordinateMap } from "../game/storage/coordinate_map";
import { PieceType, IPieceRule } from "../../../shared/dtos/piece_rule";
import { TerrainType, ITerrainRule } from "../../../shared/dtos/terrain_rule";
import { PlayerColor } from "../../../shared/dtos/game";
import { mockPieceRule } from "../../../../test/mocks";

describe("validateGameSetupChange", () => {
  it("returns error if no piece change or terrain change", () => {
    // Arrange
    const board = new HexagonalBoard(3);
    const pieceRule = mockPieceRule({ pieceTypeId: PieceType.KING, count: 1 });
    const options: IValidateGameSetupChangeOptions = {
      board,
      coordinateMap: new CoordinateMap(board.getAllCoordinates()),
      change: {},
      pieceRuleMap: new Map<PieceType, IPieceRule>([
        [pieceRule.pieceTypeId, pieceRule],
      ]),
      playerColor: PlayerColor.ALABASTER,
      terrainRuleMap: new Map<TerrainType, ITerrainRule>([]),
    };

    // Act
    const error = validateGameSetupChange(options);

    // Assert
    expect(error).to.eql(
      "Must have exactly one piece change or terrain change"
    );
  });

  it("returns null if happy path adding a piece", () => {
    // Arrange
    const board = new HexagonalBoard(3);
    const pieceRule = mockPieceRule({ pieceTypeId: PieceType.KING, count: 1 });
    const options: IValidateGameSetupChangeOptions = {
      board,
      coordinateMap: new CoordinateMap(board.getAllCoordinates()),
      change: {
        pieceChange: {
          pieceTypeId: PieceType.KING,
          to: { x: 0, y: -1 },
        },
      },
      pieceRuleMap: new Map<PieceType, IPieceRule>([
        [pieceRule.pieceTypeId, pieceRule],
      ]),
      playerColor: PlayerColor.ALABASTER,
      terrainRuleMap: new Map<TerrainType, ITerrainRule>([]),
    };

    // Act
    const error = validateGameSetupChange(options);

    // Assert
    expect(error).to.eql(null);
  });

  it("returns null if happy path deleting a piece", () => {
    // Arrange
    const board = new HexagonalBoard(3);
    const pieceRule = mockPieceRule({ pieceTypeId: PieceType.KING, count: 1 });
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
      pieceRuleMap: new Map<PieceType, IPieceRule>([
        [pieceRule.pieceTypeId, pieceRule],
      ]),
      playerColor: PlayerColor.ALABASTER,
      terrainRuleMap: new Map<TerrainType, ITerrainRule>([]),
    };

    // Act
    const error = validateGameSetupChange(options);

    // Assert
    expect(error).to.eql(null);
  });

  it("returns null if happy path moving a piece", () => {
    // Arrange
    const board = new HexagonalBoard(3);
    const pieceRule = mockPieceRule({ pieceTypeId: PieceType.KING, count: 1 });
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
      pieceRuleMap: new Map<PieceType, IPieceRule>([
        [pieceRule.pieceTypeId, pieceRule],
      ]),
      playerColor: PlayerColor.ALABASTER,
      terrainRuleMap: new Map<TerrainType, ITerrainRule>([]),
    };

    // Act
    const error = validateGameSetupChange(options);

    // Assert
    expect(error).to.eql(null);
  });
});
