import {
  IGameSetupChange,
  PlayerColor,
} from "../../../shared/dtos/cyvasse/game";
import { CyvasseCoordinateMap } from "../game/storage/cyvasse_coordinate_map";
import { PieceType, IPieceRule } from "../../../shared/dtos/cyvasse/piece_rule";
import { ICyvasseBoard } from "../game/board/cyvasse_board";
import {
  TerrainType,
  ITerrainRule,
} from "../../../shared/dtos/cyvasse/terrain_rule";

export interface IValidateGameSetupChangeOptions {
  board: ICyvasseBoard;
  change: IGameSetupChange;
  coordinateMap: CyvasseCoordinateMap;
  pieceRuleMap: Map<PieceType, IPieceRule>;
  playerColor: PlayerColor;
  terrainRuleMap: Map<TerrainType, ITerrainRule>;
}

export function validateGameSetupChange(
  options: IValidateGameSetupChangeOptions
): string | null {
  const { pieceChange, terrainChange } = options.change;
  if (
    (pieceChange == null && terrainChange == null) ||
    (pieceChange != null && terrainChange != null)
  ) {
    return "Must have exactly one piece change or terrain change";
  }
  if (pieceChange != null) {
    if (pieceChange.from == null && pieceChange.to == null) {
      return "Piece change - must have either from or to";
    }
    if (pieceChange.pieceTypeId == null) {
      return "Piece change - must have piece type";
    }
    if (
      pieceChange.from != null &&
      options.board.getSetupTerritoryOwner(pieceChange.from) !==
        options.playerColor
    ) {
      return "Piece change - from coordinate is not in setup territory";
    }
    if (
      pieceChange.to != null &&
      options.board.getSetupTerritoryOwner(pieceChange.to) !==
        options.playerColor
    ) {
      return "Piece change - to coordinate is not in setup territory";
    }
    if (pieceChange.from != null) {
      const existingPiece = options.coordinateMap.getPiece(pieceChange.from);
      if (
        existingPiece == null ||
        existingPiece.pieceTypeId !== pieceChange.pieceTypeId
      ) {
        return "Piece change - from coordinate does contain piece type";
      }
    }
    if (pieceChange.to != null) {
      const existingPiece = options.coordinateMap.getPiece(pieceChange.to);
      if (existingPiece != null) {
        return "Piece change - to coordinate is not free";
      }
    }
    if (pieceChange.from == null) {
      if (!options.pieceRuleMap.has(pieceChange.pieceTypeId)) {
        return "Piece change - piece type not allowed";
      }
      const pieceRule = options.pieceRuleMap.get(pieceChange.pieceTypeId);
      if (pieceRule == null) {
        throw new Error("Piece rule not found");
      }
      const maxPieceTypeCount = pieceRule.count;
      const currentPieceTypeCount = options.coordinateMap
        .serialize()
        .filter((x) => x.value.piece?.pieceTypeId === pieceChange.pieceTypeId)
        .length;
      if (currentPieceTypeCount === maxPieceTypeCount) {
        return "Piece change - already at max count for piece type";
      }
    }
  }
  if (terrainChange != null) {
    if (terrainChange.from == null && terrainChange.to == null) {
      return "Terrain change - must have either from or to";
    }
    if (terrainChange.terrainTypeId == null) {
      return "Terrain change - must have piece type";
    }
    if (
      terrainChange.from != null &&
      options.board.getSetupTerritoryOwner(terrainChange.from) !==
        options.playerColor
    ) {
      return "Terrain change - from coordinate is not in setup territory";
    }
    if (
      terrainChange.to != null &&
      options.board.getSetupTerritoryOwner(terrainChange.to) !==
        options.playerColor
    ) {
      return "Terrain change - to coordinate is not in setup territory";
    }
    if (terrainChange.from != null) {
      const existingTerrain = options.coordinateMap.getTerrain(
        terrainChange.from
      );
      if (
        existingTerrain == null ||
        existingTerrain.terrainTypeId !== terrainChange.terrainTypeId
      ) {
        return "Terrain change - from coordinate does contain terrain type";
      }
    }
    if (terrainChange.to != null) {
      const existingTerrain = options.coordinateMap.getTerrain(
        terrainChange.to
      );
      if (existingTerrain != null) {
        return "Terrain change - to coordinate is not free";
      }
    }
    if (terrainChange.from == null) {
      if (!options.terrainRuleMap.has(terrainChange.terrainTypeId)) {
        return "Terrain change - terrain type not allowed";
      }
      const terrainRule = options.terrainRuleMap.get(
        terrainChange.terrainTypeId
      );
      if (terrainRule == null) {
        throw new Error("Terrain rule not found");
      }
      const maxTerrainTypeCount = terrainRule.count;
      const currentTerrainTypeCount = options.coordinateMap
        .serialize()
        .filter(
          (x) => x.value.terrain?.terrainTypeId === terrainChange.terrainTypeId
        ).length;
      if (currentTerrainTypeCount === maxTerrainTypeCount) {
        return "Terrain change - already at max count for terrain type";
      }
    }
  }
  return null;
}
