import { CaptureType } from "../../../../shared/dtos/piece_rule";
import { ICoordinate, IPiece } from "../../../../shared/dtos/game";

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
