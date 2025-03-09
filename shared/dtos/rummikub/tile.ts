export enum TileColor {
  BLACK = "black",
  RED = "red",
  YELLOW = "yellow",
  BLUE = "blue",
}

export interface ITile {
  isJoker?: boolean;
  jokerNumber?: number;
  rank?: number;
  color?: TileColor;
}
