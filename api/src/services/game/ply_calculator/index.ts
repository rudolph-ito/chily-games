import { IPiece, ICoordinate } from "../../../shared/dtos/game";
import {
  CaptureType,
  PathType,
  IPathConfiguration,
} from "../../../shared/dtos/piece_rule";
import { ICoordinateUpdater, BoardDirection } from "../board";
import { doesHaveValue } from "../../../shared/utilities/value_checker";
import {
  PlyEvaluationFlag,
  IPlyEvaluateOptions,
  PLY_EVALUATION_FLAGS,
} from "./types";
import { PlyEvaluator } from "./ply_evaluator";

interface IGetValidPliesInput {
  coordinate: ICoordinate;
  evaluationType: CaptureType;
  piece: IPiece;
}

interface IGetValidPliesData {
  directionalFunctions: ICoordinateUpdater[];
  pathConfiguration: IPathConfiguration;
}

type IGetValidPliesOutput = Record<PlyEvaluationFlag, ICoordinate[]>;

export class PlyCalculator {
  plyEvaluator: PlyEvaluator;

  constructor(private readonly options: IPlyEvaluateOptions) {
    this.plyEvaluator = new PlyEvaluator(options);
  }

  getValidPlies(input: IGetValidPliesInput): IGetValidPliesOutput {
    const pieceRule = this.options.gameRules.pieceRuleMap.get(
      input.piece.pieceTypeId
    );
    const pathConfiguration =
      input.evaluationType === CaptureType.MOVEMENT
        ? pieceRule.movement
        : pieceRule.range;
    const data = {
      directionalFunctions: this.getDirectionalFunctions(
        pathConfiguration.type
      ),
      pathConfiguration,
    };
    if (pathConfiguration.type.includes("line")) {
      return this.getValidPliesForLine(input, data);
    } else if (pathConfiguration.type.includes("turns")) {
      return this.getValidPliesForTurns(input, data);
    } else {
      throw Error("Unexpected path configuration type");
    }
  }

  private getValidPliesForLine(
    input: IGetValidPliesInput,
    data: IGetValidPliesData
  ): IGetValidPliesOutput {
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
          piece: input.piece,
        });
        if (plyEvaluation.valid) {
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
  ): IGetValidPliesOutput {
    const result = this.recursiveGetValidPliesForTurns(
      input,
      data,
      input.coordinate,
      0
    );
    PLY_EVALUATION_FLAGS.forEach((flag) => [
      ...new Set<ICoordinate>(result[flag]),
    ]);
    return result;
  }

  private recursiveGetValidPliesForTurns(
    input: IGetValidPliesInput,
    data: IGetValidPliesData,
    coordinate: ICoordinate,
    count: number
  ): IGetValidPliesOutput {
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
      if (oldDistance >= newDistance || newDistance < count) {
        return;
      }

      // Evaluate ply
      const plyEvaluation = this.plyEvaluator.evaluate({
        coordinate: to,
        count,
        evaluationType: input.evaluationType,
        piece: input.piece,
      });
      if (plyEvaluation.valid) {
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

  private getEmptyResult(): IGetValidPliesOutput {
    return {
      free: [],
      capturable: [],
      reachable: [],
    };
  }

  private getStopCondition(
    pathConfiguration: IPathConfiguration
  ): (count: number) => boolean {
    return doesHaveValue(pathConfiguration.maximum)
      ? (count: number) => count > pathConfiguration.maximum
      : (count: number) => count === Infinity;
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
