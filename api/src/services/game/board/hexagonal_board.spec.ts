import { HexagonalBoard } from "./hexagonal_board";
import { expect } from "chai";
import { describe, it } from "mocha";

describe("HexagonalBoard", () => {
  describe("getCoordinateDistance", () => {
    it("returns correct value for orthogonal line (horizontal)", () => {
      // Arrange
      const board = new HexagonalBoard(6);
      const coordinateA = { x: 1, y: 0 };
      const coordinateB = { x: -3, y: 0 };

      // Act
      const distance = board.getCoordinateDistance(coordinateA, coordinateB);

      // Assert
      expect(distance).to.eql(4);
    });

    it("returns correct value for orthogonal line (diagonal)", () => {
      // Arrange
      const board = new HexagonalBoard(6);
      const coordinateA = { x: 1, y: -1 };
      const coordinateB = { x: -3, y: 3 };

      // Act
      const distance = board.getCoordinateDistance(coordinateA, coordinateB);

      // Assert
      expect(distance).to.eql(4);
    });

    it("returns correct value for orthogonal with turns", () => {
      // Arrange
      const board = new HexagonalBoard(6);
      const coordinateA = { x: -1, y: 0 };
      const coordinateB = { x: 1, y: 2 };

      // Act
      const distance = board.getCoordinateDistance(coordinateA, coordinateB);

      // Assert
      expect(distance).to.eql(4);
    });
  });
});
