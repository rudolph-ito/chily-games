import { ICoordinate } from "../../shared/dtos/cyvasse/game";

export class CoordinateMap<T> {
  private readonly data: Map<string, T>;

  constructor() {
    this.data = new Map<string, T>();
  }

  clear(): void {
    this.data.clear();
  }

  delete(coordinate: ICoordinate): void {
    this.data.delete(this.coordinateToKey(coordinate));
  }

  forEach(iterator: (coordinate: ICoordinate, data: T) => void): void {
    return this.data.forEach((data, key) => {
      iterator(this.keyToCoordinate(key), data);
    });
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

  private keyToCoordinate(key: string): ICoordinate {
    const parts = key.split(",");
    return { x: parseInt(parts[0]), y: parseInt(parts[1]) };
  }
}
