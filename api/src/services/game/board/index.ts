import { ICoordinate } from "../../../shared/dtos/game";

export type ICoordinateUpdater = (coordinate: ICoordinate) => ICoordinate;

export enum BoardDirection {
  orthogonal,
  diagonal,
}

export enum SetupTerritoryOwner {
  neutral = "neutral",
  alabaster = "alabaster",
  onyx = "onyx",
}

export interface IBoard {
  getAllCoordinates: () => ICoordinate[];
  getCenter: () => ICoordinate;
  getDirectionalFunctions: (direction: BoardDirection) => ICoordinateUpdater[];
  getSetupTerritoryOwner: (coordinate: ICoordinate) => SetupTerritoryOwner;
  isCoordinateValid: (coordinate: ICoordinate) => boolean;
}
