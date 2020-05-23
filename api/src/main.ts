import { startServer } from "./controllers";
import { valueOrDefault } from "./shared/utilities/value_checker";

const corsOrigins = valueOrDefault(process.env.CORS_ORIGINS, "").split(",");
const port = parseInt(process.env.PORT, 10);
const sessionCookieSecure = process.env.NODE_ENV === "production";
const sessionSecret = process.env.SESSION_SECRET;

startServer({
  corsOrigins,
  port,
  sessionCookieSecure,
  sessionSecret,
  shouldLog: true,
});
