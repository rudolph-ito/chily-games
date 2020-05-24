import { doesNotHaveValue } from "../../shared/utilities/value_checker";
import {
  IPieceRuleOptions,
  IPieceRuleValidationErrors,
  IPathConfigurationValidationErrors,
} from "src/shared/dtos/piece_rule";

export function validatePieceRuleOptions(
  options: IPieceRuleOptions
): IPieceRuleValidationErrors {
  const errors: IPieceRuleValidationErrors = {};
  if (doesNotHaveValue(options.pieceTypeId)) {
    errors.pieceTypeId = "Piece type is required";
  }
  if (doesNotHaveValue(options.count)) {
    errors.count = "Count is required";
  } else if (options.count < 1) {
    errors.count = "Count must be greater than or equal to 1";
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
