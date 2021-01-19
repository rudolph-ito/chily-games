import express from "express";
import { RedisClient } from "redis";
import {
  IYanivGameService,
  YanivGameService,
} from "../../services/yaniv/yaniv_game_service";
import { IUser } from "../../shared/dtos/authentication";
import newSocketIoEmitter from "socket.io-emitter";
import { INewGameStartedEvent, IPlayerJoinedEvent } from "src/shared/dtos/yaniv/game";

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
          newSocketIoEmitter(publishRedisClient as any)
            .to(`yaniv-game-${gameId}`)
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
          newSocketIoEmitter(publishRedisClient as any)
            .to(`yaniv-game-${gameId}`)
            .emit("round-started");
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
          ({
            cardPickedUpFromDeck,
            actionToNextPlayerEvent,
            roundFinishedEvent,
          }) => {
            res.status(200).send({
              cardPickedUpFromDeck,
              actionToNextPlayerEvent,
              roundFinishedEvent,
            });
            if (actionToNextPlayerEvent != null) {
              newSocketIoEmitter(publishRedisClient as any)
                .to(`yaniv-game-${gameId}`)
                .emit("action-to-next-player", actionToNextPlayerEvent);
            }
            if (roundFinishedEvent != null) {
              newSocketIoEmitter(publishRedisClient as any)
                .to(`yaniv-game-${gameId}`)
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
      const userId = (req.user as IUser).userId
      gameService
        .create(userId, req.body)
        .then((game) => {
          res.status(200).send(game);
          const event: INewGameStartedEvent = {
            gameId: game.gameId,
            userId 
          }
          newSocketIoEmitter(publishRedisClient as any)
            .to(`yaniv-game-${gameId}`)
            .emit("new-game-started", event);
        })
        .catch(next);
    }
  );
  return router;
}
