// Generated with Claude Code - CS 3660 Sprint 3
import Router from "@koa/router";

export function createTasksRouter(taskService) {
  const router = new Router({ prefix: "/api/tasks" });

  router.get("/", (ctx) => {
    const since = ctx.query.since ?? null;
    const tasks = taskService.listSince(ctx.state.user.id, since);
    ctx.body = { tasks, serverTime: new Date().toISOString() };
  });

  router.post("/", (ctx) => {
    const body = ctx.request.body ?? {};
    if (!body.id || !body.title) {
      ctx.throw(400, "id and title are required", { expose: true, code: "VALIDATION_FAILED" });
    }
    const now = new Date().toISOString();
    const task = {
      id: body.id,
      title: body.title,
      notes: body.notes ?? "",
      completed: !!body.completed,
      createdAt: body.createdAt ?? now,
      updatedAt: body.updatedAt ?? now,
      deletedAt: null,
    };
    const { task: saved, resolution } = taskService.create(ctx.state.user.id, task);
    ctx.status = 201;
    ctx.body = { task: saved, resolution, serverTime: new Date().toISOString() };
  });

  router.put("/:id", (ctx) => {
    const body = ctx.request.body ?? {};
    if (!body.updatedAt) {
      ctx.throw(400, "updatedAt is required", { expose: true, code: "VALIDATION_FAILED" });
    }
    const { task, resolution } = taskService.update(ctx.state.user.id, ctx.params.id, body);
    ctx.body = { task, resolution, serverTime: new Date().toISOString() };
  });

  router.delete("/:id", (ctx) => {
    const updatedAt = ctx.request.body?.updatedAt ?? new Date().toISOString();
    const { task, resolution } = taskService.delete(ctx.state.user.id, ctx.params.id, updatedAt);
    ctx.body = { task, resolution, serverTime: new Date().toISOString() };
  });

  return router;
}
