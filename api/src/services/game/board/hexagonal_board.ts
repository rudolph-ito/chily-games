import { ICoordinate } from "../../../shared/dtos/game";
import {
  ICoordinateUpdater,
  BoardDirection,
  SetupTerritoryOwner,
  IBoard,
} from ".";

interface IRange {
  min: number;
  max: number;
}

export class HexagonalBoard implements IBoard {
  private readonly size: number;

  constructor(size: number) {
    this.size = size;
  }

  getAllCoordinates(): ICoordinate[] {
    const result: ICoordinate[] = [];
    const range = this.getCoordinateRange();
    for (let x = range.min; x <= range.max; x++) {
      for (let y = range.min; y <= range.max; y++) {
        const coordinate = { x, y };
        if (this.isCoordinateValid(coordinate)) {
          result.push(coordinate);
        }
      }
    }
    return result;
  }

  getCenter(): ICoordinate {
    return { x: 0, y: 0 };
  }

  getCoordinateDistance(
    coordinate1: ICoordinate,
    coordinate2: ICoordinate
  ): number {
    const xDiff = coordinate1.x - coordinate2.x;
    const yDiff = coordinate1.y - coordinate2.y;
    const diagonalDiff = xDiff + yDiff;
    return Math.max(...[xDiff, yDiff, diagonalDiff].map((x) => Math.abs(x)));
  }

  getDirectionalFunctions(type: BoardDirection): ICoordinateUpdater[] {
    if (type === BoardDirection.orthogonal) {
      return [
        (coordinate) => ({ x: coordinate.x + 1, y: coordinate.y }),
        (coordinate) => ({ x: coordinate.x - 1, y: coordinate.y }),
        (coordinate) => ({ x: coordinate.x, y: coordinate.y + 1 }),
        (coordinate) => ({ x: coordinate.x, y: coordinate.y - 1 }),
        (coordinate) => ({ x: coordinate.x + 1, y: coordinate.y - 1 }),
        (coordinate) => ({ x: coordinate.x - 1, y: coordinate.y + 1 }),
      ];
    }
    if (type === BoardDirection.diagonal) {
      return [
        (coordinate) => ({ x: coordinate.x + 1, y: coordinate.y + 1 }),
        (coordinate) => ({ x: coordinate.x - 1, y: coordinate.y - 1 }),
        (coordinate) => ({ x: coordinate.x + 1, y: coordinate.y - 2 }),
        (coordinate) => ({ x: coordinate.x - 1, y: coordinate.y + 2 }),
        (coordinate) => ({ x: coordinate.x + 2, y: coordinate.y - 1 }),
        (coordinate) => ({ x: coordinate.x - 2, y: coordinate.y + 1 }),
      ];
    }
    throw Error("Unsupported board direction");
  }

  getSetupTerritoryOwner(coordinate: ICoordinate): SetupTerritoryOwner {
    if (coordinate.y === 0) {
      return SetupTerritoryOwner.neutral;
    }
    if (coordinate.y < 0) {
      return SetupTerritoryOwner.alabaster;
    }
    return SetupTerritoryOwner.onyx;
  }

  isCoordinateValid(coordinate: ICoordinate): boolean {
    const range = this.getCoordinateRange();
    const sum = coordinate.x + coordinate.y;
    return (
      this.isBetween(coordinate.x, range.min, range.max) &&
      this.isBetween(coordinate.y, range.min, range.max) &&
      this.isBetween(sum, range.min, range.max)
    );
  }

  private isBetween(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }

  private getCoordinateRange(): IRange {
    return { min: -1 * this.size, max: this.size };
  }
}
