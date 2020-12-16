import {
  doesNotHaveValue,
  doesHaveValue,
} from "../../../shared/utilities/value_checker";
import {
  IPieceRuleOptions,
  IPieceRuleValidationErrors,
  IPathConfigurationValidationErrors,
  PieceType,
  IPathConfiguration,
  CaptureType,
} from "../../../shared/dtos/cyvasse/piece_rule";

export function validatePieceRuleOptions(
  options: IPieceRuleOptions,
  existingPieceTypeMap: Map<PieceType, number>,
  pieceRuleId?: number
): IPieceRuleValidationErrors | null {
  const isKing = existingPieceTypeMap.get(PieceType.KING) === pieceRuleId;
  const errors: IPieceRuleValidationErrors = {};

  // pieceTypeId
  if (doesNotHaveValue(options.pieceTypeId)) {
    errors.pieceTypeId = "Piece type is required";
  } else {
    const existingPieceRuleId = existingPieceTypeMap.get(options.pieceTypeId);
    if (
      doesHaveValue(existingPieceRuleId) &&
      existingPieceRuleId !== pieceRuleId
    ) {
      errors.pieceTypeId = "A piece rule already exists for this piece type";
    }
    if (isKing && options.pieceTypeId !== PieceType.KING) {
      errors.pieceTypeId =
        "Piece type is locked to 'King'. Every variant must have exactly one king.";
    }
  }

  // count
  if (doesNotHaveValue(options.count)) {
    errors.count = "Count is required";
  } else if (options.count < 1) {
    errors.count = "Count must be greater than or equal to 1";
  } else if (isKing && options.count !== 1) {
    errors.count =
      "Count is locked to 1. Every variant must have exactly one king.";
  }

  // movement
  const movementErrors = validatePathConfigurationOptions(
    options.movement,
    "Movement"
  );
  if (movementErrors != null) {
    errors.movement = movementErrors;
  }

  // capture type + range
  if (options.captureType === CaptureType.RANGE && options.range != null) {
    const rangeErrors = validatePathConfigurationOptions(
      options.range,
      "Range"
    );
    if (rangeErrors != null) {
      errors.range = rangeErrors;
    }
  } else if (options.captureType !== CaptureType.MOVEMENT) {
    errors.captureType = "Capture type must be movement or range.";
  }

  if (Object.keys(errors).length > 0) {
    return errors;
  }
  return null;
}

export function validatePathConfigurationOptions(
  config: IPathConfiguration,
  prefix: string
): IPathConfigurationValidationErrors | null {
  const errors: IPathConfigurationValidationErrors = {};
  if (doesNotHaveValue(config) || doesNotHaveValue(config.type)) {
    errors.type = `${prefix} type is required`;
  }
  if (doesNotHaveValue(config) || doesNotHaveValue(config.minimum)) {
    errors.minimum = `${prefix} minimum is required`;
  } else if (config.minimum < 1) {
    errors.minimum = `${prefix} minimum must be greater than or equal to 1`;
  } else if (config.maximum != null && config.maximum < config.minimum) {
    errors.maximum = `${prefix} maximum must be greater than or equal to minimum`;
  }
  if (Object.keys(errors).length > 0) {
    return errors;
  }
  return null;
}
