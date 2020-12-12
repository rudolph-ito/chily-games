import {
  IVariantOptions,
  IVariantValidationErrors,
  BoardType,
} from "../../../shared/dtos/cyvasse/variant";

export function validateVariantOptions(
  options: IVariantOptions
): IVariantValidationErrors | null {
  const errors: IVariantValidationErrors = {};
  if (options.boardType === BoardType.HEXAGONAL) {
    if (options.boardSize != null) {
      errors.boardSize = "Board size is required";
    }
  } else if (options.boardType === BoardType.SQUARE) {
    if (options.boardColumns != null) {
      errors.boardColumns = "Board columns is required";
    }
    if (options.boardRows != null) {
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
