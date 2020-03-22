import * as express from "express";
import * as expressSession from "express-session";
import * as expressBodyParser from "body-parser";
import { setupAuth } from "./auth";
import { Server } from "http";

export interface IStartServerOptions {
  port: number;
  sessionSecret: string;
  shouldLog: boolean;
}

export function startServer(options: IStartServerOptions): Server {
  const app = express();
  app.use(expressSession({ secret: options.sessionSecret }));
  app.use(expressBodyParser.json());
  setupAuth(app);

  return app.listen(options.port, () => {
    if (options.shouldLog) {
      console.log(`App listening on port ${options.port}!`);
    }
  });
}
