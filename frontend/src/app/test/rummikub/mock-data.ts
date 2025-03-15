import { GameState, IGame } from "../../shared/dtos/rummikub/game";

export function getMockGame(data: Partial<IGame> = {}): IGame {
  return {
    gameId: 1,
    hostUserId: 1,
    options: { playTo: 100, hideTileCount: true },
    state: GameState.PLAYERS_JOINING,
    actionToUserId: 1,
    sets: [],
    tilePoolCount: 0,
    playerStates: [],
    latestUpdateSets: null,
    lastValidUpdateSets: null,
    roundScores: [],
    createdAt: "2021-01-01T00:00:00Z",
    updatedAt: "2021-01-01T00:00:00Z",
    ...data,
  };
}
