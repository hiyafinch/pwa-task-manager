// Generated with Claude Code - CS 3660 Sprint 3
import { LitElement, html, css } from "lit";
import { sharedStyles } from "../styles/shared.js";

export class TaskItem extends LitElement {
  static properties = {
    task: { type: Object },
  };

  static styles = [
    sharedStyles,
    css`
      .row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.6rem 0.2rem;
        border-bottom: 1px solid var(--border);
      }
      .title {
        flex: 1;
      }
      .title.completed {
        text-decoration: line-through;
        color: var(--muted);
      }
      .status {
        font-size: 0.7rem;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
    `,
  ];

  toggle() {
    this.dispatchEvent(new CustomEvent("task-toggle", { detail: { id: this.task.id }, bubbles: true, composed: true }));
  }

  remove() {
    this.dispatchEvent(new CustomEvent("task-delete", { detail: { id: this.task.id }, bubbles: true, composed: true }));
  }

  render() {
    const t = this.task;
    return html`
      <div class="row">
        <input type="checkbox" .checked=${t.completed} @change=${this.toggle} />
        <span class="title ${t.completed ? "completed" : ""}">${t.title}</span>
        <span class="status">${t.syncStatus ?? ""}</span>
        <button @click=${this.remove}>Delete</button>
      </div>
    `;
  }
}

customElements.define("task-item", TaskItem);
