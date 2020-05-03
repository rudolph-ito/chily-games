import chai from "chai";
import dirtyChai from "dirty-chai";
import { beforeEach } from "mocha";
import { sequelize, User } from "../src/database/models";
import { shouldSequelizeLog } from "../src/shared/utilities/env";
import supertest from "supertest";

chai.use(dirtyChai);

export function resetDatabaseBeforeEach(): void {
  beforeEach(async () => {
    await sequelize.sync({
      force: true,
      match: /_test$/,
      logging: shouldSequelizeLog()
    });
  });
}

export interface ILoginAsTestUserResponse {
  agent: supertest.SuperTest<supertest.Test>;
  userId: number;
}

export async function loginAsTestUser(
  app: Express.Application
): Promise<ILoginAsTestUserResponse> {
  const username = "test";
  const password = "strong enough";
  const user = User.build({ username });
  user.setPassword(password);
  await user.save();

  const agent = supertest.agent(app);
  await agent
    .post("/api/auth/login")
    .send({ username, password })
    .expect("set-cookie", /connect\.sid/)
    .expect(200);
  return { agent, userId: user.userId };
}

// Temporary function to help debug tests where the body is now what was expected
export function tempStatusChecker(statusCode: number): (r: any) => void {
  return function(res) {
    if (res.status !== statusCode) {
      console.log(JSON.stringify(res.body, null, 2));
    }
  };
}
