import express from "express";

export function getErrorRouter(
  authenticationRequired: express.Handler
): express.Router {
  const router = express.Router();
  router.post("/log", authenticationRequired, function (req, res) {
    console.log(`Error sent to API: ${JSON.stringify(req.body)}`);
    res.sendStatus(204);
  });
  return router;
}
