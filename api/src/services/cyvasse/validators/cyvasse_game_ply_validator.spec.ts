import { expect } from "chai";
import { describe, it } from "mocha";
import { CyvasseCoordinateMap } from "../game/storage/cyvasse_coordinate_map";
import {
  PieceType,
  IPieceRule,
  PathType,
  CaptureType,
} from "../../../shared/dtos/cyvasse/piece_rule";
import {
  TerrainType,
  ITerrainRule,
} from "../../../shared/dtos/cyvasse/terrain_rule";
import { PlayerColor, IGamePly } from "../../../shared/dtos/cyvasse/game";
import { mockPieceRule, mockVariant } from "../../../../test/mocks";
import {
  validateGamePly,
  IValidateGamePlyOptions,
} from "./cyvasse_game_ply_validator";
import { BoardType } from "../../../shared/dtos/cyvasse/variant";
import { getBoardForVariant } from "../game/board/cyvasse_board_builder";

function getBaseTestOptions(ply: IGamePly): IValidateGamePlyOptions {
  const variant = mockVariant({ boardType: BoardType.HEXAGONAL, boardSize: 3 });
  const kingPieceRule = mockPieceRule({
    pieceTypeId: PieceType.KING,
    captureType: CaptureType.MOVEMENT,
    count: 1,
    movement: { type: PathType.ORTHOGONAL_LINE, minimum: 1, maximum: 1 },
  });
  const crossbowPieceRule = mockPieceRule({
    pieceTypeId: PieceType.CROSSBOW,
    captureType: CaptureType.RANGE,
    count: 1,
    movement: { type: PathType.ORTHOGONAL_LINE, minimum: 1, maximum: 1 },
    range: { type: PathType.ORTHOGONAL_LINE, minimum: 1, maximum: 1 },
  });
  const board = getBoardForVariant(variant);
  const coordinateMap = new CyvasseCoordinateMap(board.getAllCoordinates());
  coordinateMap.addPiece(
    { x: 0, y: -1 },
    { pieceTypeId: PieceType.KING, playerColor: PlayerColor.ALABASTER }
  );
  coordinateMap.addPiece(
    { x: 0, y: 1 },
    { pieceTypeId: PieceType.CROSSBOW, playerColor: PlayerColor.ALABASTER }
  );
  coordinateMap.addPiece(
    { x: 0, y: 0 },
    { pieceTypeId: PieceType.KING, playerColor: PlayerColor.ONYX }
  );
  return {
    coordinateMap,
    pieceRuleMap: new Map<PieceType, IPieceRule>([
      [kingPieceRule.pieceTypeId, kingPieceRule],
      [crossbowPieceRule.pieceTypeId, crossbowPieceRule],
    ]),
    playerColor: PlayerColor.ALABASTER,
    ply,
    terrainRuleMap: new Map<TerrainType, ITerrainRule>([]),
    variant,
  };
}

