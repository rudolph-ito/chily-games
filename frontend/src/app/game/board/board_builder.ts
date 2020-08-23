import { BoardType, IVariantOptions } from "../../shared/dtos/variant";
import { HexagonalBoard } from "./hexagonal_board";
import { SquareBoard } from "./square_board";
import { BaseBoard, IGameCallbacks } from "./base_board";
import { PlayerColor, IGame, IGameRules } from "../../shared/dtos/game";

export interface IBuildBoardOptions {
  element: HTMLDivElement;
  color: PlayerColor;
  variant: IVariantOptions;
  game?: IGame;
  gameCallbacks?: IGameCallbacks;
  gameRules?: IGameRules;
}

export function buildBoard(options: IBuildBoardOptions): BaseBoard {
  if (options.variant.boardType === BoardType.HEXAGONAL) {
    return new HexagonalBoard(options, {
      boardSize: options.variant.boardSize,
    });
  }
  if (options.variant.boardType === BoardType.SQUARE) {
    return new SquareBoard(options, {
      boardColumns: options.variant.boardColumns,
      boardRows: options.variant.boardRows,
    });
  }
  throw new Error("Unexpected board type");
}
