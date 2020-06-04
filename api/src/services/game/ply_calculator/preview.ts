import { IVariant } from "../../../shared/dtos/variant";
import {
  CaptureType,
  IPieceRuleOptions,
} from "../../../shared/dtos/piece_rule";
import { CoordinateMap } from "../storage/coordinate_map";
import {
  PlayerColor,
  IPreviewPieceRuleResponse,
} from "../../../shared/dtos/game";
import { getBoardForVariant } from "../board/builder";
import { PlyCalculator } from ".";

export interface IPreviewPieceRuleRequest {
  evaluationType: CaptureType;
  pieceRule: IPieceRuleOptions;
  variant: IVariant;
}

export function previewPieceRule(
  request: IPreviewPieceRuleRequest
): IPreviewPieceRuleResponse {
  const board = getBoardForVariant(request.variant);
  const coordinateMap = new CoordinateMap(board.getAllCoordinates());
  const coordinate = board.getCenter();
  coordinateMap.addPiece(coordinate, {
    pieceTypeId: request.pieceRule.pieceTypeId,
    playerColor: PlayerColor.ALABASTER,
  });
  const plyCalculator = new PlyCalculator({
    coordinateMap,
    pieceRules: [{ pieceRuleId: 0, variantId: 0, ...request.pieceRule }],
    terrainRules: [],
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
