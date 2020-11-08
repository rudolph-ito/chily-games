import {
  IVariantOptions,
  IVariantValidationErrors,
  BoardType,
} from "../../../shared/dtos/cyvasse/variant";
import { doesNotHaveValue } from "../../../shared/utilities/value_checker";

export function validateVariantOptions(
  options: IVariantOptions
): IVariantValidationErrors {
  const errors: IVariantValidationErrors = {};
  if (options.boardType === BoardType.HEXAGONAL) {
    if (doesNotHaveValue(options.boardSize)) {
      errors.boardSize = "Board size is required";
    }
  } else if (options.boardType === BoardType.SQUARE) {
    if (doesNotHaveValue(options.boardColumns)) {
      errors.boardColumns = "Board columns is required";
    }
    if (doesNotHaveValue(options.boardRows)) {
      errors.boardRows = "Board rows is required";
    }
  } else {
    errors.boardType = "Board type must be hexagonal or square.";
  }
  if (Object.keys(errors).length > 0) {
    return errors;
  }
  return null;
}
