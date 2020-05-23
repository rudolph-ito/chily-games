import { User } from "../../database/models";
import { IUser } from "../../shared/dtos/authentication";

export interface ICreateUserOptions {
  username: string;
  password: string;
}

export interface IUserDataService {
  createUser: (options: ICreateUserOptions) => Promise<IUser>;
  hasUserWithUsername: (username: string) => Promise<boolean>;
  getUser: (userId: number) => Promise<IUser>;
}

export class UserDataService implements IUserDataService {
  async createUser(options: ICreateUserOptions): Promise<IUser> {
    const user = User.build({ username: options.username });
    user.setPassword(options.password);
    await user.save();
    return user.serialize();
  }

  async hasUserWithUsername(username: string): Promise<boolean> {
    const count = await User.count({ where: { username } });
    return count === 1;
  }

  async getUser(userId: number): Promise<IUser> {
    const user = await User.findByPk(userId);
    return user.serialize();
  }
}
