// Enums

export enum PieceType {
  CATAPULT = "catapult",
  CROSSBOW = "crossbow",
  DRAGON = "dragon",
  ELEPHANT = "elephant",
  HEAVY_HORSE = "heavy_horse",
  KING = "king",
  LIGHT_HORSE = "light_horse",
  RABBLE = "rabble",
  SPEAR = "spear",
  TREBUCHET = "trebuchet",
}

export enum PathType {
  ORTHOGONAL_LINE = "orthogonal_line",
  DIAGONAL_LINE = "diagonal_line",
  ORTHOGONAL_OR_DIAGONAL_LINE = "orthogonal_or_diagonal_line",
  ORTHOGONAL_WITH_TURNS = "orthogonal_with_turns",
  DIAGONAL_WITH_TURNS = "diagonal_with_turns",
}

export enum CaptureType {
  MOVEMENT = "movement",
  RANGE = "range",
}

// Primary interfaces

export interface IPathConfiguration {
  type: PathType;
  minimum: number;
  maximum: number;
}

export interface IPieceRanks {
  attack: number;
  defense: number;
}

export interface IPieceRuleOptions {
  pieceTypeId: PieceType;
  count: number;
  movement: IPathConfiguration;
  captureType: CaptureType;
  range?: IPathConfiguration;
  moveAndRangeCapture?: boolean;
  ranks?: IPieceRanks;
}

export interface IPieceRule extends IPieceRuleOptions {
  pieceRuleId: number;
  variantId: number;
}

// Validation errors interfaces

export interface IPathConfigurationValidationErrors {
  type?: string;
  minimum?: string;
  maximum?: string;
}

export interface IPieceRanksValidationErrors {
  attack?: string;
  defense?: string;
}

export interface IPieceRuleValidationErrors {
  general?: string;
  pieceTypeId?: string;
  count?: string;
  movement?: IPathConfigurationValidationErrors;
  captureType?: string;
  range?: IPathConfigurationValidationErrors;
  moveAndRangeCapture?: string;
  ranks?: IPieceRanksValidationErrors;
}
