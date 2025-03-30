import {
  validateGameSetupChange,
  IValidateGameSetupChangeOptions,
} from "./cyvasse_game_setup_change_validator";
import { CyvasseHexagonalBoard } from "../game/board/cyvasse_hexagonal_board";
import { CyvasseCoordinateMap } from "../game/storage/cyvasse_coordinate_map";
import { PieceType, IPieceRule } from "../../../shared/dtos/cyvasse/piece_rule";
import {
  TerrainType,
  ITerrainRule,
} from "../../../shared/dtos/cyvasse/terrain_rule";
import { PlayerColor } from "../../../shared/dtos/cyvasse/game";
import { mockPieceRule } from "../../../../test/mocks";

describe("Cyvasse - validateGameSetupChange", () => {
  it("returns error if no piece change or terrain change", () => {
    // Arrange
    const board = new CyvasseHexagonalBoard(3);
    const pieceRule = mockPieceRule({ pieceTypeId: PieceType.KING, count: 1 });
    const options: IValidateGameSetupChangeOptions = {
      board,
      coordinateMap: new CyvasseCoordinateMap(board.getAllCoordinates()),
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
    expect(error).toEqual(
      "Must have exactly one piece change or terrain change"
    );
  });

  it("returns null if happy path adding a piece", () => {
    // Arrange
    const board = new CyvasseHexagonalBoard(3);
    const pieceRule = mockPieceRule({ pieceTypeId: PieceType.KING, count: 1 });
    const options: IValidateGameSetupChangeOptions = {
      board,
      coordinateMap: new CyvasseCoordinateMap(board.getAllCoordinates()),
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
    expect(error).toEqual(null);
  });

  it("returns null if happy path deleting a piece", () => {
    // Arrange
    const board = new CyvasseHexagonalBoard(3);
    const pieceRule = mockPieceRule({ pieceTypeId: PieceType.KING, count: 1 });
    const coordinateMap = new CyvasseCoordinateMap(board.getAllCoordinates());
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
    expect(error).toEqual(null);
  });

  it("returns null if happy path moving a piece", () => {
    // Arrange
    const board = new CyvasseHexagonalBoard(3);
    const pieceRule = mockPieceRule({ pieceTypeId: PieceType.KING, count: 1 });
    const coordinateMap = new CyvasseCoordinateMap(board.getAllCoordinates());
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
    expect(error).toEqual(null);
  });
});
