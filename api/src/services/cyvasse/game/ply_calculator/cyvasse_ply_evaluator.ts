import {
  ICoordinate,
  IPiece,
  ITerrain,
  PlyEvaluationFlag,
} from "../../../../shared/dtos/cyvasse/game";
import {
  PieceType,
  IPieceRule,
  CaptureType,
} from "../../../../shared/dtos/cyvasse/piece_rule";
import {
  ITerrainRule,
  IPiecesEffected,
  PiecesEffectedType,
} from "../../../../shared/dtos/cyvasse/terrain_rule";
import { IPlyEvaluateOptions } from "./types";

interface IPlyEvaluation {
  countModifier: number; // base case is 1, more if terrain slows or stops
  flag?: PlyEvaluationFlag;
  valid: boolean;
}

interface IPlyEvaluateInput {
  coordinate: ICoordinate;
  count: number;
  evaluationType: CaptureType;
  piece: IPiece;
}

interface IPieceWithRule {
  piece: IPiece;
  pieceRule: IPieceRule;
}

interface ITerrainWithRule {
  terrain: ITerrain;
  terrainRule: ITerrainRule;
}

interface IPlyEvaluateData {
  occupyingPieceWithRule?: IPieceWithRule;
  occupyingTerrainWithRule?: ITerrainWithRule;
  pieceRule: IPieceRule;
}

export class CyvassePlyEvaluator {
  private readonly options: IPlyEvaluateOptions;

  constructor(options: IPlyEvaluateOptions) {
    this.options = options;
  }

  evaluate(input: IPlyEvaluateInput): IPlyEvaluation {
    if (!this.options.gameRules.board.isCoordinateValid(input.coordinate)) {
      return {
        valid: false,
        countModifier: Infinity,
      };
    }
    const data = this.getPlyEvaluateData(input);
    return {
      valid: this.isValid(input, data),
      flag: this.getFlag(input, data),
      countModifier: this.getCountModifier(input, data),
    };
  }

  // Load data about the piece / coordinate
  private getPlyEvaluateData(input: IPlyEvaluateInput): IPlyEvaluateData {
    const pieceRule = this.options.gameRules.pieceRuleMap.get(
      input.piece.pieceTypeId
    );
    if (pieceRule == null) {
      throw new Error("Piece rule not found");
    }
    const result: IPlyEvaluateData = { pieceRule };
    const piece = this.options.coordinateMap.getPiece(input.coordinate);
    if (piece != null) {
      const pieceRule = this.options.gameRules.pieceRuleMap.get(
        piece.pieceTypeId
      );
      if (pieceRule == null) {
        throw new Error("Piece rule not found");
      }
      result.occupyingPieceWithRule = { piece, pieceRule };
    }
    const terrain = this.options.coordinateMap.getTerrain(input.coordinate);
    if (terrain != null) {
      const terrainRule = this.options.gameRules.terrainRuleMap.get(
        terrain.terrainTypeId
      );
      if (terrainRule == null) {
        throw new Error("Piece rule not found");
      }
      result.occupyingTerrainWithRule = { terrain, terrainRule };
    }
    return result;
  }

  // Ply valid if:
  //   count is greater than minimun AND
  //   no occupying piece OR can capture occupying piece
  //   no terrain OR terrain is passable
  private isValid(input: IPlyEvaluateInput, data: IPlyEvaluateData): boolean {
    if (input.count < data.pieceRule.movement.minimum) {
      return false;
    }
    if (data.occupyingPieceWithRule != null) {
      if (
        data.occupyingPieceWithRule.piece.playerColor ===
        input.piece.playerColor
      ) {
        return false;
      }
      if (input.evaluationType !== data.pieceRule.captureType) {
        return false;
      }
    }
    if (data.occupyingTerrainWithRule != null) {
      if (
        !this.canTerrainBeEntered(
          data.occupyingTerrainWithRule.terrainRule,
          input
        )
      ) {
        return false;
      }
    }
    return true;
  }

  // For a valid ply, determine a classification for the ply
  private getFlag(
    input: IPlyEvaluateInput,
    data: IPlyEvaluateData
  ): PlyEvaluationFlag {
    if (data.occupyingPieceWithRule == null) {
      return PlyEvaluationFlag.FREE;
    }
    const isEnemyPiece =
      data.occupyingPieceWithRule.piece.playerColor !== input.piece.playerColor;
    if (isEnemyPiece) {
      const canCapture = !this.options.gameRules.pieceRanks || false; // TODO caluculate supported rank
      if (canCapture) {
        return PlyEvaluationFlag.CAPTURABLE;
      }
    }
    return PlyEvaluationFlag.REACHABLE;
  }

  // If occupying piece, return Infinity
  // If terrain stops piece, return Infinity
  // If terrain slows piece, return 1 + slows by
  // Otherwise, return 1
  private getCountModifier(
    input: IPlyEvaluateInput,
    data: IPlyEvaluateData
  ): number {
    if (data.occupyingPieceWithRule != null) {
      return Infinity;
    }
    if (data.occupyingTerrainWithRule != null) {
      if (
        this.doesEffectApplyToPieceType(
          data.occupyingTerrainWithRule.terrainRule.stopsMovement,
          input.piece.pieceTypeId
        )
      ) {
        return Infinity;
      }
      if (
        this.doesEffectApplyToPieceType(
          data.occupyingTerrainWithRule.terrainRule.slowsMovement,
          input.piece.pieceTypeId
        )
      ) {
        if (
          data.occupyingTerrainWithRule.terrainRule.slowsMovement.by == null
        ) {
          throw new Error("Terrain rule slows movement by is null");
        }
        return 1 + data.occupyingTerrainWithRule.terrainRule.slowsMovement.by;
      }
    }
    return 1;
  }

  private canTerrainBeEntered(
    terrainRule: ITerrainRule,
    input: IPlyEvaluateInput
  ): boolean {
    switch (input.evaluationType) {
      case CaptureType.MOVEMENT:
        return this.doesEffectApplyToPieceType(
          terrainRule.passableMovement,
          input.piece.pieceTypeId
        );
      case CaptureType.RANGE:
        return this.doesEffectApplyToPieceType(
          terrainRule.passableRange,
          input.piece.pieceTypeId
        );
      default:
        throw Error("Unexpected evaluationType");
    }
  }

  private doesEffectApplyToPieceType(
    piecesEffected: IPiecesEffected,
    pieceTypeId: PieceType
  ): boolean {
    switch (piecesEffected.for) {
      case PiecesEffectedType.NONE:
        return false;
      case PiecesEffectedType.ALL:
        return true;
      case PiecesEffectedType.ONLY:
        return piecesEffected.pieceTypeIds.includes(pieceTypeId);
      case PiecesEffectedType.ALL_EXCEPT:
        return !piecesEffected.pieceTypeIds.includes(pieceTypeId);
      default:
        throw Error("Unexpected PiecesEffectedType");
    }
  }
}
