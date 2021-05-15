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
import { createAdapter as createSocketIoRedisAdapter } from "socket.io-redis";
import { RedisClient } from "redis";
import connectRedis from "connect-redis";
import { getCyvasseRouter } from "./cyvasse";
import { getYanivRouter } from "./yaniv";
import { getOhHeckRouter } from "./oh_heck";
import { getChatRouter } from "./chat";

const RedisStore = connectRedis(expressSession);

export interface ICreateExpressAppOptions {
  publishRedisClient: RedisClient;
  sessionSecret: string;
  sessionStoreRedisClient: RedisClient;
}

export type RedisClientBuilder = () => RedisClient;

export interface IStartServerOptions {
  port: number;
  redisClientBuilder: RedisClientBuilder;
  sessionSecret: string;
  shouldLog: boolean;
}

function errorHandler(): express.ErrorRequestHandler {
  return (err, req, res, next) => {
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
    "/api/cyvasse",
    getCyvasseRouter(authenticationRequired, options.publishRedisClient)
  );
  app.use(
    "/api/oh-heck",
    getOhHeckRouter(authenticationRequired, options.publishRedisClient)
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

export function startServer(options: IStartServerOptions): HttpServer {
  const publishRedisClient = options.redisClientBuilder();
  const subscribeRedisClient = options.redisClientBuilder();
  const sessionStoreRedisClient = options.redisClientBuilder();
  const app = createExpressApp({
    publishRedisClient,
    sessionSecret: options.sessionSecret,
    sessionStoreRedisClient,
  });
  const server = createServer(app);
  const socketIoServer = new SocketIoServer(server);
  socketIoServer.adapter(
    createSocketIoRedisAdapter({
      pubClient: publishRedisClient,
      subClient: subscribeRedisClient,
    })
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
