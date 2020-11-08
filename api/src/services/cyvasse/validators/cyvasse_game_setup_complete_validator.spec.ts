import { expect } from "chai";
import { describe, it } from "mocha";
import { CyvasseHexagonalBoard } from "../game/board/cyvasse_hexagonal_board";
import { CyvasseCoordinateMap } from "../game/storage/cyvasse_coordinate_map";
import { PieceType, IPieceRule } from "../../../shared/dtos/piece_rule";
import { TerrainType, ITerrainRule } from "../../../shared/dtos/terrain_rule";
import {
  IValidateGameSetupCompleteOptions,
  validateGameSetupComplete,
} from "./cyvasse_game_setup_complete_validator";
import { PlayerColor } from "../../../shared/dtos/game";
import { mockPieceRule, mockTerrainRule } from "../../../../test/mocks";

describe("Cyvasse - validateGameSetupComplete", () => {
  it("returns null if has correct pieces / terrains", () => {
    // Arrange
    const board = new CyvasseHexagonalBoard(3);
    const pieceRule = mockPieceRule({ pieceTypeId: PieceType.KING, count: 1 });
    const terrainRule = mockTerrainRule({
      terrainTypeId: TerrainType.FOREST,
      count: 1,
    });
    const coordinateMap = new CyvasseCoordinateMap(board.getAllCoordinates());
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
      pieceRuleMap: new Map<PieceType, IPieceRule>([
        [pieceRule.pieceTypeId, pieceRule],
      ]),
      terrainRuleMap: new Map<TerrainType, ITerrainRule>([
        [terrainRule.terrainTypeId, terrainRule],
      ]),
    };

    // Act
    const error = validateGameSetupComplete(options);

    // Assert
    expect(error).to.eql(null);
  });

  it("returns error if missing piece (expected 1)", () => {
    // Arrange
    const board = new CyvasseHexagonalBoard(3);
    const pieceRule = mockPieceRule({ pieceTypeId: PieceType.KING, count: 1 });
    const options: IValidateGameSetupCompleteOptions = {
      coordinateMap: new CyvasseCoordinateMap(board.getAllCoordinates()),
      pieceRuleMap: new Map<PieceType, IPieceRule>([
        [pieceRule.pieceTypeId, pieceRule],
      ]),
      terrainRuleMap: new Map<TerrainType, ITerrainRule>(),
    };

    // Act
    const error = validateGameSetupComplete(options);

    // Assert
    expect(error).to.eql("Should have 1 king (has 0)");
  });

  it("returns error if missing piece (expected more than 1)", () => {
    // Arrange
    const board = new CyvasseHexagonalBoard(3);
    const pieceRule = mockPieceRule({
      pieceTypeId: PieceType.CROSSBOW,
      count: 3,
    });
    const coordinateMap = new CyvasseCoordinateMap(board.getAllCoordinates());
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
      pieceRuleMap: new Map<PieceType, IPieceRule>([
        [pieceRule.pieceTypeId, pieceRule],
      ]),
      terrainRuleMap: new Map<TerrainType, ITerrainRule>(),
    };

    // Act
    const error = validateGameSetupComplete(options);

    // Assert
    expect(error).to.eql("Should have 3 crossbows (has 2)");
  });

  it("returns error if missing terrain (expected 1)", () => {
    // Arrange
    const board = new CyvasseHexagonalBoard(3);
    const terrainRule = mockTerrainRule({
      terrainTypeId: TerrainType.FOREST,
      count: 1,
    });
    const options: IValidateGameSetupCompleteOptions = {
      coordinateMap: new CyvasseCoordinateMap(board.getAllCoordinates()),
      pieceRuleMap: new Map<PieceType, IPieceRule>(),
      terrainRuleMap: new Map<TerrainType, ITerrainRule>([
        [terrainRule.terrainTypeId, terrainRule],
      ]),
    };

    // Act
    const error = validateGameSetupComplete(options);

    // Assert
    expect(error).to.eql("Should have 1 forest (has 0)");
  });

  it("returns error if missing terrain (expected more than 1)", () => {
    // Arrange
    const board = new CyvasseHexagonalBoard(3);
    const terrainRule = mockTerrainRule({
      terrainTypeId: TerrainType.FOREST,
      count: 3,
    });
    const coordinateMap = new CyvasseCoordinateMap(board.getAllCoordinates());
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
      pieceRuleMap: new Map<PieceType, IPieceRule>(),
      terrainRuleMap: new Map<TerrainType, ITerrainRule>([
        [terrainRule.terrainTypeId, terrainRule],
      ]),
    };

    // Act
    const error = validateGameSetupComplete(options);

    // Assert
    expect(error).to.eql("Should have 3 forests (has 2)");
  });

  it("returns error if missing piece and terrain", () => {
    // Arrange
    const board = new CyvasseHexagonalBoard(3);
    const pieceRule = mockPieceRule({ pieceTypeId: PieceType.KING, count: 1 });
    const terrainRule = mockTerrainRule({
      terrainTypeId: TerrainType.FOREST,
      count: 1,
    });
    const options: IValidateGameSetupCompleteOptions = {
      coordinateMap: new CyvasseCoordinateMap(board.getAllCoordinates()),
      pieceRuleMap: new Map<PieceType, IPieceRule>([
        [pieceRule.pieceTypeId, pieceRule],
      ]),
      terrainRuleMap: new Map<TerrainType, ITerrainRule>([
        [terrainRule.terrainTypeId, terrainRule],
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
