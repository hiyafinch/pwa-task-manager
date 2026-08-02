// Generated with Claude Code - CS 3660 Sprint 3
import { LitElement, html, css } from "lit";
import { sharedStyles } from "../styles/shared.js";
import "./task-item.js";

export class TaskList extends LitElement {
  static properties = {
    tasks: { type: Array },
  };

  static styles = [
    sharedStyles,
    css`
      .empty {
        color: var(--muted);
        padding: 1rem 0.2rem;
      }
    `,
  ];

  constructor() {
    super();
    this.tasks = [];
  }

  render() {
    if (!this.tasks.length) {
      return html`<p class="empty">No tasks yet. Add one above.</p>`;
    }
    return html`
      ${this.tasks.map((task) => html`<task-item .task=${task}></task-item>`)}
    `;
  }
}

customElements.define("task-list", TaskList);
