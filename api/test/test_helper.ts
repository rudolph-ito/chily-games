import chai from "chai";
import dirtyChai from "dirty-chai";
import { beforeEach } from "mocha";
import { sequelize } from "../src/database/models";
import { shouldSequelizeLog } from "../src/shared/utilities/env";
import supertest from "supertest";
import { UserDataService } from "../src/services/data/user_data_service";
import { BoardType } from "../src/shared/dtos/variant";
import { VariantDataService } from "../src/services/data/variant_data_service";

chai.use(dirtyChai);

export function resetDatabaseBeforeEach(): void {
  beforeEach(async () => {
    await sequelize.sync({
      force: true,
      match: /_test$/,
      logging: shouldSequelizeLog(),
    });
  });
}

export interface IUserCredentials {
  username: string;
  password: string;
}

export function createTestCredentials(username: string): IUserCredentials {
  return {
    username,
    password: "strong enough",
  };
}

export async function createTestUser(
  userCredentials: IUserCredentials
): Promise<number> {
  const user = await new UserDataService().createUser({
    username: userCredentials.username,
    password: userCredentials.password,
  });
  return user.userId;
}

export async function createTestVariant(creatorId: number): Promise<number> {
  const variant = await new VariantDataService().createVariant(
    {
      boardType: BoardType.HEXAGONAL,
      boardSize: 6,
      pieceRanks: false,
    },
    creatorId
  );
  return variant.variantId;
}

export async function loginTestUser(
  app: Express.Application,
  credentials: IUserCredentials
): Promise<supertest.SuperTest<supertest.Test>> {
  const agent = supertest.agent(app);
  await agent
    .post("/api/auth/login")
    .send(credentials)
    .expect("set-cookie", /connect\.sid/)
    .expect(200);
  return agent;
}

export interface ICreateAndLoginTestUserResponse {
  agent: supertest.SuperTest<supertest.Test>;
  userId: number;
}

export async function createAndLoginTestUser(
  app: Express.Application,
  username: string = "user1"
): Promise<ICreateAndLoginTestUserResponse> {
  const userCredentials = createTestCredentials(username);
  const userId = await createTestUser(userCredentials);
  const agent = await loginTestUser(app, userCredentials);
  return { agent, userId };
}

// Temporary function to help debug tests when the status code is not what was expected
export function tempStatusChecker(statusCode: number): (r: any) => void {
  return function (res) {
    if (res.status !== statusCode) {
      console.log(JSON.stringify(res.body, null, 2));
    }
  };
}
