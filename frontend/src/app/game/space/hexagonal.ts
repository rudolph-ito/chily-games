import Space from ".";
import Konva from "konva";
import { Vector2d } from "konva/types/types";

export default class HexagonalSpace extends Space {
  // ###########################################################
  // Overriden methods
  // ###########################################################

  initElement(): Konva.RegularPolygon {
    return new Konva.RegularPolygon({
      radius: 1,
      sides: 6,
      stroke: "#000",
      strokeWidth: 1
    });
  }

  updateElementSize(element: Konva.RegularPolygon, size: number): void {
    element.radius(size / 2);
  }

  elementContains(
    center: Vector2d,
    size: number,
    coordinate: Vector2d
  ): boolean {
    return (
      this.distance(center, coordinate) <= (size / 2) * Math.cos(Math.PI / 6)
    );
  }

  terrainOffset(width: number, height: number): Vector2d {
    return { x: width / 2, y: height / 2 };
  }

  // ###########################################################
  // Helpers
  // ###########################################################

  distance(point1: Vector2d, point2: Vector2d): number {
    return Math.sqrt(
      Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2)
    );
  }
}
