import { ICoordinate } from "../../shared/dtos/game";
import { doesHaveValue } from "../../shared/utilities/value_checker";

export function areCoordinatesEqual(a: ICoordinate, b: ICoordinate): boolean {
  return doesHaveValue(a) && doesHaveValue(b) && a.x === b.x && a.y === b.y;
}
