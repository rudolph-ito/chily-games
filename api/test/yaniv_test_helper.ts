import { YanivGameService } from "../src/services/yaniv/yaniv_game_service";
import { IGameOptions } from "../src/shared/dtos/yaniv/game";

export async function createTestYanivGame(
  userId: number,
  options: IGameOptions
): Promise<number> {
  const game = await new YanivGameService().create(userId, options);
  return game.gameId;
}

export async function joinTestYanivGame(
  userId: number,
  gameId: number
): Promise<void> {
  await new YanivGameService().join(userId, gameId);
}
