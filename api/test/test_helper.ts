import chai from "chai";
import dirtyChai from "dirty-chai";
import { beforeEach } from "mocha";
import { sequelize } from "../src/database/models";
import { shouldSequelizeLog } from "../src/shared/utilities/env";
import supertest from "supertest";
import { UserDataService } from "../src/services/data/user_data_service";
import { BoardType, IVariantOptions } from "../src/shared/dtos/variant";
import { VariantService } from "../src/services/variant_service";
import {
  PieceType,
  PathType,
  CaptureType,
} from "../src/shared/dtos/piece_rule";
import { PieceRuleDataService } from "../src/services/data/piece_rule_data_service";
import {
  TerrainType,
  PiecesEffectedType,
} from "../src/shared/dtos/terrain_rule";
import { TerrainRuleDataService } from "../src/services/data/terrain_rule_data_service";
import { ChallengePlayAs } from "../src/shared/dtos/challenge";
import { ChallengeDataService } from "../src/services/data/challenge_data_service";

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

export async function createTestVariant(
  creatorId: number,
  options: Partial<IVariantOptions> = {}
): Promise<number> {
  const variant = await new VariantService().createVariant(creatorId, {
    boardType: BoardType.HEXAGONAL,
    boardSize: 6,
    pieceRanks: false,
    ...options,
  });
  return variant.variantId;
}

export async function createTestPieceRule(
  pieceTypeId: PieceType,
  variantId: number
): Promise<number> {
  const pieceRule = await new PieceRuleDataService().createPieceRule(
    {
      pieceTypeId,
      count: 1,
      movement: {
        type: PathType.ORTHOGONAL_WITH_TURNS,
        minimum: 1,
        maximum: 1,
      },
      captureType: CaptureType.MOVEMENT,
    },
    variantId
  );
  return pieceRule.pieceRuleId;
}

export async function createTestTerrainRule(
  terrainTypeId: TerrainType,
  variantId: number
): Promise<number> {
  const terrainRule = await new TerrainRuleDataService().createTerrainRule(
    {
      terrainTypeId,
      count: 1,
      passableMovement: {
        for: PiecesEffectedType.ALL,
        pieceTypeIds: [],
      },
      passableRange: {
        for: PiecesEffectedType.ALL,
        pieceTypeIds: [],
      },
      slowsMovement: {
        for: PiecesEffectedType.NONE,
        pieceTypeIds: [],
      },
      stopsMovement: {
        for: PiecesEffectedType.NONE,
        pieceTypeIds: [],
      },
    },
    variantId
  );
  return terrainRule.terrainRuleId;
}

export async function createTestChallenge(
  userId: number,
  variantId: number,
  opponentUserId: number = null
): Promise<number> {
  const challenge = await new ChallengeDataService().createChallenge(
    {
      creatorPlayAs: ChallengePlayAs.ALABASTER,
      opponentUserId,
      variantId,
    },
    userId
  );
  return challenge.challengeId;
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
