// Generated with Claude Code - CS 3660 Sprint 3
import Router from "@koa/router";

const startedAt = Date.now();
const router = new Router();

router.get("/health", (ctx) => {
  ctx.body = {
    status: "ok",
    version: process.env.GIT_SHA ?? "dev",
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
  };
});

export default router;
