// Generated with Claude Code - CS 3660 Sprint 3
import { createApp } from "./app.js";

const port = process.env.PORT ?? 3000;
const app = createApp();

const server = app.listen(port, () => {
  console.log(JSON.stringify({ event: "server.boot", port, ts: new Date().toISOString() }));
});

function shutdown(signal) {
  console.log(JSON.stringify({ event: "server.shutdown", signal, ts: new Date().toISOString() }));
  server.close(() => process.exit(0));
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
