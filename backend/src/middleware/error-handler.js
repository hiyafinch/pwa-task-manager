// Generated with Claude Code - CS 3660 Sprint 3
import { logger } from "../lib/logger.js";

export const errorHandler = () => async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    const status = err.status ?? err.statusCode ?? 500;
    ctx.status = status;
    ctx.body = {
      error: {
        code: err.code ?? (status === 500 ? "INTERNAL_ERROR" : "REQUEST_FAILED"),
        message: err.expose ? err.message : status === 500 ? "Internal server error" : err.message,
        requestId: ctx.state.requestId,
      },
    };
    if (status >= 500) {
      logger.error({ event: "http.error", message: err.message, requestId: ctx.state.requestId });
    }
  }
};
