import { IBoard } from "../board";
import { PieceType, IPieceRule } from "src/shared/dtos/piece_rule";
import { TerrainType, ITerrainRule } from "src/shared/dtos/terrain_rule";
import { SupportType } from "src/shared/dtos/variant";
import { ICoordinateMap } from "../storage/coordinate_map";

export enum IPlyEvaluationFlag {
  FREE = "free",
  CAPTURABLE = "capturable",
  REACHABLE = "reachable",
}

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
