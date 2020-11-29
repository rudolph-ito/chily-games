import { CaptureType } from "../../../../shared/dtos/cyvasse/piece_rule";
import { ICoordinate, IPiece } from "../../../../shared/dtos/cyvasse/game";

export interface IPlyMovement {
  from: ICoordinate;
  to: ICoordinate;
}

export interface IPlyCapture {
  captureType: CaptureType;
  piece: IPiece;
  coordinate: ICoordinate;
}

export interface IPly {
  piece: IPiece;
  movement?: IPlyMovement;
  capture?: IPlyCapture;
}
