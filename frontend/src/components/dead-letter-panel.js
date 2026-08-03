// Generated with Claude Code - CS 3660 Sprint 3
// Cut for the four day scope per plan Section 0.1.2: no requeue button in the
// default build. This still renders the list so the DLQ is demoable in
// DevTools and here; add a requeue button back first if time allows.
import { LitElement, html, css } from "lit";
import { sharedStyles } from "../styles/shared.js";

export class DeadLetterPanel extends LitElement {
  static properties = {
    channel: { type: Object },
    entries: { state: true },
  };

  static styles = [
    sharedStyles,
    css`
      .panel {
        margin-top: 1.5rem;
        border-top: 1px solid var(--border);
        padding-top: 1rem;
        font-size: 0.85rem;
      }
      .row {
        display: flex;
        justify-content: space-between;
        padding: 0.3rem 0;
        color: var(--danger);
      }
    `,
  ];

  constructor() {
    super();
    this.entries = [];
  }

  async connectedCallback() {
    super.connectedCallback();
    await this.refresh();
  }

  async refresh() {
    if (!this.channel) return;
    this.entries = await this.channel.list();
  }

  async requeue(mutationId) {
    await this.channel.requeue(mutationId);
    await this.refresh();
    this.dispatchEvent(new CustomEvent("requeued", { bubbles: true, composed: true }));
  }

  render() {
    if (!this.entries.length) return html``;
    return html`
      <div class="panel">
        <strong>Dead letter (${this.entries.length})</strong>
        ${this.entries.map(
          (e) => html`<div class="row"><span>${e.mutationId} - ${e.reason}</span><button @click=${() => this.requeue(e.mutationId)}>Requeue</button></div>`
        )}
      </div>
    `;
  }
}

customElements.define("dead-letter-panel", DeadLetterPanel);
