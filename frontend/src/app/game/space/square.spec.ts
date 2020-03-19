import SquareSpace from "./square";
import { IBoard } from "../intefaces";
import Konva from "konva";
import { Vector2d } from "konva/types/types";

describe("SquareSpace", function() {
  let squareSpace: SquareSpace;

  beforeEach(function() {
    const board: Partial<IBoard> = { getSpaceSize: () => 10 };
    squareSpace = new SquareSpace({
      board: board as IBoard,
      displayCoordinate: { x: 1, y: 2 }
    });
  });

  describe("initElement", function() {
    it("returns a rect", function() {
      // Arrange

      // Act
      const result = squareSpace.initElement();

      // Assert
      expect(result).toBeInstanceOf(Konva.Rect);
      expect(result.stroke()).toEqual("#000");
      expect(result.strokeWidth()).toEqual(1);
    });
  });

  describe("updateElementSize", function() {
    it("sets the radius", function() {
      // Arrange
      const element = squareSpace.initElement();
      const offsetSpy = spyOn(element, "offset");
      const heightSpy = spyOn(element, "height");
      const widthSpy = spyOn(element, "width");

      // Act
      squareSpace.updateElementSize(element, 10);

      // Assert
      expect(offsetSpy).toHaveBeenCalledWith({ x: 5, y: 5 });
      expect(heightSpy).toHaveBeenCalledWith(10);
      expect(widthSpy).toHaveBeenCalledWith(10);
    });
  });

  describe("terrainOffset", () => {
    it("returns 0,0", function() {
      expect(squareSpace.terrainOffset()).toEqual({ x: 0, y: 0 });
    });
  });

  describe("#contains", function() {
    const center: Vector2d = { x: 10, y: 10 };
    const size: number = 10;

    it("returns true if in the space", function() {
      expect(squareSpace.elementContains(center, size, { x: 5, y: 5 })).toEqual(
        true
      );
      expect(
        squareSpace.elementContains(center, size, { x: 5, y: 15 })
      ).toEqual(true);
      expect(
        squareSpace.elementContains(center, size, { x: 15, y: 15 })
      ).toEqual(true);
      expect(
        squareSpace.elementContains(center, size, { x: 15, y: 5 })
      ).toEqual(true);
      expect(
        squareSpace.elementContains(center, size, { x: 10, y: 10 })
      ).toEqual(true);
    });

    it("returns false otherwise", function() {
      expect(squareSpace.elementContains(center, size, { x: 8, y: 4 })).toEqual(
        false
      );
      expect(squareSpace.elementContains(center, size, { x: 4, y: 8 })).toEqual(
        false
      );
      expect(
        squareSpace.elementContains(center, size, { x: 16, y: 8 })
      ).toEqual(false);
      expect(
        squareSpace.elementContains(center, size, { x: 8, y: 16 })
      ).toEqual(false);
    });
  });
});
