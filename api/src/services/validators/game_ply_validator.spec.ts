import { expect } from "chai";
import { describe, it } from "mocha";
import { CoordinateMap } from "../game/storage/coordinate_map";
import { PieceType, IPieceRule } from "../../shared/dtos/piece_rule";
import { TerrainType, ITerrainRule } from "../../shared/dtos/terrain_rule";
import { PlayerColor, IGamePly } from "../../shared/dtos/game";
import { mockPieceRule, mockVariant } from "../../../test/mocks";
import { validateGamePly, IValidateGamePlyOptions } from "./game_ply_validator";
import { BoardType } from "../../shared/dtos/variant";
import { getBoardForVariant } from "../game/board/builder";

function getBaseTestOptions(ply: IGamePly): IValidateGamePlyOptions {
  const variant = mockVariant({ boardType: BoardType.HEXAGONAL, boardSize: 3 });
  const pieceRule = mockPieceRule({ pieceTypeId: PieceType.KING, count: 1 });
  const board = getBoardForVariant(variant);
  const coordinateMap = new CoordinateMap(board.getAllCoordinates());
  coordinateMap.addPiece(
    { x: 0, y: -1 },
    { pieceTypeId: PieceType.KING, playerColor: PlayerColor.ALABASTER }
  );
  coordinateMap.addPiece(
    { x: 0, y: 0 },
    { pieceTypeId: PieceType.KING, playerColor: PlayerColor.ONYX }
  );
  return {
    coordinateMap,
    pieceRuleMap: new Map<PieceType, IPieceRule>([
      [pieceRule.pieceTypeId, pieceRule],
    ]),
    playerColor: PlayerColor.ALABASTER,
    ply,
    terrainRuleMap: new Map<TerrainType, ITerrainRule>([]),
    variant,
  };
}

describe("validateGamePly", () => {
  it("returns error if no piece", () => {
    // Arrange
    const options = getBaseTestOptions({
      piece: null,
      from: { x: 0, y: -1 },
      movement: { to: { x: 0, y: 0 } },
    });

    // Act
    const error = validateGamePly(options);

    // Assert
    expect(error).to.eql("Piece is required");
  });

  it("returns error if no from", () => {
    // Arrange
    const options = getBaseTestOptions({
      piece: {
        pieceTypeId: PieceType.KING,
        playerColor: PlayerColor.ALABASTER,
      },
      from: null,
      movement: { to: { x: 0, y: 0 } },
    });

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
