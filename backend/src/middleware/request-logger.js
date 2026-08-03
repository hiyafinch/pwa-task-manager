// Generated with Claude Code - CS 3660 Sprint 3
import { logger } from "../lib/logger.js";

export const requestLogger = () => async (ctx, next) => {
  const start = Date.now();
  await next();
  logger.info({
    event: "http.request",
    method: ctx.method,
    route: ctx.path,
    status: ctx.status,
    durationMs: Date.now() - start,
    requestId: ctx.state.requestId,
  });
};
