import { Op } from "sequelize";
import { User } from "../../../database/models";
import { IUser } from "../../../shared/dtos/authentication";
import { NotFoundError } from '../exceptions';

export interface ICreateUserOptions {
  username: string;
  password: string;
}

export interface IUserDataService {
  createUser: (options: ICreateUserOptions) => Promise<IUser>;
  getUser: (userId: number) => Promise<IUser>;
  getMaybeUser: (userId: number) => Promise<IUser | null>;
  getUsers: (userIds: number[]) => Promise<IUser[]>;
  hasUser: (userId: number) => Promise<boolean>;
  hasUserWithUsername: (username: string) => Promise<boolean>;
}

export class UserDataService implements IUserDataService {
  async createUser(options: ICreateUserOptions): Promise<IUser> {
    const user = User.build({ username: options.username });
    user.setPassword(options.password);
    await user.save();
    return user.serialize();
  }

  async getMaybeUser(userId: number): Promise<IUser | null> {
    if (await this.hasUser(userId)) {
      return await this.getUser(userId);
    }
    return null;
  }

  async getUser(userId: number): Promise<IUser> {
    const user = await User.findByPk(userId);
    if (user == null) {
      throw new NotFoundError(`User does not exist with id: ${userId}`);
    }
    return user.serialize();
  }

  async getUsers(userIds: number[]): Promise<IUser[]> {
    const users = await User.findAll({
      where: { userId: { [Op.in]: userIds } },
    });
    return users.map((u) => u.serialize());
  }

  async hasUserWithUsername(username: string): Promise<boolean> {
    const count = await User.count({ where: { username } });
    return count === 1;
  }

  async hasUser(userId: number): Promise<boolean> {
    const count = await User.count({ where: { userId } });
    return count === 1;
  }
}
