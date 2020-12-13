import {
  PieceType,
  CaptureType,
  PathType,
  IPathConfiguration,
  IPieceRuleOptions,
} from "../../../../shared/dtos/cyvasse/piece_rule";
import { IVariant, BoardType } from "../../../../shared/dtos/cyvasse/variant";
import {
  ValidPlies,
  PlyEvaluationFlag,
} from "../../../../shared/dtos/cyvasse/game";
import { expect } from "chai";
import { describe, it } from "mocha";
import { previewPieceRule } from "./cyvasse_ply_preview";

function getMockVariant(data: Partial<IVariant>): IVariant {
  return {
    boardSize: 5,
    boardType: BoardType.HEXAGONAL,
    boardRows: null,
    boardColumns: null,
    pieceRanks: false,
    supportType: null,
    userId: 1,
    variantId: 1,
    ...data,
  };
}

function testDirectionalMovement(
  variant: IVariant,
  movement: IPathConfiguration
): ValidPlies {
  const pieceRule: IPieceRuleOptions = {
    pieceTypeId: PieceType.CATAPULT,
    count: 1,
    movement,
    captureType: CaptureType.MOVEMENT,
  };
  const result = previewPieceRule({
    evaluationType: CaptureType.MOVEMENT,
    pieceRule,
    variant,
  });
  return result.validPlies;
}

describe("CyvassePlyCalculator", () => {
  describe("hexagonal board, piece alone in the center", () => {
    it("board size 3, orthogonal line (1-2)", () => {
      // Arrange
      const variant = getMockVariant({
        boardType: BoardType.HEXAGONAL,
        boardSize: 3,
      });
      const movement: IPathConfiguration = {
        type: PathType.ORTHOGONAL_LINE,
        minimum: 1,
        maximum: 2,
      };

      // Act
      const validPlies = testDirectionalMovement(variant, movement);

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

    it("board size 3, orthogonal with turns (1-2)", () => {
      // Arrange
      const variant = getMockVariant({
        boardType: BoardType.HEXAGONAL,
        boardSize: 3,
      });
      const movement: IPathConfiguration = {
        type: PathType.ORTHOGONAL_WITH_TURNS,
        minimum: 1,
        maximum: 2,
      };

      // Act
      const validPlies = testDirectionalMovement(variant, movement);

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

    it("board size 4, diagonal line (1-2)", () => {
      // Arrange
      const variant = getMockVariant({
        boardType: BoardType.HEXAGONAL,
        boardSize: 4,
      });
      const movement: IPathConfiguration = {
        type: PathType.DIAGONAL_LINE,
        minimum: 1,
        maximum: 2,
      };

      // Act
      const validPlies = testDirectionalMovement(variant, movement);

      // Assert
      expect(validPlies[PlyEvaluationFlag.FREE]).to.have.deep.members([
        { x: 1, y: 1 },
        { x: 2, y: 2 },
        { x: -1, y: -1 },
        { x: -2, y: -2 },
        { x: 1, y: -2 },
        { x: 2, y: -4 },
        { x: -1, y: 2 },
        { x: -2, y: 4 },
        { x: 2, y: -1 },
        { x: 4, y: -2 },
        { x: -2, y: 1 },
        { x: -4, y: 2 },
      ]);
      expect(validPlies[PlyEvaluationFlag.CAPTURABLE]).to.have.members([]);
      expect(validPlies[PlyEvaluationFlag.REACHABLE]).to.have.members([]);
    });

    it("board size 4, diagonal with turns (1-2)", () => {
      // Arrange
      const variant = getMockVariant({
        boardType: BoardType.HEXAGONAL,
        boardSize: 4,
      });
      const movement: IPathConfiguration = {
        type: PathType.DIAGONAL_WITH_TURNS,
        minimum: 1,
        maximum: 2,
      };

      // Act
      const validPlies = testDirectionalMovement(variant, movement);

      // Assert
      expect(validPlies[PlyEvaluationFlag.FREE]).to.have.deep.members([
        { x: 1, y: 1 },
        { x: 2, y: 2 },
        { x: 0, y: 3 },
        { x: 3, y: 0 },
        { x: -1, y: -1 },
        { x: -2, y: -2 },
        { x: 0, y: -3 },
        { x: -3, y: 0 },
        { x: 1, y: -2 },
        { x: 2, y: -4 },
        { x: 3, y: -3 },
        { x: -1, y: 2 },
        { x: -2, y: 4 },
        { x: -3, y: 3 },
        { x: 2, y: -1 },
        { x: 4, y: -2 },
        { x: -2, y: 1 },
        { x: -4, y: 2 },
      ]);
      expect(validPlies[PlyEvaluationFlag.CAPTURABLE]).to.have.members([]);
      expect(validPlies[PlyEvaluationFlag.REACHABLE]).to.have.members([]);
    });
  });

  describe("square board, piece alone in the center", () => {
    it("board size 5x5, orthogonal line (1-2)", () => {
      // Arrange
      const variant = getMockVariant({
        boardType: BoardType.SQUARE,
        boardColumns: 5,
        boardRows: 5,
      });
      const movement: IPathConfiguration = {
        type: PathType.ORTHOGONAL_LINE,
        minimum: 1,
        maximum: 2,
      };

      // Act
      const validPlies = testDirectionalMovement(variant, movement);

      // Assert
      expect(validPlies[PlyEvaluationFlag.FREE]).to.have.deep.members([
        { x: 3, y: 2 },
        { x: 4, y: 2 },
        { x: 1, y: 2 },
        { x: 0, y: 2 },
        { x: 2, y: 3 },
        { x: 2, y: 4 },
        { x: 2, y: 1 },
        { x: 2, y: 0 },
      ]);
      expect(validPlies[PlyEvaluationFlag.CAPTURABLE]).to.have.members([]);
      expect(validPlies[PlyEvaluationFlag.REACHABLE]).to.have.members([]);
    });

    it("board size 5x5, orthogonal with turns (1-2)", () => {
      // Arrange
      const variant = getMockVariant({
        boardType: BoardType.SQUARE,
        boardColumns: 5,
        boardRows: 5,
      });
      const movement: IPathConfiguration = {
        type: PathType.ORTHOGONAL_WITH_TURNS,
        minimum: 1,
        maximum: 2,
      };

      // Act
      const validPlies = testDirectionalMovement(variant, movement);

      // Assert
      expect(validPlies[PlyEvaluationFlag.FREE]).to.have.deep.members([
        { x: 3, y: 2 },
        { x: 4, y: 2 },
        { x: 3, y: 3 },
        { x: 3, y: 1 },
        { x: 1, y: 2 },
        { x: 0, y: 2 },
        { x: 1, y: 3 },
        { x: 1, y: 1 },
        { x: 2, y: 3 },
        { x: 2, y: 4 },
        { x: 2, y: 1 },
        { x: 2, y: 0 },
      ]);
      expect(validPlies[PlyEvaluationFlag.CAPTURABLE]).to.have.members([]);
      expect(validPlies[PlyEvaluationFlag.REACHABLE]).to.have.members([]);
    });
  });
});
