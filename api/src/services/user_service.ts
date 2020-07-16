import { IUser } from "../shared/dtos/authentication";
import { IUserDataService, UserDataService } from "./data/user_data_service";
import { NotFoundError } from "./exceptions";

export interface IUserService {
  getUser: (userId: number) => Promise<IUser>;
}

export class UserService implements IUserService {
  constructor(
    private readonly userDataService: IUserDataService = new UserDataService()
  ) {}

  async getUser(userId: number): Promise<IUser> {
    if (!(await this.userDataService.hasUser(userId))) {
      throw new NotFoundError(`User does not exist with id: ${userId}`);
    }
    return await this.userDataService.getUser(userId);
  }
}
