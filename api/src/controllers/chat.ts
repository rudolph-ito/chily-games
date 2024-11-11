import express from "express";
import { IUser } from "../shared/dtos/authentication";
import { Emitter as SocketIoRedisEmitter } from "@socket.io/redis-emitter";
import { ChatService, IChatService } from "../services/shared/chat_service";
import { SimpleRedisClient } from "src/redis";

export function getChatRouter(
  authenticationRequired: express.Handler,
  publishRedisClient: SimpleRedisClient,
  chatService: IChatService = new ChatService()
): express.Router {
  const router = express.Router();
  router.post("/:chatId", authenticationRequired, function (req, res, next) {
    const chatId = req.params.chatId;
    const userId = (req.user as IUser).userId;
    chatService
      .addMessage(chatId, userId, req.body)
      .then((newChatMessageEvent) => {
        res.status(200).end();
        new SocketIoRedisEmitter(publishRedisClient as any)
          .to(`chat-${chatId}`)
          .emit("new-message", newChatMessageEvent);
      })
      .catch(next);
  });
  router.get("/:chatId", function (req, res, next) {
    chatService
      .get(req.params.chatId)
      .then((chat) => {
        res.status(200).send(chat);
      })
      .catch(next);
  });
  return router;
}
