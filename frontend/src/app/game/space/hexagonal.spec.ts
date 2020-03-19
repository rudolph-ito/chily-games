import HexagonalSpace from "./hexagonal";
import { Vector2d } from "konva/types/types";
import Konva from "konva";
import { IBoard } from "../intefaces";

describe("HexagonalSpace", function() {
  let hexagonalSpace: HexagonalSpace;

  beforeEach(function() {
    const board: Partial<IBoard> = { getSpaceSize: () => 10 };
    hexagonalSpace = new HexagonalSpace({
      board: board as IBoard,
      displayCoordinate: { x: 1, y: 2 }
    });
  });

  describe("initElement", function() {
    it("returns a regular polygon", function() {
      // Arrange

      // Act
      const result = hexagonalSpace.initElement();

      // Assert
      expect(result).toBeInstanceOf(Konva.RegularPolygon);
      expect(result.radius()).toEqual(1);
      expect(result.sides()).toEqual(6);
      expect(result.stroke()).toEqual("#000");
      expect(result.strokeWidth()).toEqual(1);
    });
  });

  describe("updateElementSize", function() {
    it("sets the radius", function() {
      // Arrange
      const element = hexagonalSpace.initElement();
      const radiusSpy = spyOn(element, "radius");

      // Act
      hexagonalSpace.updateElementSize(element, 10);

      // Assert
      expect(radiusSpy).toHaveBeenCalledWith(5);
    });
  });

  describe("terrainOffset", () => {
    it("returns inputs divided by 2", function() {
      expect(hexagonalSpace.terrainOffset(10, 10)).toEqual({ x: 5, y: 5 });
      expect(hexagonalSpace.terrainOffset(25, 25)).toEqual({
        x: 12.5,
        y: 12.5
      });
    });
  });

  describe("elementContains", function() {
    const center: Vector2d = { x: 10, y: 10 };
    const size: number = 10;

    const trueExamples: Vector2d[] = [
      { x: 10, y: 10 },
      { x: 13, y: 12 },
      { x: 8, y: 7 }
    ];
    trueExamples.forEach(example => {
      it(`returns true if in the space (${JSON.stringify(
        example
      )})`, function() {
        expect(hexagonalSpace.elementContains(center, size, example)).toEqual(
          true
        );
      });
    });

    const falseExamples: Vector2d[] = [
      { x: 15, y: 12 },
      { x: 5, y: 4 }
    ];
    falseExamples.forEach(example => {
      it(`returns false otherwise (${JSON.stringify(example)})`, function() {
        expect(hexagonalSpace.elementContains(center, size, example)).toEqual(
          false
        );
      });
    });
  });
});
