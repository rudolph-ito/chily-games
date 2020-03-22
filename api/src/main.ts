import { startServer } from "./controllers";

const port = parseInt(process.env.PORT, 10);
const sessionSecret = process.env.SESSION_SECRET;

startServer({
  port,
  sessionSecret,
  shouldLog: true
});
