import { ICoordinate, IPiece, ITerrain } from "../../../shared/dtos/game";

export interface ICoordinateData {
  piece?: IPiece;
  terrain?: ITerrain;
}

export interface ICoordinateMap {
  addPiece: (coordinate: ICoordinate, piece: IPiece) => void;
  addTerrain: (coordinate: ICoordinate, terrain: ITerrain) => void;
  deletePiece: (coordinate: ICoordinate) => void;
  deleteTerrain: (coordinate: ICoordinate) => void;
  getPiece: (coordinate: ICoordinate) => IPiece;
  getTerrain: (coordinate: ICoordinate) => ITerrain;
  movePiece: (from: ICoordinate, to: ICoordinate) => void;
  moveTerrain: (from: ICoordinate, to: ICoordinate) => void;
}

export class CoordinateMap implements ICoordinateMap {
  private readonly data: Map<ICoordinate, ICoordinateData>;

  constructor(coordinates: ICoordinate[]) {
    this.data = new Map<ICoordinate, ICoordinateData>();
    coordinates.forEach((c) => this.data.set(c, {}));
  }

  addPiece(coordinate: ICoordinate, piece: IPiece): void {
    this.data.get(coordinate).piece = piece;
  }

  deletePiece(coordinate: ICoordinate): void {
    this.data.get(coordinate).piece = null;
  }

  getPiece(coordinate: ICoordinate): IPiece {
    return this.data.get(coordinate).piece;
  }

  movePiece(from: ICoordinate, to: ICoordinate): void {
    const piece = this.data.get(from).piece;
    this.deletePiece(from);
    this.addPiece(to, piece);
  }

  addTerrain(coordinate: ICoordinate, terrain: ITerrain): void {
    this.data.get(coordinate).terrain = terrain;
  }

  deleteTerrain(coordinate: ICoordinate): void {
    this.data.get(coordinate).terrain = null;
  }

  getTerrain(coordinate: ICoordinate): ITerrain {
    return this.data.get(coordinate).terrain;
  }

  moveTerrain(from: ICoordinate, to: ICoordinate): void {
    const terrain = this.data.get(from).terrain;
    this.deleteTerrain(from);
    this.addTerrain(to, terrain);
  }
}
