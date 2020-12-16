import {
  ITerrainRuleOptions,
  ITerrainRuleValidationErrors,
  IPiecesEffectedValidationErrors,
  TerrainType,
  IPiecesEffected,
  PiecesEffectedType,
  ISlowsMovement,
  ISlowsMovementValidationErrors,
} from "../../../shared/dtos/cyvasse/terrain_rule";

export function validateTerrainRuleOptions(
  options: ITerrainRuleOptions,
  existingTerrainTypeMap: Map<TerrainType, number>,
  terrainRuleId?: number
): ITerrainRuleValidationErrors | null {
  const errors: ITerrainRuleValidationErrors = {};

  // terrainTypeId
  if (options.terrainTypeId == null) {
    errors.terrainTypeId = "Terrain type is required";
  } else {
    const existingTerrainRuleId = existingTerrainTypeMap.get(
      options.terrainTypeId
    );
    if (
      existingTerrainRuleId != null &&
      existingTerrainRuleId !== terrainRuleId
    ) {
      errors.terrainTypeId =
        "A terrain rule already exists for this terrain type";
    }
  }

  // count
  if (options.count == null) {
    errors.count = "Count is required";
  } else if (options.count < 1) {
    errors.count = "Count must be greater than or equal to 1";
  }

  // passable movement / range
  const passableMovementErrors = validatePiecesEffectedOptions(
    options.passableMovement,
    "Passable movement"
  );
  if (passableMovementErrors != null) {
    errors.passableMovement = passableMovementErrors;
  }
  const passableRangeErrors = validatePiecesEffectedOptions(
    options.passableRange,
    "Passable range"
  );
  if (passableRangeErrors != null) {
    errors.passableRange = passableRangeErrors;
  }

  // slows movement
  const slowsMovementErrors = validateSlowsMovementByOptions(
    options.slowsMovement
  );
  if (slowsMovementErrors != null) {
    errors.slowsMovement = slowsMovementErrors;
  }

  // stops movement
  const stopsMovementErrors = validatePiecesEffectedOptions(
    options.stopsMovement,
    "Stops movement"
  );
  if (stopsMovementErrors != null) {
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
): IPiecesEffectedValidationErrors | null {
  const errors: IPiecesEffectedValidationErrors = {};

  if (config == null || config.for == null) {
    errors.for = `${prefix} for is required`;
  }
  if (config == null || config.pieceTypeIds == null) {
    errors.pieceTypeIds = `${prefix} piece types are required`;
  }
  if (
    config != null &&
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
): ISlowsMovementValidationErrors | null {
  let errors = validatePiecesEffectedOptions(
    config,
    "Slows movement"
  ) as ISlowsMovementValidationErrors;
  if (errors == null) {
    errors = {};
  }
  if (config != null && config.for !== PiecesEffectedType.NONE) {
    if (config.by == null) {
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
