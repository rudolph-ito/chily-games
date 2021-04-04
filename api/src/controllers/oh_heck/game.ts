import express from "express";
import { RedisClient } from "redis";
import { IUser } from "../../shared/dtos/authentication";
import newSocketIoEmitter from "socket.io-emitter";
import {
  IOhHeckGameService,
  OhHeckGameService,
} from "../../services/oh_heck/oh_heck_game_service";
import {
  INewGameStartedEvent,
  IPlayerJoinedEvent,
} from "src/shared/dtos/oh_heck/game";
import { ChatService, IChatService } from "src/services/shared/chat_service";
import { getOhHeckGameChatId } from "src/shared/utilities/chat_id_generators";

export function getGameRouter(
  authenticationRequired: express.Handler,
  publishRedisClient: RedisClient,
  gameService: IOhHeckGameService = new OhHeckGameService(),
  chatService: IChatService = new ChatService(),
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
          newSocketIoEmitter(publishRedisClient as any)
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
          newSocketIoEmitter(publishRedisClient as any)
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
          newSocketIoEmitter(publishRedisClient as any)
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
          newSocketIoEmitter(publishRedisClient as any)
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
          newSocketIoEmitter(publishRedisClient as any)
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
          newSocketIoEmitter(publishRedisClient as any)
            .to(`oh-heck-game-${gameId}`)
            .emit("aborted");
        })
        .catch(next);
    }
  );
  router.put(
    "/:gameId/chat",
    authenticationRequired,
    function (req, res, next) {
      const gameId = parseInt(req.params.gameId);
      const chatId = getOhHeckGameChatId(gameId);
      const userId = (req.user as IUser).userId;
      chatService
        .addMessage(chatId, userId, req.body)
        .then((newChatMessageEvent) => {
          res.status(200).send(newChatMessageEvent);
          newSocketIoEmitter(publishRedisClient as any)
            .to(`oh-heck-game-${gameId}`)
            .emit("new-chat-message");
        })
        .catch(next);
    }
  );
  router.get(
    "/:gameId/chat",
    function (req, res, next) {
      const gameId = parseInt(req.params.gameId);
      const chatId = getOhHeckGameChatId(gameId);
      chatService
        .get(chatId)
        .then((chat) => {
          res.status(200).send(chat);
        })
        .catch(next);
    }
  );
  return router;
}
