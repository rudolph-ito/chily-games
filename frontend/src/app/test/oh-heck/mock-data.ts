import { GameState, IGame } from "../../shared/dtos/oh_heck/game";

export function getMockGame(data: Partial<IGame> = {}): IGame {
  return {
    gameId: 1,
    hostUserId: 1,
    options: { halfGame: false },
    playerStates: [],
    state: GameState.BETTING,
    roundScores: [],
    currentTrick: [],
    actionToUserId: 1,
    createdAt: "2021-01-01T00:00:00Z",
    updatedAt: "2021-01-01T00:00:00Z",
    ...data,
  };
}
