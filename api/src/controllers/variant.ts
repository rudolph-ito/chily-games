import express from "express";
import { VariantService, IVariantService } from "../services/variant_service";
import { IUser } from "../shared/dtos/authentication";

export function getVariantRouter(
  authenticationRequired: express.Handler,
  variantService: IVariantService = new VariantService()
): express.Router {
  const router = express.Router();
  router.post("/search", function (req, res, next) {
    variantService
      .searchVariants(req.body)
      .then((paginatedVariants) => {
        res.status(200).send(paginatedVariants);
      })
      .catch(next);
  });
  router.post("/:variantId/preview/pieceRule", function (req, res, next) {
    variantService
      .previewPieceRule(parseInt(req.params.variantId), req.body)
      .then((result) => {
        res.status(200).send(result);
      })
      .catch(next);
  });
  router.get("/:variantId", function (req, res, next) {
    variantService
      .getVariant(parseInt(req.params.variantId))
      .then((variant) => {
        res.status(200).send(variant);
      })
      .catch(next);
  });
  router.put("/:variantId", authenticationRequired, function (req, res, next) {
    variantService
      .updateVariant(
        (req.user as IUser).userId,
        parseInt(req.params.variantId),
        req.body
      )
      .then((variant) => {
        res.status(200).send(variant);
      })
      .catch(next);
  });
  router.post("/", authenticationRequired, function (req, res, next) {
    variantService
      .createVariant((req.user as IUser).userId, req.body)
      .then((variant) => {
        res.status(200).send(variant);
      })
      .catch(next);
  });
  return router;
}
