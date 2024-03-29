import express from "express";
import { IUser } from "../../shared/dtos/authentication";
import { CyvassePieceRuleService } from "../../services/cyvasse/cyvasse_piece_rule_service";

export function getPieceRulesRouter(
  authenticationRequired: express.Handler,
  pieceRuleService: CyvassePieceRuleService = new CyvassePieceRuleService()
): express.Router {
  const router = express.Router();
  router.get("/variants/:variantId/pieceRules/", function (req, res, next) {
    pieceRuleService
      .getPieceRules(parseInt(req.params.variantId))
      .then((pieceRules) => {
        res.status(200).send(pieceRules);
      })
      .catch(next);
  });
  router.post(
    "/variants/:variantId/pieceRules/",
    authenticationRequired,
    function (req, res, next) {
      pieceRuleService
        .createPieceRule(
          (req.user as IUser).userId,
          parseInt(req.params.variantId),
          req.body
        )
        .then((pieceRule) => {
          res.status(200).send(pieceRule);
        })
        .catch(next);
    }
  );
  router.get(
    "/variants/:variantId/pieceRules/:pieceRuleId",
    authenticationRequired,
    function (req, res, next) {
      pieceRuleService
        .getPieceRule(
          parseInt(req.params.variantId),
          parseInt(req.params.pieceRuleId)
        )
        .then((pieceRule) => {
          res.status(200).send(pieceRule);
        })
        .catch(next);
    }
  );
  router.put(
    "/variants/:variantId/pieceRules/:pieceRuleId",
    authenticationRequired,
    function (req, res, next) {
      pieceRuleService
        .updatePieceRule(
          (req.user as IUser).userId,
          parseInt(req.params.variantId),
          parseInt(req.params.pieceRuleId),
          req.body
        )
        .then((pieceRule) => {
          res.status(200).send(pieceRule);
        })
        .catch(next);
    }
  );
  router.delete(
    "/variants/:variantId/pieceRules/:pieceRuleId",
    authenticationRequired,
    function (req, res, next) {
      pieceRuleService
        .deletePieceRule(
          (req.user as IUser).userId,
          parseInt(req.params.variantId),
          parseInt(req.params.pieceRuleId)
        )
        .then(() => res.status(200).end())
        .catch(next);
    }
  );
  return router;
}
