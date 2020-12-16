import { IUser } from "../../shared/dtos/authentication";
import { IUserDataService, UserDataService } from "./data/user_data_service";

export interface IUserService {
  getUser: (userId: number) => Promise<IUser>;
}

export class UserService implements IUserService {
  constructor(
    private readonly userDataService: IUserDataService = new UserDataService()
  ) {}

  async getUser(userId: number): Promise<IUser> {
    return await this.userDataService.getUser(userId);
  }
}
