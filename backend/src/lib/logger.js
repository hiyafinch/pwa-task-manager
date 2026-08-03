// Generated with Claude Code - CS 3660 Sprint 3
// Structured JSON logs to stdout. Render captures stdout directly, so no
// shipping layer is needed. Never log the task title, the token, or the password.
function line(level, payload) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), level, ...payload }));
}

export const logger = {
  info: (payload) => line("info", payload),
  warn: (payload) => line("warn", payload),
  error: (payload) => line("error", payload),
};
