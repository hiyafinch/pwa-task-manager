// Generated with Claude Code - CS 3660 Sprint 3
// PATTERN: Idempotent Receiver (EIP, bonus) - dedupes replayed writes by Idempotency-Key
export const idempotency = (repository) => async (ctx, next) => {
  if (!["POST", "PUT", "DELETE"].includes(ctx.method)) return next();

  const key = ctx.get("Idempotency-Key");
  if (!key) ctx.throw(400, "Idempotency-Key header is required", { expose: true, code: "VALIDATION_FAILED" });

  const prior = repository.findMutation(key, ctx.state.user.id);
  if (prior) {
    ctx.set("Idempotent-Replay", "true");
    ctx.body = JSON.parse(prior.response_json);
    ctx.status = ctx.method === "POST" ? 201 : 200;
    return;
  }

  await next();

  if (ctx.status < 400) {
    const taskId = ctx.body?.task?.id ?? ctx.params?.id ?? "unknown";
    repository.recordMutation(key, ctx.state.user.id, taskId, ctx.body);
  }
};
