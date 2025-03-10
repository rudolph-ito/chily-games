import { OhHeckGameDataService } from "./services/oh_heck/data/oh_heck_game_data_service";
import { RummikubGameDataService } from "./services/rummikub/data/rummikub_game_data_service";
import { UserService } from "./services/shared/user_service";
import { YanivGameDataService } from "./services/yaniv/data/yaniv_game_data_service";

async function main() {
  const ohHeckGameDataService = new OhHeckGameDataService();
  const ohHeckGameCount = await ohHeckGameDataService.deleteByHourThreshold(24)
  console.log(`Deleted ${ohHeckGameCount} oh heck games`)

  const rummikubGameDataService = new RummikubGameDataService();
  const rummikubGameCount = await rummikubGameDataService.deleteByHourThreshold(24);
  console.log(`Deleted ${rummikubGameCount} rummikub games`)

  const yanivGameDataService = new YanivGameDataService();
  const yanivGamecount = await yanivGameDataService.deleteByHourThreshold(24);
  console.log(`Deleted ${yanivGamecount} yaniv games`)

  const userService = new UserService();
  const result = await userService.deleteIfNotInGame();
  for (let gameType in result.gameTypeToUserCount) {
    console.log(`Found ${result.gameTypeToUserCount[gameType]} users in ${gameType} games`)
  }
  console.log(`Deleted ${result.deletedUserCount} users`)
}

main();