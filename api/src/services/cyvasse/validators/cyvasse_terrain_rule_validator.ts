import {
  doesNotHaveValue,
  doesHaveValue,
} from "../../../shared/utilities/value_checker";
import {
  ITerrainRuleOptions,
  ITerrainRuleValidationErrors,
  IPiecesEffectedValidationErrors,
  TerrainType,
  IPiecesEffected,
  PiecesEffectedType,
  ISlowsMovement,
  ISlowsMovementValidationErrors,
} from "../../../shared/dtos/terrain_rule";

export function validateTerrainRuleOptions(
  options: ITerrainRuleOptions,
  existingTerrainTypeMap: Map<TerrainType, number>,
  terrainRuleId?: number
): ITerrainRuleValidationErrors {
  const errors: ITerrainRuleValidationErrors = {};

  // terrainTypeId
  if (doesNotHaveValue(options.terrainTypeId)) {
    errors.terrainTypeId = "Terrain type is required";
  } else {
    const existingTerrainRuleId = existingTerrainTypeMap.get(
      options.terrainTypeId
    );
    if (
      doesHaveValue(existingTerrainRuleId) &&
      existingTerrainRuleId !== terrainRuleId
    ) {
      errors.terrainTypeId =
        "A terrain rule already exists for this terrain type";
    }
  }

  // count
  if (doesNotHaveValue(options.count)) {
    errors.count = "Count is required";
  } else if (options.count < 1) {
    errors.count = "Count must be greater than or equal to 1";
  }

  // passable movement / range
  const passableMovementErrors = validatePiecesEffectedOptions(
    options.passableMovement,
    "Passable movement"
  );
  if (doesHaveValue(passableMovementErrors)) {
    errors.passableMovement = passableMovementErrors;
  }
  const passableRangeErrors = validatePiecesEffectedOptions(
    options.passableRange,
    "Passable range"
  );
  if (doesHaveValue(passableRangeErrors)) {
    errors.passableRange = passableRangeErrors;
  }

  // slows movement
  const slowsMovementErrors = validateSlowsMovementByOptions(
    options.slowsMovement
  );
  if (doesHaveValue(slowsMovementErrors)) {
    errors.slowsMovement = slowsMovementErrors;
  }

  // stops movement
  const stopsMovementErrors = validatePiecesEffectedOptions(
    options.stopsMovement,
    "Stops movement"
  );
  if (doesHaveValue(stopsMovementErrors)) {
    errors.stopsMovement = stopsMovementErrors;
  }

  if (Object.keys(errors).length > 0) {
    return errors;
  }
  return null;
}

export function validatePiecesEffectedOptions(
  config: IPiecesEffected,
  prefix: string
): IPiecesEffectedValidationErrors {
  const errors: IPiecesEffectedValidationErrors = {};

  if (doesNotHaveValue(config) || doesNotHaveValue(config.for)) {
    errors.for = `${prefix} for is required`;
  }
  if (doesNotHaveValue(config) || doesNotHaveValue(config.pieceTypeIds)) {
    errors.pieceTypeIds = `${prefix} piece types are required`;
  }
  if (
    doesHaveValue(config) &&
    (config.for === PiecesEffectedType.ALL_EXCEPT ||
      config.for === PiecesEffectedType.ONLY)
  ) {
    if (config.pieceTypeIds.length < 1) {
      errors.pieceTypeIds = `${prefix} piece types must include at least one`;
    }
  }
  if (Object.keys(errors).length > 0) {
    return errors;
  }
  return null;
}

export function validateSlowsMovementByOptions(
  config: ISlowsMovement
): ISlowsMovementValidationErrors {
  let errors: ISlowsMovementValidationErrors = validatePiecesEffectedOptions(
    config,
    "Slows movement"
  );
  if (doesNotHaveValue(errors)) {
    errors = {};
  }
  if (doesHaveValue(config) && config.for !== PiecesEffectedType.NONE) {
    if (doesNotHaveValue(config.by)) {
      errors.by = "Slows movement by is required";
    } else if (config.by < 1) {
      errors.by = "Slows movement by must be greater than or equal to 1";
    }
  }
  if (Object.keys(errors).length > 0) {
    return errors;
  }
  return null;
}
