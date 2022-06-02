import express from "express";
import { getVariantRouter } from "./variant";
import { getPieceRulesRouter } from "./piece_rule";
import { getTerrainRulesRouter } from "./terrain_rule";
import { getChallengeRouter } from "./challenge";
import { getGameRouter } from "./game";
import { SimpleRedisClient } from "src/redis";

export function getCyvasseRouter(
  authenticationRequired: express.Handler,
  publishRedisClient: SimpleRedisClient
): express.Router {
  const router = express.Router();
  router.use("/variants", getVariantRouter(authenticationRequired));
  router.use(getPieceRulesRouter(authenticationRequired));
  router.use(getTerrainRulesRouter(authenticationRequired));
  router.use("/challenges", getChallengeRouter(authenticationRequired));
  router.use(
    "/games",
    getGameRouter(authenticationRequired, publishRedisClient)
  );
  return router;
}
