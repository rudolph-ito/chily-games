import express from "express";
import { VariantService } from "../services/variant_service";
import { doesHaveValue } from "../shared/utilities/value_checker";
import { IUser } from "../shared/dtos/authentication";

export function getVariantRouter(
  authenticationRequired: express.Handler,
  variantService: VariantService = new VariantService()
): express.Router {
  const router = express.Router();
  router.post("/search", function(req, res, next) {
    variantService
      .searchVariants(req.body)
      .then(({ paginatedVariants }) => {
        res.status(200).send(paginatedVariants);
      })
      .catch(next);
  });
  router.get("/:variantId", function(req, res, next) {
    variantService
      .getVariant(parseInt(req.params.variantId))
      .then(({ error, variant }) => {
        if (doesHaveValue(error)) {
          if (doesHaveValue(error.notFoundError)) {
            res.status(404).send(error.notFoundError);
          } else {
            next(new Error("Unexpected error"));
          }
        } else {
          res.status(200).send(variant);
        }
      })
      .catch(next);
  });
  router.put("/:variantId", function(req, res, next) {
    variantService
      .updateVariant(
        (req.user as IUser).userId,
        parseInt(req.params.variantId),
        req.body
      )
      .then(({ error, variant }) => {
        if (doesHaveValue(error)) {
          if (doesHaveValue(error.validationErrors)) {
            res.status(424).json(error.validationErrors);
          } else if (doesHaveValue(error.authorizationError)) {
            res.status(401).end();
          } else if (doesHaveValue(error.notFoundError)) {
            res.status(404).end();
          } else {
            next(new Error("Unexpected error"));
          }
        } else {
          res.status(200).send(variant);
        }
      })
      .catch(next);
  });
  router.post("/", authenticationRequired, function(req, res, next) {
    variantService
      .createVariant((req.user as IUser).userId, req.body)
      .then(({ error, variant }) => {
        if (doesHaveValue(error)) {
          if (doesHaveValue(error.validationErrors)) {
            res.status(424).json(error.validationErrors);
          } else {
            next(new Error("Unexpected error"));
          }
        } else {
          res.status(200).send(variant);
        }
      })
      .catch(next);
  });
  return router;
}
