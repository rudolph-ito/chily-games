import express from "express";
import { getGameRouter } from "./game";
import { RedisClient } from "redis";

export function getOhHeckRouter(
  authenticationRequired: express.Handler,
  publishRedisClient: RedisClient
): express.Router {
  const router = express.Router();
  router.use(
    "/games",
    getGameRouter(authenticationRequired, publishRedisClient)
  );
  return router;
}
