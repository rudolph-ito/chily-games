import express from "express";
import { RedisClient } from "redis";
import { IUser } from "../../shared/dtos/authentication";
import { Emitter as SocketIoRedisEmitter } from "@socket.io/redis-emitter";
import {
  IRummyGameService,
  RummyGameService,
} from "../../services/rummy/rummy_game_service";
import {
  INewGameStartedEvent,
  IPlayerJoinedEvent,
} from "../../shared/dtos/rummy/game";

export function getGameRouter(
  authenticationRequired: express.Handler,
  publishRedisClient: RedisClient,
  gameService: IRummyGameService = new RummyGameService()
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
  router.get(
    "/abort_unfinished_games",
    authenticationRequired,
    function (req, res, next) {
      gameService
        .abortUnfinishedGames()
        .then((count) => {
          res.status(200).send(`Aborted ${count} unfinished games`);
        })
        .catch(next);
    }
  );
  router.post("/search", function (req, res, next) {
    gameService
      .search(req.body)
      .then((paginatedGames) => {
        res.status(200).send(paginatedGames);
      })
      .catch(next);
  });
  router.get("/:gameId", function (req, res, next) {
    const userId = req.user != null ? (req.user as IUser).userId : null;
    gameService
      .get(userId, parseInt(req.params.gameId))
      .then((game) => {
        res.status(200).send(game);
      })
      .catch(next);
  });
  router.put(
    "/:gameId/join",
    authenticationRequired,
    function (req, res, next) {
      const gameId = parseInt(req.params.gameId);
      gameService
        .join((req.user as IUser).userId, gameId)
        .then((game) => {
          res.status(200).send(game);
          const playerJoinedEvent: IPlayerJoinedEvent = {
            playerStates: game.playerStates,
          };
          new SocketIoRedisEmitter(publishRedisClient)
            .to(`rummy-game-${gameId}`)
            .emit("player-joined", playerJoinedEvent);
        })
        .catch(next);
    }
  );
  router.put(
    "/:gameId/start-round",
    authenticationRequired,
    function (req, res, next) {
      const gameId = parseInt(req.params.gameId);
      gameService
        .startRound((req.user as IUser).userId, gameId)
        .then((game) => {
          res.status(200).send(game);
          new SocketIoRedisEmitter(publishRedisClient)
            .to(`rummy-game-${gameId}`)
            .emit("round-started");
        })
        .catch(next);
    }
  );
  router.put(
    "/:gameId/rearrange-cards",
    authenticationRequired,
    function (req, res, next) {
      const gameId = parseInt(req.params.gameId);
      gameService
        .rearrangeCards((req.user as IUser).userId, gameId, req.body)
        .then(() => {
          res.status(200).end();
        })
        .catch(next);
    }
  );
  router.put(
    "/:gameId/pickup",
    authenticationRequired,
    function (req, res, next) {
      const gameId = parseInt(req.params.gameId);
      gameService
        .pickup((req.user as IUser).userId, gameId, req.body)
        .then((result) => {
          res.status(200).send(result);
          new SocketIoRedisEmitter(publishRedisClient)
            .to(`rummy-game-${gameId}`)
            .emit("pickup", result.event);
        })
        .catch(next);
    }
  );
  router.put(
    "/:gameId/meld",
    authenticationRequired,
    function (req, res, next) {
      const gameId = parseInt(req.params.gameId);
      gameService
        .meld((req.user as IUser).userId, gameId, req.body)
        .then((event) => {
          res.status(200).send(event);
          new SocketIoRedisEmitter(publishRedisClient)
            .to(`rummy-game-${gameId}`)
            .emit("meld", event);
        })
        .catch(next);
    }
  );
  router.put(
    "/:gameId/discard",
    authenticationRequired,
    function (req, res, next) {
      const gameId = parseInt(req.params.gameId);
      gameService
        .discard((req.user as IUser).userId, gameId, req.body)
        .then((event) => {
          res.status(200).send(event);
          new SocketIoRedisEmitter(publishRedisClient)
            .to(`rummy-game-${gameId}`)
            .emit("discard", event);
        })
        .catch(next);
    }
  );
  router.post(
    "/:gameId/rematch",
    authenticationRequired,
    function (req, res, next) {
      const gameId = parseInt(req.params.gameId);
      const userId = (req.user as IUser).userId;
      gameService
        .create(userId, req.body)
        .then((game) => {
          res.status(200).send(game);
          const event: INewGameStartedEvent = {
            gameId: game.gameId,
            userId,
          };
          new SocketIoRedisEmitter(publishRedisClient)
            .to(`rummy-game-${gameId}`)
            .emit("new-game-started", event);
        })
        .catch(next);
    }
  );
  router.put(
    "/:gameId/abort",
    authenticationRequired,
    function (req, res, next) {
      const gameId = parseInt(req.params.gameId);
      const userId = (req.user as IUser).userId;
      gameService
        .abort(userId, gameId)
        .then((game) => {
          res.status(200).send(game);
          new SocketIoRedisEmitter(publishRedisClient)
            .to(`rummy-game-${gameId}`)
            .emit("aborted");
        })
        .catch(next);
    }
  );
  return router;
}
