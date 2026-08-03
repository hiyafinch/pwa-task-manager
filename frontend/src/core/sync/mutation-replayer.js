// Generated with Claude Code - CS 3660 Sprint 3
// PATTERN: Guaranteed Delivery (EIP) - durable queue, budgeted retries, ordered
// replay, dedup on the receiver side via Idempotency-Key
import { config } from "../config.js";

const MAX_ATTEMPTS = config.maxAttempts;

function classify(error) {
  if (!error.status) return "retryable"; // network error, no response at all
  if (error.status === 401) return "auth";
  if ([429, 502, 503, 504].includes(error.status)) return "retryable";
  if ([400, 404, 422].includes(error.status)) return "permanent";
  return "retryable";
}

export class MutationReplayer {
  constructor({ queue, deadLetter, apiClient, syncState, repository, logger = console }) {
    this.queue = queue;
    this.deadLetter = deadLetter;
    this.apiClient = apiClient;
    this.syncState = syncState;
    this.repository = repository;
    this.logger = logger;
  }

  async replayAll() {
    const pending = await this.queue.listPending();
    if (!pending.length) {
      const online = typeof navigator === "undefined" || navigator.onLine;
      this.syncState?.setState({ status: online ? "idle" : "offline", pendingCount: 0 });
      return { synced: 0, deadLettered: 0 };
    }

    this.syncState?.setState({ status: "syncing", pendingCount: pending.length });
    let synced = 0;
    let deadLettered = 0;

    for (const mutation of pending) {
      await this.queue.markInflight(mutation.mutationId);
      try {
        const result = await this.apiClient.applyMutation(mutation);
        if (result.task && this.repository) {
          await this.repository.save({ ...result.task, syncStatus: "synced" });
        }
        await this.queue.remove(mutation.mutationId);
        synced += 1;
        this.log({ event: "sync.mutation.succeeded", mutationId: mutation.mutationId, resolution: result.resolution });
      } catch (err) {
        const kind = classify(err);
        if (kind === "auth") {
          this.syncState?.setState({ status: "error", pendingCount: pending.length - synced });
          this.log({ event: "sync.mutation.failed", mutationId: mutation.mutationId, kind });
          break;
        }
        if (kind === "retryable") {
          const record = await this.queue.markFailed(mutation.mutationId, err);
          this.log({ event: "sync.mutation.failed", mutationId: mutation.mutationId, kind, attempts: record?.attempts });
          if ((record?.attempts ?? 0) >= MAX_ATTEMPTS) {
            await this.deadLetter.send(record, "max_attempts_exceeded");
            deadLettered += 1;
            continue;
          }
          break; // preserve order: stop the run at the first retryable failure
        }
        // permanent
        await this.deadLetter.send(mutation, kind);
        deadLettered += 1;
        this.log({ event: "sync.mutation.failed", mutationId: mutation.mutationId, kind });
      }
    }

    const remaining = await this.queue.count();
    this.syncState?.setState({
      status: remaining > 0 ? "pending" : "synced",
      pendingCount: remaining,
      lastSyncAt: new Date().toISOString(),
    });
    this.log({ event: "sync.completed", synced, deadLettered, remaining });
    return { synced, deadLettered };
  }

  log(payload) {
    if (typeof this.logger.info === "function") {
      this.logger.info(payload);
    } else {
      console.log(JSON.stringify({ ts: new Date().toISOString(), ...payload }));
    }
  }
}
