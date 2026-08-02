-- Generated with Claude Code - CS 3660 Sprint 3
CREATE TABLE IF NOT EXISTS applied_mutations (
  mutation_id   TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL,
  task_id       TEXT NOT NULL,
  response_json TEXT NOT NULL,
  applied_at    TEXT NOT NULL
);
