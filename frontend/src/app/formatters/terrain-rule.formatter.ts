import {
  PiecesEffectedType,
  IPiecesEffected,
  TerrainType,
  ISlowsMovement,
} from "../shared/dtos/cyvasse/terrain_rule";
import { TERRAIN_TYPE_OPTIONS } from "../models/terrain-rule";

export function getPiecesEffectedDescription(
  piecesEffected: IPiecesEffected
): string {
  switch (piecesEffected.for) {
    case PiecesEffectedType.ALL:
      return "All";
    case PiecesEffectedType.ALL_EXCEPT:
      return `All except ${piecesEffected.pieceTypeIds.join(", ")}`;
    case PiecesEffectedType.NONE:
      return "None";
    case PiecesEffectedType.ONLY:
      return `Only ${piecesEffected.pieceTypeIds.join(", ")}`;
    default:
      throw Error("Unexpected pieces effected for");
  }
}

export function getSlowsMovementDescription(
  piecesEffectedBy: ISlowsMovement
): string {
  let suffix = "";
  if (piecesEffectedBy.for !== PiecesEffectedType.NONE) {
    if (piecesEffectedBy.by == null) {
      throw new Error("Expected 'by' to be defined");
    }
    suffix = ` by ${piecesEffectedBy.by}`;
  }
  return `${getPiecesEffectedDescription(piecesEffectedBy)}${suffix}`;
}

export function getTerrainTypeDescription(terrainTypeId: TerrainType): string {
  const option = TERRAIN_TYPE_OPTIONS.find((x) => x.value === terrainTypeId);
  if (option != null) {
    return option.label;
  }
  return "Unknown";
}
