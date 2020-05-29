import { IPiece, ICoordinate } from "../../../shared/dtos/game";
import {
  CaptureType,
  PathType,
  IPathConfiguration,
} from "../../../shared/dtos/piece_rule";
import { ICoordinateUpdater, BoardDirection } from "../board";
import { doesHaveValue } from "../../../shared/utilities/value_checker";
import { IPlyEvaluationFlag, IPlyEvaluateOptions } from "./types";
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

type IGetValidPliesOutput = Record<IPlyEvaluationFlag, ICoordinate[]>;

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
    switch (pathConfiguration.type) {
      case PathType.DIAGONAL_LINE:
      case PathType.ORTHOGONAL_LINE:
      case PathType.ORTHOGONAL_OR_DIAGONAL_LINE:
        return this.getValidPliesForLine(input, data);
      case PathType.ORTHOGONAL_WITH_TURNS:
      case PathType.DIAGONAL_WITH_TURNS:
        return this.getValidPliesForTurns(input, data);
      default:
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
      const stopCondition = doesHaveValue(data.pathConfiguration.maximum)
        ? (x: number) => x > data.pathConfiguration.maximum
        : (x: number) => x === Infinity;
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
    return this.recursiveGetValidPliesForTurns(
      input,
      data,
      input.coordinate,
      0
    );
  }

  private recursiveGetValidPliesForTurns(
    input: IGetValidPliesInput,
    data: IGetValidPliesData,
    coordinate: ICoordinate,
    count: number
  ): IGetValidPliesOutput {
    const result = this.getEmptyResult();

    // def _call(coordinate, count)
    // return {} if maximum && count >= maximum

    // plies = empty_plies

    // directional_functions.each do |directional_function|
    //   to = coordinate.clone
    //   directional_function.call(to)

    //   # Stop if distance did not grow
    //   old_distance = board.distance(from, coordinate)
    //   new_distance = board.distance(from, to)
    //   next if old_distance >= new_distance || new_distance <= count

    //   valid, flag, stop, new_count = evaluator.call(to, count + 1)
    //   plies[flag] << to.clone if valid
    //   next if stop

    //   child_plies = _call(to, new_count)
    //   child_plies.each { |k, v| plies[k] += v }
    // end

    // plies.each { |k, v| plies[k] = v.uniq }
    // plies
    // end
    return result;
  }

  private getEmptyResult(): IGetValidPliesOutput {
    return {
      free: [],
      capturable: [],
      reachable: [],
    };
  }

  private getDirectionalFunctions(pathType: PathType): ICoordinateUpdater[] {
    let result: ICoordinateUpdater[] = [];
    if (
      [
        PathType.ORTHOGONAL_LINE,
        PathType.ORTHOGONAL_OR_DIAGONAL_LINE,
        PathType.ORTHOGONAL_WITH_TURNS,
      ].includes(pathType)
    ) {
      result = result.concat(
        this.options.gameRules.board.getDirectionalFunctions(
          BoardDirection.orthogonal
        )
      );
    }
    if (
      [
        PathType.DIAGONAL_LINE,
        PathType.DIAGONAL_WITH_TURNS,
        PathType.ORTHOGONAL_OR_DIAGONAL_LINE,
      ].includes(pathType)
    ) {
      result = result.concat(
        this.options.gameRules.board.getDirectionalFunctions(
          BoardDirection.diagonal
        )
      );
    }
    return result;
  }
}
