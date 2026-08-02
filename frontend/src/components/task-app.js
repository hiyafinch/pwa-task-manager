// Generated with Claude Code - CS 3660 Sprint 3
import { LitElement, html, css } from "lit";
import { sharedStyles } from "../styles/shared.js";
import { TaskFactory } from "../core/task-factory.js";
import "./task-form.js";
import "./task-list.js";
import "./sync-status-banner.js";

export class TaskApp extends LitElement {
  static properties = {
    repository: { type: Object },
    tasks: { state: true },
  };

  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
        max-width: 640px;
        margin: 0 auto;
        padding: 2rem 1rem;
      }
      h1 {
        font-size: 1.4rem;
        margin-bottom: 1rem;
      }
    `,
  ];

  constructor() {
    super();
    this.tasks = [];
  }

  async connectedCallback() {
    super.connectedCallback();
    if (this.repository) await this.refresh();
  }

  async refresh() {
    this.tasks = await this.repository.list();
  }

  async onCreate(event) {
    const task = TaskFactory.create({ title: event.detail.title });
    await this.repository.save(task);
    this.dispatchEvent(new CustomEvent("mutation", { detail: { type: "create", taskId: task.id, payload: task } }));
    await this.refresh();
  }

  async onToggle(event) {
    const existing = await this.repository.get(event.detail.id);
    if (!existing) return;
    const updated = TaskFactory.fromQueueReplay(existing, { completed: !existing.completed });
    await this.repository.save(updated);
    this.dispatchEvent(
      new CustomEvent("mutation", {
        detail: { type: "update", taskId: updated.id, payload: { title: updated.title, notes: updated.notes, completed: updated.completed, updatedAt: updated.updatedAt } },
      })
    );
    await this.refresh();
  }

  async onDelete(event) {
    const existing = await this.repository.get(event.detail.id);
    if (!existing) return;
    const updatedAt = new Date().toISOString();
    const tombstoned = { ...existing, deletedAt: updatedAt, updatedAt, syncStatus: "pending" };
    await this.repository.save(tombstoned);
    this.dispatchEvent(
      new CustomEvent("mutation", {
        detail: { type: "delete", taskId: existing.id, payload: { updatedAt } },
      })
    );
    await this.refresh();
  }

  render() {
    return html`
      <h1>PWA Task Manager</h1>
      <sync-status-banner .store=${this.syncStateStore}></sync-status-banner>
      <task-form @task-create=${this.onCreate}></task-form>
      <task-list
        .tasks=${this.tasks}
        @task-toggle=${this.onToggle}
        @task-delete=${this.onDelete}
      ></task-list>
    `;
  }
}

customElements.define("task-app", TaskApp);
