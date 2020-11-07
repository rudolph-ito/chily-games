import express from "express";
import expressSession from "express-session";
import expressCookieParser from "cookie-parser";
import expressBodyParser from "body-parser";
import expressCors from "cors";
import { initAuthController } from "./auth";
import { createServer, Server } from "https";
import { join as pathJoin } from "path";
import { readFileSync } from "fs";
import {
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "../services/shared/exceptions";
import HttpStatus from "http-status-codes";
import { getUserRouter } from "./user";
import newSocketIoServer from "socket.io";
import newSocketIoRedisAdapter from "socket.io-redis";
import { RedisClient } from "redis";
import connectRedis from "connect-redis";
import { getCyvasseRouter } from './cyvasse';

const certsDir = pathJoin(__dirname, "..", "..", "certs");
const RedisStore = connectRedis(expressSession);

export interface ICreateExpressAppOptions {
  corsOrigins: string[];
  publishRedisClient: RedisClient;
  sessionCookieSecure: boolean;
  sessionSecret: string;
  sessionStoreRedisClient: RedisClient;
}

export type RedisClientBuilder = () => RedisClient;

export interface IStartServerOptions {
  corsOrigins: string[];
  port: number;
  redisClientBuilder: RedisClientBuilder;
  sessionCookieSecure: boolean;
  sessionSecret: string;
  shouldLog: boolean;
}

function errorHandler(): express.ErrorRequestHandler {
  return (err, req, res, next) => {
    if (err instanceof AuthorizationError) {
      res.status(HttpStatus.FORBIDDEN).send(err.message);
    } else if (err instanceof NotFoundError) {
      res.status(HttpStatus.NOT_FOUND).send(err.message);
    } else if (err instanceof ValidationError) {
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json(err.errors);
    } else {
      console.error(err.stack);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: err.stack });
    }
  };
}

export function createExpressApp(
  options: ICreateExpressAppOptions
): express.Express {
  const app = express();
  app.use("/assets", express.static(pathJoin(__dirname, "..", "assets")));
  app.use(expressCookieParser());
  app.use(expressBodyParser.json());
  app.use(
    expressSession({
      cookie: { secure: options.sessionCookieSecure },
      resave: false,
      saveUninitialized: false,
      secret: options.sessionSecret,
      store: new RedisStore({ client: options.sessionStoreRedisClient }),
    })
  );
  if (options.corsOrigins.length > 0) {
    app.use(expressCors({ origin: options.corsOrigins }));
  }
  app.get("/api/health", function (req, res) {
    res.status(200).end();
  });
  const authenticationRequired = initAuthController(app, "/api/auth");
  app.use("/api/cyvasse", getCyvasseRouter(authenticationRequired, options.publishRedisClient));
  app.use("/api/users", getUserRouter());
  app.use(errorHandler());
  return app;
}

export function startServer(options: IStartServerOptions): Server {
  const publishRedisClient = options.redisClientBuilder();
  const subscribeRedisClient = options.redisClientBuilder();
  const sessionStoreRedisClient = options.redisClientBuilder();
  const app = createExpressApp({
    corsOrigins: options.corsOrigins,
    publishRedisClient,
    sessionCookieSecure: options.sessionCookieSecure,
    sessionSecret: options.sessionSecret,
    sessionStoreRedisClient,
  });
  const serverOptions = {
    key: readFileSync(pathJoin(certsDir, "server.key")),
    cert: readFileSync(pathJoin(certsDir, "server.cert")),
  };
  const server = createServer(serverOptions, app);
  const socketIoServer = newSocketIoServer(server);
  socketIoServer.adapter(
    newSocketIoRedisAdapter({
      pubClient: publishRedisClient,
      subClient: subscribeRedisClient,
    })
  );
  socketIoServer.on("connection", (socket) => {
    socket.on("cyvasse-join-game", (gameId: number) => {
      socket.join(`cyvasse-game-${gameId}`);
    });
  });
  server.listen(options.port, () => {
    if (options.shouldLog) {
      console.log(`App listening on port ${options.port}!`);
    }
  });
  return server;
}
