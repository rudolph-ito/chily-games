import express from "express";
import { getVariantRouter } from "./variant";
import { getPieceRulesRouter } from "./piece_rule";
import { getTerrainRulesRouter } from "./terrain_rule";
import { getChallengeRouter } from "./challenge";
import { getGameRouter } from "./game";
import { RedisClient } from "redis";

export function getCyvasseRouter(
  authenticationRequired: express.Handler,
  publishRedisClient: RedisClient
): express.Router {
  const router = express.Router();
  router.use("/variants", getVariantRouter(authenticationRequired));
  router.use(
    "/variants/:variantId/pieceRules",
    getPieceRulesRouter(authenticationRequired)
  );
  router.use(
    "/variants/:variantId/terrainRules",
    getTerrainRulesRouter(authenticationRequired)
  );
  router.use("/challenges", getChallengeRouter(authenticationRequired));
  router.use(
    "/games",
    getGameRouter(authenticationRequired, publishRedisClient)
  );
  return router
}