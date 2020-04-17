import { User } from "../database/models";
import { IUser } from "../shared/dtos/authentication";

export async function getUser(userId: number): Promise<IUser> {
  const user = await User.findByPk(userId);
  return user.serialize();
}
