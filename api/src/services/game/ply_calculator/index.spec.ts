import {
  PieceType,
  CaptureType,
  PathType,
  IPathConfiguration,
  IPieceRuleOptions,
} from "../../../shared/dtos/piece_rule";
import { IVariant, BoardType } from "../../../shared/dtos/variant";
import { ValidPlies, PlyEvaluationFlag } from "../../../shared/dtos/game";
import { expect } from "chai";
import { describe, it } from "mocha";
import { previewPieceRule } from "./preview";

function getMockVariant(data: Partial<IVariant>): IVariant {
  return {
    boardSize: 5,
    boardType: BoardType.HEXAGONAL,
    pieceRanks: false,
    userId: 1,
    variantId: 1,
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

describe("PlyCalculator", () => {
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
});
