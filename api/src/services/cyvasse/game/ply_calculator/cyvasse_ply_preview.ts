import { IVariant } from "../../../../shared/dtos/cyvasse/variant";
import {
  CaptureType,
  IPieceRuleOptions,
  PieceType,
  IPieceRule,
} from "../../../../shared/dtos/cyvasse/piece_rule";
import { CyvasseCoordinateMap } from "../storage/cyvasse_coordinate_map";
import {
  PlayerColor,
  IPreviewPieceRuleResponse,
} from "../../../../shared/dtos/cyvasse/game";
import { getBoardForVariant } from "../board/cyvasse_board_builder";
import { CyvassePlyCalculator } from "./cyvasse_ply_calculator";
import { TerrainType, ITerrainRule } from "src/shared/dtos/cyvasse/terrain_rule";

export interface IPreviewPieceRuleRequest {
  evaluationType: CaptureType;
  pieceRule: IPieceRuleOptions;
  variant: IVariant;
}

export function previewPieceRule(
  request: IPreviewPieceRuleRequest
): IPreviewPieceRuleResponse {
  const board = getBoardForVariant(request.variant);
  const coordinateMap = new CyvasseCoordinateMap(board.getAllCoordinates());
  const coordinate = board.getCenter();
  coordinateMap.addPiece(coordinate, {
    pieceTypeId: request.pieceRule.pieceTypeId,
    playerColor: PlayerColor.ALABASTER,
  });
  const pieceRule: IPieceRule = {
    pieceRuleId: 0,
    variantId: 0,
    ...request.pieceRule,
  };
  const plyCalculator = new CyvassePlyCalculator({
    coordinateMap,
    pieceRuleMap: new Map<PieceType, IPieceRule>([
      [pieceRule.pieceTypeId, pieceRule],
    ]),
    terrainRuleMap: new Map<TerrainType, ITerrainRule>(),
    variant: request.variant,
  });
  return {
    origin: coordinate,
    validPlies: plyCalculator.getValidPlies({
      coordinate,
      evaluationType: request.evaluationType,
    }),
  };
}
