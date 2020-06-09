import express from "express";
import { IUser } from "../shared/dtos/authentication";
import { TerrainRuleService } from "../services/terrain_rule_service";

// Assumes parentRouter has variantId in params
export function getTerrainRulesRouter(
  authenticationRequired: express.Handler,
  terrainRuleService: TerrainRuleService = new TerrainRuleService()
): express.Router {
  const router = express.Router({ mergeParams: true });
  router.get("/", function (req, res, next) {
    terrainRuleService
      .getTerrainRules(parseInt(req.params.variantId))
      .then((terrainRules) => {
        res.status(200).send(terrainRules);
      })
      .catch(next);
  });
  router.post("/", authenticationRequired, function (req, res, next) {
    terrainRuleService
      .createTerrainRule(
        (req.user as IUser).userId,
        parseInt(req.params.variantId),
        req.body
      )
      .then((terrainRule) => {
        res.status(200).send(terrainRule);
      })
      .catch(next);
  });
  router.get("/:terrainRuleId", authenticationRequired, function (
    req,
    res,
    next
  ) {
    terrainRuleService
      .getTerrainRule(
        parseInt(req.params.variantId),
        parseInt(req.params.terrainRuleId)
      )
      .then((terrainRule) => {
        res.status(200).send(terrainRule);
      })
      .catch(next);
  });
  router.put("/:terrainRuleId", authenticationRequired, function (
    req,
    res,
    next
  ) {
    terrainRuleService
      .updateTerrainRule(
        (req.user as IUser).userId,
        parseInt(req.params.variantId),
        parseInt(req.params.terrainRuleId),
        req.body
      )
      .then((terrainRule) => {
        res.status(200).send(terrainRule);
      })
      .catch(next);
  });
  router.delete("/:terrainRuleId", authenticationRequired, function (
    req,
    res,
    next
  ) {
    terrainRuleService
      .deleteTerrainRule(
        (req.user as IUser).userId,
        parseInt(req.params.variantId),
        parseInt(req.params.terrainRuleId)
      )
      .then(() => res.status(200).end())
      .catch(next);
  });
  return router;
}
