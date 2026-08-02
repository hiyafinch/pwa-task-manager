// Generated with Claude Code - CS 3660 Sprint 3
import { LitElement, html, css } from "lit";

export class TaskApp extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: system-ui, sans-serif;
      padding: 2rem;
    }
  `;

  render() {
    return html`<h1>PWA Task Manager</h1>
      <p>Placeholder shell. Phase 3 wires this up to real components.</p>`;
  }
}

customElements.define("task-app", TaskApp);
