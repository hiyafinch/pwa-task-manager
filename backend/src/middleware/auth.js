// Generated with Claude Code - CS 3660 Sprint 3
import { verifyAccessToken } from "../lib/jwt.js";

export const auth = (keyStore) => async (ctx, next) => {
  const header = ctx.get("Authorization");
  if (!header?.startsWith("Bearer ")) {
    ctx.throw(401, "Missing bearer token", { expose: true, code: "UNAUTHORIZED" });
  }
  const token = header.slice("Bearer ".length);
  try {
    const payload = await verifyAccessToken(token, keyStore);
    ctx.state.user = { id: payload.sub, email: payload.email };
  } catch {
    ctx.throw(401, "Invalid or expired token", { expose: true, code: "UNAUTHORIZED" });
  }
  await next();
};
