import { ICyvasseBoard } from "../board/cyvasse_board";
import {
  PieceType,
  IPieceRule,
} from "../../../../shared/dtos/cyvasse/piece_rule";
import {
  TerrainType,
  ITerrainRule,
} from "../../../../shared/dtos/cyvasse/terrain_rule";
import { SupportType } from "../../../../shared/dtos/cyvasse/variant";
import { ICyvasseCoordinateMap } from "../storage/cyvasse_coordinate_map";

export interface IGameRules {
  board: ICyvasseBoard;
  pieceRanks: boolean;
  pieceRuleMap: Map<PieceType, IPieceRule>;
  terrainRuleMap: Map<TerrainType, ITerrainRule>;
  supportType: SupportType;
}

export interface IPlyEvaluateOptions {
  coordinateMap: ICyvasseCoordinateMap;
  gameRules: IGameRules;
}