describe("Cyvasse - validateGamePly", () => {
  it("returns error if no piece", () => {
    // Arrange
    const ply: Partial<IGamePly> = {
      from: { x: 0, y: -1 },
      movement: { to: { x: 0, y: 0 } },
    };
    const options = getBaseTestOptions(ply as IGamePly);

    // Act
    const error = validateGamePly(options);

    // Assert
    expect(error).to.eql("Piece is required");
  });

  it("returns error if no from", () => {
    // Arrange
    const ply: Partial<IGamePly> = {
      piece: {
        pieceTypeId: PieceType.KING,
        playerColor: PlayerColor.ALABASTER,
      },
      movement: { to: { x: 0, y: 0 } },
    };
    const options = getBaseTestOptions(ply as IGamePly);

    // Act
    const error = validateGamePly(options);

    // Assert
    expect(error).to.eql("From is required");
  });

  it("returns error if piece is not at from coordinate", () => {
    // Arrange
    const options = getBaseTestOptions({
      piece: {
        pieceTypeId: PieceType.KING,
        playerColor: PlayerColor.ALABASTER,
      },
      from: { x: 0, y: -2 },
      movement: { to: { x: 0, y: -3 } },
    });

    // Act
    const error = validateGamePly(options);

    // Assert
    expect(error).to.eql("Piece is not at from coordinate");
  });

  it("returns error if piece is not players", () => {
    // Arrange
    const options = getBaseTestOptions({
      piece: {
        pieceTypeId: PieceType.KING,
        playerColor: PlayerColor.ONYX,
      },
      from: { x: 0, y: 0 },
      movement: { to: { x: 1, y: 0 } },
    });

    // Act
    const error = validateGamePly(options);

    // Assert
    expect(error).to.eql("Piece must belong to player");
  });

  it("returns null on happy path move without capture", () => {
    // Arrange
    const options = getBaseTestOptions({
      piece: {
        pieceTypeId: PieceType.KING,
        playerColor: PlayerColor.ALABASTER,
      },
      from: { x: 0, y: -1 },
      movement: { to: { x: 0, y: -2 } },
    });

    // Act
    const error = validateGamePly(options);

    // Assert
    expect(error).to.eql(null);
  });

  it("returns null on happy path move with capture", () => {
    // Arrange
    const options = getBaseTestOptions({
      piece: {
        pieceTypeId: PieceType.KING,
        playerColor: PlayerColor.ALABASTER,
      },
      from: { x: 0, y: -1 },
      movement: {
        to: { x: 0, y: 0 },
        capturedPiece: {
          pieceTypeId: PieceType.KING,
          playerColor: PlayerColor.ONYX,
        },
      },
    });

    // Act
    const error = validateGamePly(options);

    // Assert
    expect(error).to.eql(null);
  });

  it("returns error on movement capture when capture by range", () => {
    // Arrange
    const options = getBaseTestOptions({
      piece: {
        pieceTypeId: PieceType.CROSSBOW,
        playerColor: PlayerColor.ALABASTER,
      },
      from: { x: 0, y: 1 },
      movement: {
        to: { x: 0, y: 0 },
        capturedPiece: {
          pieceTypeId: PieceType.KING,
          playerColor: PlayerColor.ONYX,
        },
      },
    });

    // Act
    const error = validateGamePly(options);

    // Assert
    expect(error).to.eql("Movement - piece cannot capture by movement");
  });

  it("returns null on happy path range capture", () => {
    // Arrange
    const options = getBaseTestOptions({
      piece: {
        pieceTypeId: PieceType.CROSSBOW,
        playerColor: PlayerColor.ALABASTER,
      },
      from: { x: 0, y: 1 },
      rangeCapture: {
        to: { x: 0, y: 0 },
        capturedPiece: {
          pieceTypeId: PieceType.KING,
          playerColor: PlayerColor.ONYX,
        },
      },
    });

    // Act
    const error = validateGamePly(options);

    // Assert
    expect(error).to.eql(null);
  });

  it("returns error range capture invalid", () => {
    // Arrange
    const options = getBaseTestOptions({
      piece: {
        pieceTypeId: PieceType.CROSSBOW,
        playerColor: PlayerColor.ALABASTER,
      },
      from: { x: 0, y: 1 },
      rangeCapture: {
        to: { x: 0, y: -1 },
        capturedPiece: {
          pieceTypeId: PieceType.KING,
          playerColor: PlayerColor.ALABASTER,
        },
      },
    });

    // Act
    const error = validateGamePly(options);

    // Assert
    expect(error).to.eql("Range capture - invalid (cannot capture)");
  });

  it("returns error on movement invalid", () => {
    // Arrange
    const options = getBaseTestOptions({
      piece: {
        pieceTypeId: PieceType.KING,
        playerColor: PlayerColor.ALABASTER,
      },
      from: { x: 0, y: -1 },
      movement: { to: { x: 0, y: -3 } },
    });

    // Act
    const error = validateGamePly(options);

    // Assert
    expect(error).to.eql("Movement - invalid (not free)");
  });

  it("returns error on movement missing capture", () => {
    // Arrange
    const options = getBaseTestOptions({
      piece: {
        pieceTypeId: PieceType.KING,
        playerColor: PlayerColor.ALABASTER,
      },
      from: { x: 0, y: -1 },
      movement: { to: { x: 0, y: 0 } },
    });

    // Act
    const error = validateGamePly(options);

    // Assert
    expect(error).to.eql("Movement - invalid (not free)");
  });
});
