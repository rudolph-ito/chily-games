import express from "express";
import {
  IRummikubGameService,
  RummikubGameService,
} from "../../services/rummikub/rummikub_game_service";
import { IUser } from "../../shared/dtos/authentication";
import { Emitter as SocketIoRedisEmitter } from "@socket.io/redis-emitter";
import {
  INewGameStartedEvent,
  IPlayerJoinedEvent,
} from "src/shared/dtos/rummikub/game";
import { SimpleRedisClient } from "src/redis";

export function getGameRouter(
  authenticationRequired: express.Handler,
  publishRedisClient: SimpleRedisClient,
  gameService: IRummikubGameService = new RummikubGameService()
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
            .to(`rummikub-game-${gameId}`)
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
            .to(`rummikub-game-${gameId}`)
            .emit("round-started");
        })
        .catch(next);
    }
  );
  router.put(
    "/:gameId/rearrange-tiles",
    authenticationRequired,
    function (req, res, next) {
      const gameId = parseInt(req.params.gameId);
      gameService
        .rearrangeTiles((req.user as IUser).userId, gameId, req.body)
        .then(() => {
          res.status(200).end();
        })
        .catch(next);
    }
  );
  router.put(
    "/:gameId/play",
    authenticationRequired,
    function (req, res, next) {
      const gameId = parseInt(req.params.gameId);
      gameService
        .play((req.user as IUser).userId, gameId, req.body)
        .then(
          ({ tilePickedUp, actionToNextPlayerEvent, roundFinishedEvent }) => {
            res.status(200).send({
              tilePickedUp,
              actionToNextPlayerEvent,
              roundFinishedEvent,
            });
            if (actionToNextPlayerEvent != null) {
              new SocketIoRedisEmitter(publishRedisClient)
                .to(`rummikub-game-${gameId}`)
                .emit("action-to-next-player", actionToNextPlayerEvent);
            }
            if (roundFinishedEvent != null) {
              new SocketIoRedisEmitter(publishRedisClient)
                .to(`rummikub-game-${gameId}`)
                .emit("round-finished", roundFinishedEvent);
            }
          }
        )
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
            .to(`rummikub-game-${gameId}`)
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
            .to(`rummikub-game-${gameId}`)
            .emit("aborted");
        })
        .catch(next);
    }
  );
  return router;
}
