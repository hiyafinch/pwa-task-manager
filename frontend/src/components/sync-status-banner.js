// Generated with Claude Code - CS 3660 Sprint 3
// PATTERN: Observer (GoF) - subscribes to SyncStateStore, no coupling to the sync engine
import { LitElement, html, css } from "lit";
import { sharedStyles } from "../styles/shared.js";

const LABELS = {
  idle: "Up to date",
  offline: "Offline",
  pending: "Changes saved locally",
  syncing: "Syncing",
  synced: "Synced",
  error: "Sync paused",
};

export class SyncStatusBanner extends LitElement {
  static properties = {
    store: { type: Object },
    state: { state: true },
  };

  static styles = [
    sharedStyles,
    css`
      .banner {
        padding: 0.5rem 0.8rem;
        border-radius: 8px;
        background: var(--surface);
        color: var(--text-on-dark);
        border: 1px solid var(--border);
        font-size: 0.85rem;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--muted);
      }
      .dot.pending, .dot.syncing {
        background: var(--warn);
      }
      .dot.synced, .dot.idle {
        background: var(--success);
      }
      .dot.offline, .dot.error {
        background: var(--danger);
      }
    `,
  ];

  connectedCallback() {
    super.connectedCallback();
    this.state = this.store?.getState() ?? { status: "idle", pendingCount: 0 };
    this.unsubscribe = this.store?.subscribe((state) => {
      this.state = state;
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribe?.();
  }

  render() {
    const status = this.state?.status ?? "idle";
    const pending = this.state?.pendingCount ?? 0;
    const label = pending > 0 && status !== "syncing" ? `${LABELS[status]}, ${pending} change${pending === 1 ? "" : "s"} saved locally` : LABELS[status] ?? status;
    return html`
      <div class="banner">
        <span class="dot ${status}"></span>
        <span>${label}</span>
      </div>
    `;
  }
}

customElements.define("sync-status-banner", SyncStatusBanner);
