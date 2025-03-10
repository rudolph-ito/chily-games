import { IUser } from "../../shared/dtos/authentication";
import { IOhHeckGameDataService, OhHeckGameDataService } from "../oh_heck/data/oh_heck_game_data_service";
import { IRummikubGameDataService, RummikubGameDataService } from "../rummikub/data/rummikub_game_data_service";
import { IYanivGameDataService, YanivGameDataService } from "../yaniv/data/yaniv_game_data_service";
import { IUserDataService, UserDataService } from "./data/user_data_service";

export interface DeleteIfNotInGameResult {
  gameTypeToUserCount: Record<string, number>;
  deletedUserCount: number;
}

interface GetUsersForPageOfGamesResult {
  userIds: Set<number>;
  gamesReviewed: number;
}

export interface IUserService {
  getUser: (userId: number) => Promise<IUser>;
  deleteIfNotInGame: () => Promise<DeleteIfNotInGameResult>
}

export class UserService implements IUserService {
  constructor(
    private readonly userDataService: IUserDataService = new UserDataService(),
    private readonly ohHeckDataService: IOhHeckGameDataService = new OhHeckGameDataService(),
    private readonly rummikubDataService: IRummikubGameDataService = new RummikubGameDataService(),
    private readonly yanivDataService: IYanivGameDataService = new YanivGameDataService()
  ) {}

  async getUser(userId: number): Promise<IUser> {
    return await this.userDataService.getUser(userId);
  }

  async deleteIfNotInGame(): Promise<DeleteIfNotInGameResult> {
    const usersInOhHeckGames = await this.getUsersInOhHeckGames()
    const usersInRummikubGames = await this.getUsersInRummikubGames()
    const usersInYanivGames = await this.getUsersInYanivGames()

    const usersInGames: Set<number> = new Set();
    usersInOhHeckGames.forEach(x => usersInGames.add(x));
    usersInRummikubGames.forEach(x => usersInGames.add(x));
    usersInYanivGames.forEach(x => usersInGames.add(x));
    const deletedUserCount = await this.userDataService.deleteAllExcept(Array.from(usersInGames));

    return {
      gameTypeToUserCount: {
        'oh heck': usersInOhHeckGames.size,
        'rummikub': usersInRummikubGames.size,
        'yaniv': usersInYanivGames.size,
      },
      deletedUserCount
    }
  }

  private async getUsersInOhHeckGames(): Promise<Set<number>> {
    return this.getUsersInGames(async (pageIndex, pageSize) => {
      const userIds: Set<number> = new Set();
      const searchResult = await this.ohHeckDataService.search({
        filter: {includeCompleted: true},
        pagination: {pageIndex, pageSize}
      })
      for (let game of searchResult.data) {
        for (let player of game.players) {
          userIds.add(player.userId)
        }
      }
      return {
        userIds,
        gamesReviewed: searchResult.data.length
      }
    })
  }

  private async getUsersInRummikubGames(): Promise<Set<number>> {
    return this.getUsersInGames(async (pageIndex, pageSize) => {
      const userIds: Set<number> = new Set();
      const searchResult = await this.rummikubDataService.search({
        filter: {includeCompleted: true},
        pagination: {pageIndex, pageSize}
      })
      for (let game of searchResult.data) {
        for (let player of game.players) {
          userIds.add(player.userId)
        }
      }
      return {
        userIds,
        gamesReviewed: searchResult.data.length
      }
    })
  }

  private async getUsersInYanivGames(): Promise<Set<number>> {
    return this.getUsersInGames(async (pageIndex, pageSize) => {
      const userIds: Set<number> = new Set();
      const searchResult = await this.yanivDataService.search({
        filter: {includeCompleted: true},
        pagination: {pageIndex, pageSize}
      })
      for (let game of searchResult.data) {
        for (let player of game.players) {
          userIds.add(player.userId)
        }
      }
      return {
        userIds,
        gamesReviewed: searchResult.data.length
      }
    })
  }

  private async getUsersInGames(getUsersForPageOfGames: (pageIndex: number, pageSize: number) => Promise<GetUsersForPageOfGamesResult>): Promise<Set<number>> {
    const userIds: Set<number> = new Set();
    const pageSize = 100;
    let pageIndex = 0;
    let gamesReviewed = 0;
    while (true) {
      const pageResult = await getUsersForPageOfGames(pageIndex, pageSize)
      pageResult.userIds.forEach(x => userIds.add(x))
      gamesReviewed += pageResult.gamesReviewed;
      if (pageResult.gamesReviewed < pageSize) {
        break
      }
      pageIndex += 1
    }
    return userIds
  }
}
