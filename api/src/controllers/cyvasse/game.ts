import express from "express";
import {
  ICyvasseGameService,
  CyvasseGameService,
} from "../../services/cyvasse/cyvasse_game_service";
import { doesHaveValue } from "../../shared/utilities/value_checker";
import { IUser } from "../../shared/dtos/authentication";
import newSocketIoEmitter from "socket.io-emitter";
import { RedisClient } from "redis";

export function getGameRouter(
  authenticationRequired: express.Handler,
  publishRedisClient: RedisClient,
  gameService: ICyvasseGameService = new CyvasseGameService()
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
  router.get("/:gameId/rules", function (req, res, next) {
    gameService
      .getGameRules(parseInt(req.params.gameId))
      .then((rules) => {
        res.status(200).send(rules);
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
  router.post("/:gameId/validPlies", authenticationRequired, function (
    req,
    res,
    next
  ) {
    gameService
      .getValidPlies(parseInt(req.params.gameId), req.body)
      .then((validPlies) => {
        res.status(200).send(validPlies);
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
      .then((gamePlyEvent) => {
        res.status(200).end();
        newSocketIoEmitter(publishRedisClient as any)
          .to(`cyvasse-game-${req.params.gameId}`)
          .emit("game-ply", gamePlyEvent);
      })
      .catch(next);
  });
  router.post("/:gameId/abort", authenticationRequired, function (
    req,
    res,
    next
  ) {
    gameService
      .abortGame((req.user as IUser).userId, parseInt(req.params.gameId))
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
      .resignGame((req.user as IUser).userId, parseInt(req.params.gameId))
      .then(() => {
        res.status(200).end();
      })
      .catch(next);
  });
  return router;
}
