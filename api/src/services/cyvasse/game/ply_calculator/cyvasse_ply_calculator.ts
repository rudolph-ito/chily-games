import {
  IPiece,
  ICoordinate,
  PLY_EVALUATION_FLAGS,
  ValidPlies,
} from "../../../../shared/dtos/cyvasse/game";
import {
  CaptureType,
  PathType,
  IPathConfiguration,
  IPieceRule,
  PieceType,
} from "../../../../shared/dtos/cyvasse/piece_rule";
import { ICoordinateUpdater, BoardDirection } from "../board/cyvasse_board";
import { IPlyEvaluateOptions } from "./types";
import { CyvassePlyEvaluator } from "./cyvasse_ply_evaluator";
import uniqBy from "lodash.uniqby";

import { ICyvasseCoordinateMap } from "../storage/cyvasse_coordinate_map";
import {
  ITerrainRule,
  TerrainType,
} from "src/shared/dtos/cyvasse/terrain_rule";
import { IVariant } from "src/shared/dtos/cyvasse/variant";
import { getBoardForVariant } from "../board/cyvasse_board_builder";

export interface INewPlyCalculatorOptions {
  coordinateMap: ICyvasseCoordinateMap;
  pieceRuleMap: Map<PieceType, IPieceRule>;
  terrainRuleMap: Map<TerrainType, ITerrainRule>;
  variant: IVariant;
}

export interface IGetValidPliesInput {
  coordinate: ICoordinate;
  evaluationType: CaptureType;
}

interface IGetValidPliesData {
  piece: IPiece;
  directionalFunctions: ICoordinateUpdater[];
  pathConfiguration: IPathConfiguration;
}

export class CyvassePlyCalculator {
  options: IPlyEvaluateOptions;
  plyEvaluator: CyvassePlyEvaluator;

  constructor(options: INewPlyCalculatorOptions) {
    this.options = {
      coordinateMap: options.coordinateMap,
      gameRules: {
        board: getBoardForVariant(options.variant),
        pieceRanks: options.variant.pieceRanks,
        pieceRuleMap: options.pieceRuleMap,
        supportType: options.variant.supportType,
        terrainRuleMap: options.terrainRuleMap,
      },
    };
    this.plyEvaluator = new CyvassePlyEvaluator(this.options);
  }

  getValidPlies(input: IGetValidPliesInput): ValidPlies {
    const piece = this.options.coordinateMap.getPiece(input.coordinate);
    if (piece == null) {
      throw new Error("Piece not found");
    }
    const pieceRule = this.options.gameRules.pieceRuleMap.get(
      piece.pieceTypeId
    );
    if (pieceRule == null) {
      throw new Error("Piece rule not found");
    }
    const pathConfiguration =
      input.evaluationType === CaptureType.MOVEMENT
        ? pieceRule.movement
        : pieceRule.range;
    if (pathConfiguration == null) {
      throw new Error("Path configuration unexpectedly null");
    }
    const data = {
      directionalFunctions: this.getDirectionalFunctions(
        pathConfiguration.type
      ),
      pathConfiguration,
      piece,
    };
    if (pathConfiguration.type.includes("line")) {
      return this.getValidPliesForLine(input, data);
    } else if (pathConfiguration.type.includes("turns")) {
      return this.getValidPliesForTurns(input, data);
    } else {
      throw Error("Unexpected path configuration type");
    }
  }

  // For each direction, go in that direction until should stop
  private getValidPliesForLine(
    input: IGetValidPliesInput,
    data: IGetValidPliesData
  ): ValidPlies {
    const result = this.getEmptyResult();
    data.directionalFunctions.forEach((directionalFunction) => {
      let to = input.coordinate;
      let count = 1;
      const stopCondition = this.getStopCondition(data.pathConfiguration);
      while (!stopCondition(count)) {
        to = directionalFunction(to);
        const plyEvaluation = this.plyEvaluator.evaluate({
          coordinate: to,
          count,
          evaluationType: input.evaluationType,
          piece: data.piece,
        });
        if (plyEvaluation.valid && plyEvaluation.flag != null) {
          result[plyEvaluation.flag].push(to);
        }
        count += plyEvaluation.countModifier;
      }
    });
    return result;
  }

  private getValidPliesForTurns(
    input: IGetValidPliesInput,
    data: IGetValidPliesData
  ): ValidPlies {
    const result = this.recursiveGetValidPliesForTurns(
      input,
      data,
      input.coordinate,
      1
    );
    PLY_EVALUATION_FLAGS.forEach((flag) => {
      result[flag] = uniqBy(result[flag], (c) => `${c.x},${c.y}`);
    });
    return result;
  }

  private recursiveGetValidPliesForTurns(
    input: IGetValidPliesInput,
    data: IGetValidPliesData,
    coordinate: ICoordinate,
    count: number
  ): ValidPlies {
    const result = this.getEmptyResult();
    if (this.getStopCondition(data.pathConfiguration)(count)) {
      return result;
    }

    data.directionalFunctions.forEach((directionalFunction) => {
      const to = directionalFunction(coordinate);

      // Stop if distance did not grow
      const oldDistance = this.options.gameRules.board.getCoordinateDistance(
        input.coordinate,
        coordinate
      );
      const newDistance = this.options.gameRules.board.getCoordinateDistance(
        input.coordinate,
        to
      );
      if (oldDistance >= newDistance || newDistance <= count - 1) {
        return;
      }

      // Evaluate ply
      const plyEvaluation = this.plyEvaluator.evaluate({
        coordinate: to,
        count,
        evaluationType: input.evaluationType,
        piece: data.piece,
      });
      if (plyEvaluation.valid && plyEvaluation.flag != null) {
        result[plyEvaluation.flag].push(to);
      }

      // Recursive call
      const childPlies = this.recursiveGetValidPliesForTurns(
        input,
        data,
        to,
        count + plyEvaluation.countModifier
      );
      PLY_EVALUATION_FLAGS.forEach((flag) =>
        result[flag].push(...childPlies[flag])
      );
    });

    return result;
  }

  private getEmptyResult(): ValidPlies {
    return {
      free: [],
      capturable: [],
      reachable: [],
    };
  }

  private getStopCondition(
    pathConfiguration: IPathConfiguration
  ): (count: number) => boolean {
    if (pathConfiguration.maximum != null) {
      const max = pathConfiguration.maximum;
      return (count: number) => count > max;
    }
    return (count: number) => count === Infinity;
  }

  private getDirectionalFunctions(pathType: PathType): ICoordinateUpdater[] {
    let result: ICoordinateUpdater[] = [];
    if (pathType.includes("orthogonal")) {
      result = result.concat(
        this.options.gameRules.board.getDirectionalFunctions(
          BoardDirection.orthogonal
        )
      );
    }
    if (pathType.includes("diagonal")) {
      result = result.concat(
        this.options.gameRules.board.getDirectionalFunctions(
          BoardDirection.diagonal
        )
      );
    }
    return result;
  }
}
