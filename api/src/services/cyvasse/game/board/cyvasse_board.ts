import { ICoordinate, PlayerColor } from "../../../../shared/dtos/cyvasse/game";

export type ICoordinateUpdater = (coordinate: ICoordinate) => ICoordinate;

export enum BoardDirection {
  orthogonal,
  diagonal,
}

export interface ICyvasseBoard {
  getAllCoordinates: () => ICoordinate[];
  getCenter: () => ICoordinate;
  getCoordinateDistance: (
    coordinate1: ICoordinate,
    coordinate2: ICoordinate
  ) => number;
  getDirectionalFunctions: (direction: BoardDirection) => ICoordinateUpdater[];
  getSetupTerritoryOwner: (coordinate: ICoordinate) => PlayerColor | null;
  isCoordinateValid: (coordinate: ICoordinate) => boolean;
}
