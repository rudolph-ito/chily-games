import chai from "chai";
import dirtyChai from "dirty-chai";
import { beforeEach } from "mocha";
import { sequelize } from "../src/database/models";
import { shouldSequelizeLog } from "../src/shared/utilities/env";
import supertest from "supertest";
import { UserDataService } from "../src/services/shared/data/user_data_service";
import { BoardType, IVariantOptions } from "../src/shared/dtos/cyvasse/variant";
import { CyvasseVariantService } from "../src/services/cyvasse/cyvasse_variant_service";
import {
  PieceType,
  PathType,
  CaptureType,
} from "../src/shared/dtos/cyvasse/piece_rule";
import { CyvassePieceRuleDataService } from "../src/services/cyvasse/data/cyvasse_piece_rule_data_service";
import {
  TerrainType,
  PiecesEffectedType,
} from "../src/shared/dtos/cyvasse/terrain_rule";
import { CyvasseTerrainRuleDataService } from "../src/services/cyvasse/data/cyvasse_terrain_rule_data_service";
import { ChallengePlayAs } from "../src/shared/dtos/cyvasse/challenge";
import { CyvasseChallengeDataService } from "../src/services/cyvasse/data/cyvasse_challenge_data_service";
import { StatusCodes } from "http-status-codes";
import { createExpressApp } from "../src/controllers";
import express from "express";
import { createClient } from "redis";
import { promisify } from "util";

chai.use(dirtyChai);

export interface ITestServer {
  app: express.Express;
  quit: () => Promise<void>;
}

export function createTestServer(): ITestServer {
  const publishRedisClient = createClient({ host: "localhost", port: 6379 });
  const sessionStoreRedisClient = createClient({
    host: "localhost",
    port: 6379,
  });
  return {
    app: createExpressApp({
      corsOrigins: [],
      publishRedisClient,
      sessionSecret: "test",
      sessionStoreRedisClient,
    }),
    quit: async (): Promise<void> => {
      await Promise.all([
        promisify(publishRedisClient.quit.bind(publishRedisClient))(),
        promisify(sessionStoreRedisClient.quit.bind(sessionStoreRedisClient))(),
      ]);
    },
  };
}

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
  const variant = await new CyvasseVariantService().createVariant(creatorId, {
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
  const pieceRule = await new CyvassePieceRuleDataService().createPieceRule(
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
  const terrainRule = await new CyvasseTerrainRuleDataService().createTerrainRule(
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
  opponentUserId?: number
): Promise<number> {
  const challenge = await new CyvasseChallengeDataService().createChallenge(
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
    .expect(StatusCodes.OK);
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
