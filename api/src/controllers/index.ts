import express from "express";
import expressSession from "express-session";
import expressCookieParser from "cookie-parser";
import expressBodyParser from "body-parser";
import expressCors from "cors";
import { initAuthController } from "./auth";
import { getVariantRouter } from "./variant";
import { createServer, Server } from "https";
import { join as pathJoin } from "path";
import { readFileSync } from "fs";
import {
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "../services/exceptions";
import { getPieceRulesRouter } from "./piece_rule";
import { getTerrainRulesRouter } from "./terrain_rule";
import { getChallengeRouter } from "./challenge";

const certsDir = pathJoin(__dirname, "..", "..", "certs");

export interface ICreateExpressAppOptions {
  corsOrigins: string[];
  sessionCookieSecure: boolean;
  sessionSecret: string;
}

export interface IStartServerOptions {
  corsOrigins: string[];
  port: number;
  sessionCookieSecure: boolean;
  sessionSecret: string;
  shouldLog: boolean;
}

function errorHandler(): express.ErrorRequestHandler {
  return (err, req, res, next) => {
    if (err instanceof AuthorizationError) {
      res.status(401);
      res.send(err.message);
    } else if (err instanceof NotFoundError) {
      res.status(404);
      res.send(err.message);
    } else if (err instanceof ValidationError) {
      res.status(422);
      res.json(err.errors);
    } else {
      res.status(500);
      res.json({ error: err.stack });
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
    })
  );
  if (options.corsOrigins.length > 0) {
    app.use(expressCors({ origin: options.corsOrigins }));
  }
  app.get("/api/health", function (req, res) {
    res.status(200).end();
  });
  const authenticationRequired = initAuthController(app, "/api/auth");
  app.use("/api/variants", getVariantRouter(authenticationRequired));
  app.use(
    "/api/variants/:variantId/pieceRules",
    getPieceRulesRouter(authenticationRequired)
  );
  app.use(
    "/api/variants/:variantId/terrainRules",
    getTerrainRulesRouter(authenticationRequired)
  );
  app.use("/api/challenges", getChallengeRouter(authenticationRequired));
  app.use(errorHandler());
  return app;
}

export function startServer(options: IStartServerOptions): Server {
  const app = createExpressApp(options);
  const serverOptions = {
    key: readFileSync(pathJoin(certsDir, "server.key")),
    cert: readFileSync(pathJoin(certsDir, "server.cert")),
  };
  return createServer(serverOptions, app).listen(options.port, () => {
    if (options.shouldLog) {
      console.log(`App listening on port ${options.port}!`);
    }
  });
}
