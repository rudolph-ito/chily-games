import { ICoordinate } from "../../../shared/dtos/game";
import {
  ICoordinateUpdater,
  BoardDirection,
  SetupTerritoryOwner,
  IBoard,
} from ".";

export class SquareBoard implements IBoard {
  private readonly columns: number;
  private readonly rows: number;

  constructor(columns: number, rows: number) {
    this.columns = columns;
    this.rows = rows;
  }

  getAllCoordinates(): ICoordinate[] {
    const result: ICoordinate[] = [];
    for (let x = 0; x <= this.columns; x++) {
      for (let y = 0; y <= this.rows; y++) {
        result.push({ x, y });
      }
    }
    return result;
  }

  getCenter(): ICoordinate {
    return { x: Math.floor(this.columns / 2), y: Math.floor(this.rows / 2) };
  }

  getCoordinateDistance(
    coordinate1: ICoordinate,
    coordinate2: ICoordinate
  ): number {
    const xDiff = coordinate1.x - coordinate2.x;
    const yDiff = coordinate1.y - coordinate2.y;
    return Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2));
  }

  getDirectionalFunctions(type: BoardDirection): ICoordinateUpdater[] {
    if (type === BoardDirection.orthogonal) {
      return [
        (coordinate) => ({ x: coordinate.x + 1, y: coordinate.y }),
        (coordinate) => ({ x: coordinate.x - 1, y: coordinate.y }),
        (coordinate) => ({ x: coordinate.x, y: coordinate.y + 1 }),
        (coordinate) => ({ x: coordinate.x, y: coordinate.y - 1 }),
      ];
    }
    if (type === BoardDirection.diagonal) {
      return [
        (coordinate) => ({ x: coordinate.x + 1, y: coordinate.y + 1 }),
        (coordinate) => ({ x: coordinate.x - 1, y: coordinate.y - 1 }),
        (coordinate) => ({ x: coordinate.x + 1, y: coordinate.y - 1 }),
        (coordinate) => ({ x: coordinate.x - 1, y: coordinate.y + 1 }),
      ];
    }
    throw Error("Unsupported board direction");
  }

  getSetupTerritoryOwner(coordinate: ICoordinate): SetupTerritoryOwner {
    if (
      Math.floor(this.rows / 2) !== this.rows / 2 &&
      coordinate.y === Math.floor(this.rows / 2)
    ) {
      return SetupTerritoryOwner.neutral;
    }
    if (coordinate.y < this.rows / 2) {
      return SetupTerritoryOwner.alabaster;
    }
    return SetupTerritoryOwner.onyx;
  }

  isCoordinateValid(coordinate: ICoordinate): boolean {
    return (
      coordinate.x >= 0 &&
      coordinate.x < this.columns &&
      coordinate.y >= 0 &&
      coordinate.y < this.rows
    );
  }
}
