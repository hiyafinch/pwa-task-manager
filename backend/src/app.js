// Generated with Claude Code - CS 3660 Sprint 3
import Koa from "koa";
import Router from "@koa/router";
import bodyParser from "koa-bodyparser";
import { randomUUID } from "node:crypto";
import healthRoutes from "./routes/health.js";
import { createTasksRouter } from "./routes/tasks.js";
import { createAuthRouter } from "./routes/auth.js";
import { errorHandler } from "./middleware/error-handler.js";
import { idempotency } from "./middleware/idempotency.js";
import { auth } from "./middleware/auth.js";
import { cors } from "./middleware/cors.js";
import { getConnection } from "./db/connection.js";
import { runMigrations } from "./db/migrate.js";
import { seedDemoUser } from "./db/seed.js";
import { TaskRepository } from "./db/task-repository.js";
import { TaskService } from "./services/task-service.js";
import { lastWriteWins } from "./services/conflict-resolver.js";
import { loadKeyStore } from "./lib/key-store.js";

export function createApp({ db, keyStore } = {}) {
  const connection = db ?? getConnection();
  runMigrations(connection);
  seedDemoUser(connection);

  const repository = new TaskRepository(connection);
  const taskService = new TaskService(repository, lastWriteWins);
  const keys = keyStore ?? loadKeyStore();

  const app = new Koa();
  const router = new Router();

  app.use(cors());

  router.use(healthRoutes.routes(), healthRoutes.allowedMethods());

  app.use(async (ctx, next) => {
    ctx.state.requestId = ctx.get("X-Request-Id") || randomUUID();
    ctx.set("X-Request-Id", ctx.state.requestId);
    await next();
  });

  app.use(errorHandler());
  app.use(bodyParser());

  const authRouter = createAuthRouter(connection, keys);
  router.use(authRouter.routes(), authRouter.allowedMethods());

  router.use("/api", auth(keys));

  const tasksRouter = createTasksRouter(taskService);
  router.use(idempotency(repository), tasksRouter.routes(), tasksRouter.allowedMethods());

  app.use(router.routes());
  app.use(router.allowedMethods());

  app.context.connection = connection;
  return app;
}
