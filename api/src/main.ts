import { startServer } from "./controllers";
import { valueOrDefault } from "./shared/utilities/value_checker";
import { createClient } from "redis";

const corsOrigins = valueOrDefault(process.env.CORS_ORIGINS, "").split(",");
const port = parseInt(process.env.PORT, 10);
const sessionSecret = process.env.SESSION_SECRET;
const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

startServer({
  corsOrigins,
  port,
  redisClientBuilder: () => createClient({ url: redisUrl }),
  sessionSecret,
  shouldLog: true,
});
