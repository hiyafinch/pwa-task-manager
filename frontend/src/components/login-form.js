// Generated with Claude Code - CS 3660 Sprint 3
import { LitElement, html, css } from "lit";
import { sharedStyles } from "../styles/shared.js";
import { config } from "../core/config.js";

export class LoginForm extends LitElement {
  static properties = {
    error: { state: true },
    submitting: { state: true },
  };

  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
        max-width: 320px;
        margin: 4rem auto;
      }
      h2 {
        font-size: 1.2rem;
        color: var(--accent);
        margin-bottom: 1rem;
      }
      form {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      input {
        width: 100%;
        box-sizing: border-box;
      }
      .error {
        color: var(--danger);
        font-size: 0.85rem;
      }
    `,
  ];

  constructor() {
    super();
    this.error = null;
    this.submitting = false;
  }

  async submit(event) {
    event.preventDefault();
    const form = event.target;
    const email = form.email.value.trim();
    const password = form.password.value;
    this.error = null;
    this.submitting = true;

    try {
      const res = await fetch(`${config.apiBase}/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.error?.message ?? "Login failed");
      }
      localStorage.setItem("accessToken", json.accessToken);
      this.dispatchEvent(new CustomEvent("login-success", { bubbles: true, composed: true }));
    } catch (err) {
      this.error = err.message;
    } finally {
      this.submitting = false;
    }
  }

  render() {
    return html`
      <h2>Sign in</h2>
      <form @submit=${this.submit}>
        <input name="email" type="email" placeholder="Email" required value="demo@example.com" />
        <input name="password" type="password" placeholder="Password" required value="Sprint3Demo!" />
        ${this.error ? html`<span class="error">${this.error}</span>` : ""}
        <button type="submit" ?disabled=${this.submitting}>${this.submitting ? "Signing in..." : "Sign in"}</button>
      </form>
    `;
  }
}

customElements.define("login-form", LoginForm);
