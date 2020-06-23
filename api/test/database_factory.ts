import { User } from "../src/database/models";
import { valueOrDefault } from "../src/shared/utilities/value_checker";

// Create objects saved to the database

export interface ICreateUserOptions {
  username?: string;
}

export async function createTestUser(
  options: ICreateUserOptions = {}
): Promise<User> {
  const user = User.build({ username: valueOrDefault(options.username, "me") });
  user.setPassword("strong enough");
  await user.save();
  return user;
}
