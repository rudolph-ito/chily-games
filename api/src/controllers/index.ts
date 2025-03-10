import express from "express";
import expressSession from "express-session";
import expressCookieParser from "cookie-parser";
import expressBodyParser from "body-parser";
import { initAuthController } from "./auth";
import { createServer, Server as HttpServer } from "http";
import { join as pathJoin } from "path";
import {
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "../services/shared/exceptions";
import { StatusCodes } from "http-status-codes";
import { getUserRouter } from "./user";
import { Server as SocketIoServer } from "socket.io";
import { createAdapter as createSocketIoRedisAdapter } from "@socket.io/redis-adapter";
import RedisStore from "connect-redis";
import { getYanivRouter } from "./yaniv";
import { getOhHeckRouter } from "./oh_heck";
import { getChatRouter } from "./chat";
import { SimpleRedisClient } from "src/redis";
import { getRummikubRouter } from "./rummikub";

export interface ICreateExpressAppOptions {
  publishRedisClient: SimpleRedisClient;
  sessionSecret: string;
  sessionStoreRedisClient: SimpleRedisClient;
}

export type RedisClientBuilder = () => SimpleRedisClient;

export interface IStartServerOptions {
  port: number;
  redisClientBuilder: RedisClientBuilder;
  sessionSecret: string;
  shouldLog: boolean;
}

function errorHandler(): express.ErrorRequestHandler {
  return (err, req, res, _next) => {
    if (err instanceof AuthorizationError) {
      res.status(StatusCodes.FORBIDDEN).send(err.message);
    } else if (err instanceof NotFoundError) {
      res.status(StatusCodes.NOT_FOUND).send(err.message);
    } else if (err instanceof ValidationError) {
      res.status(StatusCodes.UNPROCESSABLE_ENTITY).json(err.errors);
    } else {
      console.error(err.stack);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.stack });
    }
  };
}

export function createExpressApp(
  options: ICreateExpressAppOptions
): express.Express {
  const app = express();
  app.use("/", express.static(pathJoin(__dirname, "..", "frontend")));
  app.use("/assets", express.static(pathJoin(__dirname, "..", "assets")));
  app.use(expressCookieParser());
  app.use(expressBodyParser.json());
  app.use(
    expressSession({
      cookie: { secure: false },
      resave: false,
      saveUninitialized: false,
      secret: options.sessionSecret,
      store: new RedisStore({ client: options.sessionStoreRedisClient }),
    })
  );
  app.get("/api/health", function (req, res) {
    res.status(200).end();
  });
  const authenticationRequired = initAuthController(app, "/api/auth");
  app.use(
    "/api/chats",
    getChatRouter(authenticationRequired, options.publishRedisClient)
  );
  app.use(
    "/api/oh-heck",
    getOhHeckRouter(authenticationRequired, options.publishRedisClient)
  );
  app.use(
    "/api/rummikub",
    getRummikubRouter(authenticationRequired, options.publishRedisClient)
  );
  app.use("/api/users", getUserRouter());
  app.use(
    "/api/yaniv",
    getYanivRouter(authenticationRequired, options.publishRedisClient)
  );
  app.use(function (req, res) {
    res.sendFile(pathJoin(__dirname, "..", "frontend", "index.html"));
  });
  app.use(errorHandler());
  return app;
}

export async function startServer(
  options: IStartServerOptions
): Promise<HttpServer> {
  const publishRedisClient = options.redisClientBuilder();
  await publishRedisClient.connect();
  publishRedisClient.on("error", (e) => console.error(e));
  const subscribeRedisClient = options.redisClientBuilder();
  await subscribeRedisClient.connect();
  subscribeRedisClient.on("error", (e) => console.error(e));
  const sessionStoreRedisClient = options.redisClientBuilder();
  await sessionStoreRedisClient.connect();
  sessionStoreRedisClient.on("error", (e) => console.error(e));
  const app = createExpressApp({
    publishRedisClient,
    sessionSecret: options.sessionSecret,
    sessionStoreRedisClient,
  });
  const server = createServer(app);
  const socketIoServer = new SocketIoServer(server);
  socketIoServer.adapter(
    createSocketIoRedisAdapter(publishRedisClient, subscribeRedisClient)
  );
  socketIoServer.on("connection", (socket) => {
    socket.on("cyvasse-join-game", (gameId: number) => {
      socket.join(`cyvasse-game-${gameId}`);
    });
    socket.on("cyvasse-leav-game", (gameId: number) => {
      socket.leave(`cyvasse-game-${gameId}`);
    });
    socket.on("oh-heck-join-game", (gameId: number) => {
      socket.join(`oh-heck-game-${gameId}`);
    });
    socket.on("oh-heck-leave-game", (gameId: number) => {
      socket.leave(`oh-heck-game-${gameId}`);
    });
    socket.on("yaniv-join-game", (gameId: number) => {
      socket.join(`yaniv-game-${gameId}`);
    });
    socket.on("yaniv-leave-game", (gameId: number) => {
      socket.leave(`yaniv-game-${gameId}`);
    });
    socket.on("rummikub-join-game", (gameId: number) => {
      socket.join(`rummikub-game-${gameId}`);
    });
    socket.on("rummikub-leave-game", (gameId: number) => {
      socket.leave(`rummikub-game-${gameId}`);
    });
    socket.on("chat-join", (chatId: string) => {
      socket.join(`chat-${chatId}`);
    });
    socket.on("chat-leave", (chatId: string) => {
      socket.leave(`chat-${chatId}`);
    });
  });
  server.listen(options.port, () => {
    if (options.shouldLog) {
      console.log(`App listening on port ${options.port}!`);
    }
  });
  return server;
}
