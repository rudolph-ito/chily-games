import {
  doesNotHaveValue,
  doesHaveValue,
} from "../../shared/utilities/value_checker";
import {
  IPieceRuleOptions,
  IPieceRuleValidationErrors,
  IPathConfigurationValidationErrors,
  PieceType,
} from "../../shared/dtos/piece_rule";

export function validatePieceRuleOptions(
  options: IPieceRuleOptions,
  existingPieceTypeMap: Map<PieceType, number>,
  pieceRuleId?: number
): IPieceRuleValidationErrors {
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

  const movementErrors: IPathConfigurationValidationErrors = {};
  if (
    doesNotHaveValue(options.movement) ||
    doesNotHaveValue(options.movement.type)
  ) {
    movementErrors.type = "Movement type is required";
  }
  if (
    doesNotHaveValue(options.movement) ||
    doesNotHaveValue(options.movement.minimum)
  ) {
    movementErrors.minimum = "Movement minimum is required";
  } else if (options.count < 1) {
    movementErrors.minimum =
      "Movement minimun must be greater than or equal to 1";
  }
  if (Object.keys(movementErrors).length > 0) {
    errors.movement = movementErrors;
  }

  if (Object.keys(errors).length > 0) {
    return errors;
  }
  return null;
}
