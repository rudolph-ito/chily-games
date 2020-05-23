import { doesNotHaveValue } from "../../shared/utilities/value_checker";
import {
  IPieceRuleOptions,
  IPieceRuleValidationErrors,
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
  if (Object.keys(errors).length > 0) {
    return errors;
  }
  return null;
}
