import Space from ".";
import Konva from "konva";
import { Vector2d } from "konva/types/types";

export default class SquareSpace extends Space {
  // ###########################################################
  // Overriden methods
  // ###########################################################

  initElement(): Konva.Rect {
    return new Konva.Rect({
      stroke: "#000",
      strokeWidth: 1
    });
  }

  updateElementSize(element: Konva.Shape, size: number): void {
    element.offset({ x: size / 2, y: size / 2 });
    element.width(size);
    element.height(size);
  }

  elementContains(
    center: Vector2d,
    size: number,
    coordinate: Vector2d
  ): boolean {
    const leftX = center.x - size / 2;
    const rightX = leftX + size;

    const topY = center.y - size / 2;
    const bottomY = topY + size;

    return (
      leftX <= coordinate.x &&
      coordinate.x <= rightX &&
      topY <= coordinate.y &&
      coordinate.y <= bottomY
    );
  }

  terrainOffset(): Vector2d {
    return { x: 0, y: 0 };
  }
}
