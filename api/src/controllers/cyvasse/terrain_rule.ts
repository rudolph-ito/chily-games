import express from "express";
import { IUser } from "../../shared/dtos/authentication";
import { CyvasseTerrainRuleService } from "../../services/cyvasse/cyvasse_terrain_rule_service";

export function getTerrainRulesRouter(
  authenticationRequired: express.Handler,
  terrainRuleService: CyvasseTerrainRuleService = new CyvasseTerrainRuleService()
): express.Router {
  const router = express.Router({ mergeParams: true });
  router.get("/variants/:variantId/terrainRules", function (req, res, next) {
    terrainRuleService
      .getTerrainRules(parseInt(req.params.variantId))
      .then((terrainRules) => {
        res.status(200).send(terrainRules);
      })
      .catch(next);
  });
  router.post("/variants/:variantId/terrainRules", authenticationRequired, function (req, res, next) {
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
  router.get(
    "/variants/:variantId/terrainRules/:terrainRuleId",
    authenticationRequired,
    function (req, res, next) {
      terrainRuleService
        .getTerrainRule(
          parseInt(req.params.variantId),
          parseInt(req.params.terrainRuleId)
        )
        .then((terrainRule) => {
          res.status(200).send(terrainRule);
        })
        .catch(next);
    }
  );
  router.put(
    "/variants/:variantId/terrainRules/:terrainRuleId",
    authenticationRequired,
    function (req, res, next) {
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
    }
  );
  router.delete(
    "/variants/:variantId/terrainRules/:terrainRuleId",
    authenticationRequired,
    function (req, res, next) {
      terrainRuleService
        .deleteTerrainRule(
          (req.user as IUser).userId,
          parseInt(req.params.variantId),
          parseInt(req.params.terrainRuleId)
        )
        .then(() => res.status(200).end())
        .catch(next);
    }
  );
  return router;
}
