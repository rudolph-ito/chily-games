import express from "express";
import { IGameService, GameService } from "../services/game_service";
import { doesHaveValue } from "../shared/utilities/value_checker";
import { IUser } from "../shared/dtos/authentication";

export function getGameRouter(
  authenticationRequired: express.Handler,
  gameService: IGameService = new GameService()
): express.Router {
  const router = express.Router();
  router.post("/search", function (req, res, next) {
    gameService
      .searchGames(req.body)
      .then((paginatedGames) => {
        res.status(200).send(paginatedGames);
      })
      .catch(next);
  });
  router.get("/:gameId", function (req, res, next) {
    const userId = doesHaveValue(req.user) ? (req.user as IUser).userId : null;
    gameService
      .getGame(userId, parseInt(req.params.gameId))
      .then((game) => {
        res.status(200).send(game);
      })
      .catch(next);
  });
  router.post("/:gameId/updateSetup", authenticationRequired, function (
    req,
    res,
    next
  ) {
    gameService
      .updateGameSetup(
        (req.user as IUser).userId,
        parseInt(req.params.gameId),
        req.body
      )
      .then(() => {
        res.status(200).end();
      })
      .catch(next);
  });
  router.post("/:gameId/completeSetup", authenticationRequired, function (
    req,
    res,
    next
  ) {
    gameService
      .completeGameSetup(
        (req.user as IUser).userId,
        parseInt(req.params.gameId)
      )
      .then(() => {
        res.status(200).end();
      })
      .catch(next);
  });
  router.post("/:gameId/createPly", authenticationRequired, function (
    req,
    res,
    next
  ) {
    gameService
      .createGamePly(
        (req.user as IUser).userId,
        parseInt(req.params.gameId),
        req.body
      )
      .then(() => {
        res.status(200).end();
      })
      .catch(next);
  });
  router.post("/:gameId/abort", authenticationRequired, function (
    req,
    res,
    next
  ) {
    gameService
      .abortGame(
        (req.user as IUser).userId,
        parseInt(req.params.gameId),
      )
      .then(() => {
        res.status(200).end();
      })
      .catch(next);
  });
  router.post("/:gameId/resign", authenticationRequired, function (
    req,
    res,
    next
  ) {
    gameService
      .resignGame(
        (req.user as IUser).userId,
        parseInt(req.params.gameId),
      )
      .then(() => {
        res.status(200).end();
      })
      .catch(next);
  });
  return router;
}
