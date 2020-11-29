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
import {
  doesHaveValue,
  doesNotHaveValue,
} from "../../../../shared/utilities/value_checker";
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

interface IPlyEvaluateData {
  occupyingPiece?: IPiece;
  occupyingPieceRule?: IPieceRule;
  occupyingTerrain?: ITerrain;
  occupyingTerrainRule?: ITerrainRule;
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
    const result: IPlyEvaluateData = {
      pieceRule: this.options.gameRules.pieceRuleMap.get(
        input.piece.pieceTypeId
      ),
      occupyingPiece: this.options.coordinateMap.getPiece(input.coordinate),
      occupyingTerrain: this.options.coordinateMap.getTerrain(input.coordinate),
    };
    if (doesHaveValue(result.occupyingPiece)) {
      result.occupyingPieceRule = this.options.gameRules.pieceRuleMap.get(
        result.occupyingPiece.pieceTypeId
      );
    }
    if (doesHaveValue(result.occupyingTerrain)) {
      result.occupyingTerrainRule = this.options.gameRules.terrainRuleMap.get(
        result.occupyingTerrain.terrainTypeId
      );
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
    if (doesHaveValue(data.occupyingPiece)) {
      if (data.occupyingPiece.playerColor === input.piece.playerColor) {
        return false;
      }
      if (input.evaluationType !== data.pieceRule.captureType) {
        return false;
      }
    }
    if (doesHaveValue(data.occupyingTerrain)) {
      if (!this.canTerrainBeEntered(data.occupyingTerrainRule, input)) {
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
    if (doesNotHaveValue(data.occupyingPiece)) {
      return PlyEvaluationFlag.FREE;
    }
    const isEnemyPiece =
      data.occupyingPiece.playerColor !== input.piece.playerColor;
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
    if (doesHaveValue(data.occupyingPiece)) {
      return Infinity;
    }
    if (doesHaveValue(data.occupyingTerrain)) {
      if (
        this.doesEffectApplyToPieceType(
          data.occupyingTerrainRule.stopsMovement,
          input.piece.pieceTypeId
        )
      ) {
        return Infinity;
      }
      if (
        this.doesEffectApplyToPieceType(
          data.occupyingTerrainRule.slowsMovement,
          input.piece.pieceTypeId
        )
      ) {
        return 1 + data.occupyingTerrainRule.slowsMovement.by;
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
