// Generated with Claude Code - CS 3660 Sprint 3
import Koa from "koa";
import Router from "@koa/router";
import healthRoutes from "./routes/health.js";

export function createApp() {
  const app = new Koa();
  const router = new Router();

  router.use(healthRoutes.routes(), healthRoutes.allowedMethods());

  app.use(router.routes());
  app.use(router.allowedMethods());
  return app;
}
