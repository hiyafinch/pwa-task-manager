// Generated with Claude Code - CS 3660 Sprint 3
import { css } from "lit";

export const sharedStyles = css`
  :host {
    --bg: #0f0f11;
    --surface: #1c1c1e;
    --border: #2e2e32;
    --text: #1c1c1e;
    --text-on-dark: #f2f2f2;
    --muted: #9a9a9e;
    --accent: #4f8cff;
    --danger: #ff5c5c;
    --success: #3ecf8e;
    --warn: #f5b942;
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    color: var(--text);
  }

  button {
    font-family: inherit;
    cursor: pointer;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-on-dark);
    padding: 0.5rem 0.9rem;
  }

  button:hover {
    border-color: var(--accent);
  }

  input[type="text"] {
    font-family: inherit;
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text-on-dark);
    border-radius: 8px;
    padding: 0.5rem 0.7rem;
  }
`;
