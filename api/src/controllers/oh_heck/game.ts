import express from "express";
import { IUser } from "../../shared/dtos/authentication";
import { Emitter as SocketIoRedisEmitter } from "@socket.io/redis-emitter";
import {
  IOhHeckGameService,
  OhHeckGameService,
} from "../../services/oh_heck/oh_heck_game_service";
import {
  INewGameStartedEvent,
  IPlayerJoinedEvent,
} from "src/shared/dtos/oh_heck/game";
import { SimpleRedisClient } from "src/redis";

export function getGameRouter(
  authenticationRequired: express.Handler,
  publishRedisClient: SimpleRedisClient,
  gameService: IOhHeckGameService = new OhHeckGameService()
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
            .to(`oh-heck-game-${gameId}`)
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
            .to(`oh-heck-game-${gameId}`)
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
    "/:gameId/place-bet",
    authenticationRequired,
    function (req, res, next) {
      const gameId = parseInt(req.params.gameId);
      gameService
        .placeBet((req.user as IUser).userId, gameId, req.body)
        .then((event) => {
          res.status(200).send(event);
          new SocketIoRedisEmitter(publishRedisClient)
            .to(`oh-heck-game-${gameId}`)
            .emit("bet-placed", event);
        })
        .catch(next);
    }
  );
  router.put(
    "/:gameId/play-card",
    authenticationRequired,
    function (req, res, next) {
      const gameId = parseInt(req.params.gameId);
      gameService
        .playCard((req.user as IUser).userId, gameId, req.body)
        .then((event) => {
          res.status(200).send(event);
          new SocketIoRedisEmitter(publishRedisClient)
            .to(`oh-heck-game-${gameId}`)
            .emit("card-played", event);
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
            .to(`oh-heck-game-${gameId}`)
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
            .to(`oh-heck-game-${gameId}`)
            .emit("aborted");
        })
        .catch(next);
    }
  );
  return router;
}
