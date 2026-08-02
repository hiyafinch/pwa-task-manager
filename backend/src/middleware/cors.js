// Generated with Claude Code - CS 3660 Sprint 3
export const cors = () => async (ctx, next) => {
  const origin = process.env.CORS_ORIGIN ?? "*";
  ctx.set("Access-Control-Allow-Origin", origin);
  ctx.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  ctx.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Idempotency-Key, X-Request-Id");
  if (ctx.method === "OPTIONS") {
    ctx.status = 204;
    return;
  }
  await next();
};
