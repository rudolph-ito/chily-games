import { ICoordinate } from "../../shared/dtos/game";

export class CoordinateMap<T> {
  private readonly data: Map<string, T>;

  constructor() {
    this.data = new Map<string, T>();
  }

  delete(coordinate: ICoordinate): void {
    this.data.delete(this.coordinateToKey(coordinate));
  }

  get(coordinate: ICoordinate): T {
    return this.data.get(this.coordinateToKey(coordinate));
  }

  set(coordinate: ICoordinate, data: T): void {
    this.data.set(this.coordinateToKey(coordinate), data);
  }

  private coordinateToKey(coordinate: ICoordinate): string {
    return `${coordinate.x},${coordinate.y}`;
  }
}
