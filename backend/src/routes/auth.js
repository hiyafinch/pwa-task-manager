// Generated with Claude Code - CS 3660 Sprint 3
import Router from "@koa/router";
import { hashPassword } from "../db/seed.js";
import { signAccessToken, toJwks } from "../lib/jwt.js";

const ACCESS_TOKEN_TTL = Number(process.env.ACCESS_TOKEN_TTL ?? 28800); // 8 hours, see plan 0.2 item 7

export function createAuthRouter(db, keyStore) {
  const router = new Router();

  router.post("/auth/login", async (ctx) => {
    const { email, password } = ctx.request.body ?? {};
    if (!email || !password) {
      ctx.throw(400, "email and password are required", { expose: true, code: "VALIDATION_FAILED" });
    }
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user || user.password_hash !== hashPassword(password)) {
      ctx.throw(401, "Invalid email or password", { expose: true, code: "UNAUTHORIZED" });
    }
    const { token, expiresIn } = await signAccessToken({ sub: user.id, email: user.email }, keyStore, ACCESS_TOKEN_TTL);
    ctx.body = { accessToken: token, expiresIn, user: { id: user.id, email: user.email } };
  });

  router.get("/.well-known/jwks.json", async (ctx) => {
    ctx.body = await toJwks(keyStore);
  });

  return router;
}
