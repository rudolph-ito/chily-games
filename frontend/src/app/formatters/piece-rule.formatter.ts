import {
  PieceType,
  IPathConfiguration,
  CaptureType,
} from "../shared/dtos/cyvasse/piece_rule";
import {
  PIECE_TYPE_OPTIONS,
  PATH_TYPE_OPTIONS,
  CAPTURE_TYPE_OPTIONS,
} from "../models/piece-rule";

export function getPieceTypeDescription(pieceTypeId: PieceType): string {
  const option = PIECE_TYPE_OPTIONS.find((x) => x.value === pieceTypeId);
  if (option == null) {
    return "Unknown";
  }
  return option.label;
}

export function getPathConfigurationDescription(
  pathConfig: IPathConfiguration
): string {
  const option = PATH_TYPE_OPTIONS.find((x) => x.value === pathConfig.type);
  if (option == null) {
    return "Unknown";
  }
  let spacesDescription = pathConfig.minimum.toString();
  if (pathConfig.maximum != null) {
    if (pathConfig.maximum > pathConfig.minimum) {
      spacesDescription += ` to ${pathConfig.maximum}`;
    }
  } else {
    spacesDescription += ` or more`;
  }
  spacesDescription += ` space`;
  if (pathConfig.minimum !== 1 || pathConfig.maximum !== 1) {
    spacesDescription += `s`;
  }
  return `${option.label} (${spacesDescription})`;
}

export function getCaptureTypeDescription(captureType: CaptureType): string {
  const option = CAPTURE_TYPE_OPTIONS.find((x) => x.value === captureType);
  if (option == null) {
    return "Unknown";
  }
  return option.label;
}
