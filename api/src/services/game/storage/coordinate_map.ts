import {
  ICoordinate,
  ICoordinateData,
  ICoordinateMapData,
  IPiece,
  ITerrain,
} from "../../../shared/dtos/game";
import { doesHaveValue } from "../../../shared/utilities/value_checker";

export interface ICoordinateMap {
  addPiece: (coordinate: ICoordinate, piece: IPiece) => void;
  addTerrain: (coordinate: ICoordinate, terrain: ITerrain) => void;
  deletePiece: (coordinate: ICoordinate) => void;
  deleteTerrain: (coordinate: ICoordinate) => void;
  getPiece: (coordinate: ICoordinate) => IPiece;
  getTerrain: (coordinate: ICoordinate) => ITerrain;
  movePiece: (from: ICoordinate, to: ICoordinate) => void;
  moveTerrain: (from: ICoordinate, to: ICoordinate) => void;
  serialize: () => ICoordinateMapData[];
  deserialize: (data: ICoordinateMapData[]) => void;
}

export class CoordinateMap implements ICoordinateMap {
  private readonly data: Map<string, ICoordinateData>;

  constructor(coordinates: ICoordinate[]) {
    this.data = new Map<string, ICoordinateData>();
    coordinates.forEach((coordinate) =>
      this.data.set(this.coordinateToKey(coordinate), {})
    );
  }

  addPiece(coordinate: ICoordinate, piece: IPiece): void {
    this.getCoorinateData(coordinate).piece = piece;
  }

  deletePiece(coordinate: ICoordinate): void {
    this.getCoorinateData(coordinate).piece = null;
  }

  getPiece(coordinate: ICoordinate): IPiece {
    return this.getCoorinateData(coordinate).piece;
  }

  movePiece(from: ICoordinate, to: ICoordinate): void {
    const piece = this.getCoorinateData(from).piece;
    this.deletePiece(from);
    this.addPiece(to, piece);
  }

  addTerrain(coordinate: ICoordinate, terrain: ITerrain): void {
    this.getCoorinateData(coordinate).terrain = terrain;
  }

  deleteTerrain(coordinate: ICoordinate): void {
    this.getCoorinateData(coordinate).terrain = null;
  }

  getTerrain(coordinate: ICoordinate): ITerrain {
    return this.getCoorinateData(coordinate).terrain;
  }

  moveTerrain(from: ICoordinate, to: ICoordinate): void {
    const terrain = this.getCoorinateData(from).terrain;
    this.deleteTerrain(from);
    this.addTerrain(to, terrain);
  }

  serialize(): ICoordinateMapData[] {
    return Array.from(this.data.entries())
      .filter((x) => doesHaveValue(x[1].piece) || doesHaveValue(x[1].terrain))
      .map((x) => ({
        key: this.keyToCoordinate(x[0]),
        value: x[1],
      }));
  }

  deserialize(data: ICoordinateMapData[]): void {
    data.forEach((datum) => this.addPiece(datum.key, datum.value.piece));
    data.forEach((datum) => this.addTerrain(datum.key, datum.value.terrain));
  }

  private getCoorinateData(coordinate: ICoordinate): ICoordinateData {
    return this.data.get(this.coordinateToKey(coordinate));
  }

  private coordinateToKey(coordinate: ICoordinate): string {
    return `${coordinate.x},${coordinate.y}`;
  }

  private keyToCoordinate(key: string): ICoordinate {
    const parts = key.split(",");
    return {
      x: parseInt(parts[0], 10),
      y: parseInt(parts[1], 10),
    };
  }
}
