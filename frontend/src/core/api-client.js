// Generated with Claude Code - CS 3660 Sprint 3
// PATTERN: Adapter (GoF) - wraps fetch with auth header, base URL, and JSON handling
import { config } from "./config.js";

export class ApiClient {
  constructor({ apiBase = config.apiBase, getToken = () => null } = {}) {
    this.apiBase = apiBase;
    this.getToken = getToken;
  }

  async request(path, { method = "GET", body, headers = {} } = {}) {
    const token = this.getToken();
    const res = await fetch(this.apiBase + path, {
      method,
      headers: {
        "content-type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const error = new Error(json?.error?.message ?? `Request failed with ${res.status}`);
      error.status = res.status;
      error.body = json;
      throw error;
    }
    return json;
  }

  login(email, password) {
    return this.request("/auth/login", { method: "POST", body: { email, password } });
  }

  listTasks(since) {
    const q = since ? `?since=${encodeURIComponent(since)}` : "";
    return this.request(`/api/tasks${q}`);
  }

  createTask(task, mutationId) {
    return this.request("/api/tasks", { method: "POST", body: task, headers: { "Idempotency-Key": mutationId } });
  }

  updateTask(id, patch, mutationId) {
    return this.request(`/api/tasks/${id}`, { method: "PUT", body: patch, headers: { "Idempotency-Key": mutationId } });
  }

  deleteTask(id, updatedAt, mutationId) {
    return this.request(`/api/tasks/${id}`, { method: "DELETE", body: { updatedAt }, headers: { "Idempotency-Key": mutationId } });
  }

  // Applies a queued mutation (Command object) generically. Used by the replayer.
  applyMutation(mutation) {
    if (mutation.type === "create") return this.createTask(mutation.payload, mutation.mutationId);
    if (mutation.type === "update") return this.updateTask(mutation.taskId, mutation.payload, mutation.mutationId);
    if (mutation.type === "delete") return this.deleteTask(mutation.taskId, mutation.payload.updatedAt, mutation.mutationId);
    throw new Error(`Unknown mutation type: ${mutation.type}`);
  }
}
