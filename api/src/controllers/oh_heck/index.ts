import express from "express";
import { SimpleRedisClient } from "src/redis";
import { getGameRouter } from "./game";

export function getOhHeckRouter(
  authenticationRequired: express.Handler,
  publishRedisClient: SimpleRedisClient
): express.Router {
  const router = express.Router();
  router.use(
    "/games",
    getGameRouter(authenticationRequired, publishRedisClient)
  );
  return router;
}
