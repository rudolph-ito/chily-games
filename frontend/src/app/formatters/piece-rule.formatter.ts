import {
  PieceType,
  IPathConfiguration,
  CaptureType,
} from "../shared/dtos/piece_rule";
import {
  PIECE_TYPE_OPTIONS,
  PATH_TYPE_OPTIONS,
  CAPTURE_TYPE_OPTIONS,
} from "../models/piece-rule";
import {
  doesHaveValue,
  doesNotHaveValue,
} from "../shared/utilities/value_checker";

export function getPieceTypeDescription(pieceTypeId: PieceType): string {
  const option = PIECE_TYPE_OPTIONS.find((x) => x.value === pieceTypeId);
  if (doesHaveValue(option)) {
    return option.label;
  }
  return "Unknown";
}

export function getPathConfigurationDescription(
  pathConfig: IPathConfiguration
): string {
  const option = PATH_TYPE_OPTIONS.find((x) => x.value === pathConfig.type);
  if (doesNotHaveValue(option)) {
    return "Unknown";
  }
  let spacesDescription = pathConfig.minimum.toString();
  if (doesHaveValue(pathConfig.maximum)) {
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
  if (doesHaveValue(option)) {
    return option.label;
  }
  return "Unknown";
}
