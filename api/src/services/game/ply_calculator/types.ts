import { IBoard } from "../board";
import { PieceType, IPieceRule } from "../../../shared/dtos/piece_rule";
import { TerrainType, ITerrainRule } from "../../../shared/dtos/terrain_rule";
import { SupportType } from "../../../shared/dtos/variant";
import { ICoordinateMap } from "../storage/coordinate_map";

export enum PlyEvaluationFlag {
  FREE = "free",
  CAPTURABLE = "capturable",
  REACHABLE = "reachable",
}

export const PLY_EVALUATION_FLAGS = [
  PlyEvaluationFlag.FREE,
  PlyEvaluationFlag.CAPTURABLE,
  PlyEvaluationFlag.REACHABLE,
];

export interface IGameRules {
  board: IBoard;
  pieceRanks: boolean;
  pieceRuleMap: Map<PieceType, IPieceRule>;
  terrainRuleMap: Map<TerrainType, ITerrainRule>;
  supportType: SupportType;
}

export interface IPlyEvaluateOptions {
  coordinateMap: ICoordinateMap;
  gameRules: IGameRules;
}
