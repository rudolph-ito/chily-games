import express from "express";
import { RedisClient } from "redis";
import {
  IYanivGameService,
  YanivGameService,
} from "../../services/yaniv/yaniv_game_service";
import { IUser } from "../../shared/dtos/authentication";
import { doesHaveValue } from "../../shared/utilities/value_checker";

export function getGameRouter(
  authenticationRequired: express.Handler,
  publishRedisClient: RedisClient,
  gameService: IYanivGameService = new YanivGameService()
): express.Router {
  const router = express.Router();
  router.post("/", authenticationRequired, function (req, res, next) {
    gameService
      .create((req.user as IUser).userId, req.body)
      .then((game) => {
        res.status(200).send(game);
      })
      .catch(next);
  });
  router.post("/search", function (req, res, next) {
    // search for games
  });
  router.get("/:gameId", function (req, res, next) {
    const userId = doesHaveValue(req.user) ? (req.user as IUser).userId : null;
    gameService
      .get(userId, parseInt(req.params.gameId))
      .then((game) => {
        res.status(200).send(game);
      })
      .catch(next);
  });
  router.put("/:gameId/join", authenticationRequired, function (
    req,
    res,
    next
  ) {
    gameService
      .join((req.user as IUser).userId, parseInt(req.params.gameId))
      .then((game) => {
        res.status(200).send(game);
      })
      .catch(next);
  });
  router.put("/:gameId/start-round", authenticationRequired, function (
    req,
    res,
    next
  ) {
    gameService
      .startRound((req.user as IUser).userId, parseInt(req.params.gameId))
      .then((game) => {
        res.status(200).send(game);
      })
      .catch(next);
  });
  router.put("/:gameId/play-turn", authenticationRequired, function (
    req,
    res,
    next
  ) {
    // take action in game
  });
  router.put("/:gameId/settings", authenticationRequired, function (
    req,
    res,
    next
  ) {
    // update settings in game
  });
  return router;
}
