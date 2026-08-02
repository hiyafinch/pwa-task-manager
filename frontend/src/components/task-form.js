// Generated with Claude Code - CS 3660 Sprint 3
import { LitElement, html, css } from "lit";
import { sharedStyles } from "../styles/shared.js";

export class TaskForm extends LitElement {
  static styles = [
    sharedStyles,
    css`
      form {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }
      input[type="text"] {
        flex: 1;
      }
    `,
  ];

  submit(event) {
    event.preventDefault();
    const input = this.renderRoot.querySelector("input");
    const title = input.value.trim();
    if (!title) return;
    this.dispatchEvent(new CustomEvent("task-create", { detail: { title }, bubbles: true, composed: true }));
    input.value = "";
  }

  render() {
    return html`
      <form @submit=${this.submit}>
        <input type="text" placeholder="What needs doing?" />
        <button type="submit">Add</button>
      </form>
    `;
  }
}

customElements.define("task-form", TaskForm);
