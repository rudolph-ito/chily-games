import {
  ICoordinate,
  ICoordinateData,
  ICoordinateMapData,
  IPiece,
  ITerrain,
} from "../../../../shared/dtos/cyvasse/game";
import { doesHaveValue } from "../../../../shared/utilities/value_checker";

export interface ICyvasseCoordinateMap {
  addPiece: (coordinate: ICoordinate, piece: IPiece) => void;
  addTerrain: (coordinate: ICoordinate, terrain: ITerrain) => void;
  deletePiece: (coordinate: ICoordinate) => void;
  deleteTerrain: (coordinate: ICoordinate) => void;
  getPiece: (coordinate: ICoordinate) => IPiece | undefined;
  getTerrain: (coordinate: ICoordinate) => ITerrain | undefined;
  movePiece: (from: ICoordinate, to: ICoordinate) => void;
  moveTerrain: (from: ICoordinate, to: ICoordinate) => void;
  serialize: () => ICoordinateMapData[];
  deserialize: (data: ICoordinateMapData[]) => void;
}

export class CyvasseCoordinateMap implements ICyvasseCoordinateMap {
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
    this.getCoorinateData(coordinate).piece = undefined;
  }

  getPiece(coordinate: ICoordinate): IPiece | undefined {
    return this.getCoorinateData(coordinate).piece;
  }

  movePiece(from: ICoordinate, to: ICoordinate): void {
    const piece = this.getCoorinateData(from).piece;
    if (piece == null) {
      throw new Error(`No piece found at coordinate: ${JSON.stringify(from)}`);
    }
    this.deletePiece(from);
    this.addPiece(to, piece);
  }

  addTerrain(coordinate: ICoordinate, terrain: ITerrain): void {
    this.getCoorinateData(coordinate).terrain = terrain;
  }

  deleteTerrain(coordinate: ICoordinate): void {
    this.getCoorinateData(coordinate).terrain = undefined;
  }

  getTerrain(coordinate: ICoordinate): ITerrain | undefined {
    return this.getCoorinateData(coordinate).terrain;
  }

  moveTerrain(from: ICoordinate, to: ICoordinate): void {
    const terrain = this.getCoorinateData(from).terrain;
    if (terrain == null) {
      throw new Error(`No piece found at coordinate: ${JSON.stringify(from)}`);
    }
    this.deleteTerrain(from);
    this.addTerrain(to, terrain);
  }

  serialize(): ICoordinateMapData[] {
    return Array.from(this.data.entries())
      .filter(
        ([_, data]) => doesHaveValue(data.piece) || doesHaveValue(data.terrain)
      )
      .map(([coordinate, data]) => ({
        key: this.keyToCoordinate(coordinate),
        value: data,
      }));
  }

  deserialize(data: ICoordinateMapData[]): void {
    data.forEach((datum) => {
      if (datum.value.piece != null) {
        this.addPiece(datum.key, datum.value.piece);
      }
      if (datum.value.terrain != null) {
        this.addTerrain(datum.key, datum.value.terrain);
      }
    });
  }

  private getCoorinateData(coordinate: ICoordinate): ICoordinateData {
    const coordinateData = this.data.get(this.coordinateToKey(coordinate));
    if (coordinateData == null) {
      throw new Error(
        `Missing coordinate data at coordinate: ${JSON.stringify(coordinate)}`
      );
    }
    return coordinateData;
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
