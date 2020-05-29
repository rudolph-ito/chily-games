import { PlyCalculator } from "./";
import { CoordinateMap } from "../storage/coordinate_map";
import { HexagonalBoard } from "../board/hexagonal_board";
import { TerrainType, ITerrainRule } from "../../../shared/dtos/terrain_rule";
import {
  IPieceRule,
  PieceType,
  CaptureType,
  PathType,
} from "../../../shared/dtos/piece_rule";
import { SupportType } from "../../../shared/dtos/variant";
import { PlayerColor, IPiece } from "../../../shared/dtos/game";
import { expect } from "chai";
import { PlyEvaluationFlag } from "./types";

describe("PlyCalculator", () => {
  describe("hexagonal board, piece alone in the center", () => {
    it("orthogonal line (1-2)", () => {
      // Arrange
      const board = new HexagonalBoard(3);
      const coordinateMap = new CoordinateMap(board.getAllCoordinates());
      const pieceTypeId = PieceType.CATAPULT;
      const piece: IPiece = { pieceTypeId, playerColor: PlayerColor.alabaster };
      const pieceRule: IPieceRule = {
        pieceRuleId: 1,
        pieceTypeId,
        variantId: 1,
        count: 1,
        movement: {
          type: PathType.ORTHOGONAL_LINE,
          minimum: 1,
          maximum: 2,
        },
        captureType: CaptureType.MOVEMENT,
      };
      const coordinate = board.getCenter();
      coordinateMap.addPiece(coordinate, piece);
      const plyCalculator = new PlyCalculator({
        coordinateMap: new CoordinateMap(board.getAllCoordinates()),
        gameRules: {
          board,
          pieceRanks: false,
          pieceRuleMap: new Map<PieceType, IPieceRule>([
            [pieceTypeId, pieceRule],
          ]),
          supportType: SupportType.NONE,
          terrainRuleMap: new Map<TerrainType, ITerrainRule>(),
        },
      });

      // Act
      const validPlies = plyCalculator.getValidPlies({
        piece,
        coordinate,
        evaluationType: CaptureType.MOVEMENT,
      });

      // Assert
      expect(validPlies[PlyEvaluationFlag.FREE]).to.have.deep.members([
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: -1, y: 0 },
        { x: -2, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: 2 },
        { x: 0, y: -1 },
        { x: 0, y: -2 },
        { x: 1, y: -1 },
        { x: 2, y: -2 },
        { x: -1, y: 1 },
        { x: -2, y: 2 },
      ]);
      expect(validPlies[PlyEvaluationFlag.CAPTURABLE]).to.have.members([]);
      expect(validPlies[PlyEvaluationFlag.REACHABLE]).to.have.members([]);
    });

    it("orthogonal with turns (1-2)", () => {
      // Arrange
      const board = new HexagonalBoard(3);
      const coordinateMap = new CoordinateMap(board.getAllCoordinates());
      const pieceTypeId = PieceType.CATAPULT;
      const piece: IPiece = { pieceTypeId, playerColor: PlayerColor.alabaster };
      const pieceRule: IPieceRule = {
        pieceRuleId: 1,
        pieceTypeId,
        variantId: 1,
        count: 1,
        movement: {
          type: PathType.ORTHOGONAL_WITH_TURNS,
          minimum: 1,
          maximum: 2,
        },
        captureType: CaptureType.MOVEMENT,
      };
      const coordinate = board.getCenter();
      coordinateMap.addPiece(coordinate, piece);
      const plyCalculator = new PlyCalculator({
        coordinateMap: new CoordinateMap(board.getAllCoordinates()),
        gameRules: {
          board,
          pieceRanks: false,
          pieceRuleMap: new Map<PieceType, IPieceRule>([
            [pieceTypeId, pieceRule],
          ]),
          supportType: SupportType.NONE,
          terrainRuleMap: new Map<TerrainType, ITerrainRule>(),
        },
      });

      // Act
      const validPlies = plyCalculator.getValidPlies({
        piece,
        coordinate,
        evaluationType: CaptureType.MOVEMENT,
      });

      // Assert
      expect(validPlies[PlyEvaluationFlag.FREE]).to.have.deep.members([
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: -1 },
        { x: -1, y: 0 },
        { x: -2, y: 0 },
        { x: -1, y: -1 },
        { x: -2, y: 1 },
        { x: 0, y: 1 },
        { x: 0, y: 2 },
        { x: -1, y: 2 },
        { x: 0, y: -1 },
        { x: 0, y: -2 },
        { x: 1, y: -2 },
        { x: 1, y: -1 },
        { x: 2, y: -2 },
        { x: -1, y: 1 },
        { x: -2, y: 2 },
      ]);
      expect(validPlies[PlyEvaluationFlag.CAPTURABLE]).to.have.members([]);
      expect(validPlies[PlyEvaluationFlag.REACHABLE]).to.have.members([]);
    });
  });
});
