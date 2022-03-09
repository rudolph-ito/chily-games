import { startServer } from "./controllers";
import { createClient } from "redis";

if (process.env.PORT == null) {
  throw new Error("PORT environment variable in required");
}
const port = parseInt(process.env.PORT, 10);
if (process.env.SESSION_SECRET == null) {
  throw new Error("SESSION_SECRET environment variable in required");
}
const sessionSecret = process.env.SESSION_SECRET;
const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

startServer({
  port,
  redisClientBuilder: () => createClient({ url: redisUrl, legacyMode: true }),
  sessionSecret,
  shouldLog: true,
});
