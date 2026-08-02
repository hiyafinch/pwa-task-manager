// Generated with Claude Code - CS 3660 Sprint 3
// PATTERN: Strategy (GoF) - conflict resolution policy is swappable
export const lastWriteWins = {
  name: "last-write-wins",
  resolve(incoming, existing) {
    if (!existing) return { winner: incoming, resolution: "created" };
    return incoming.updatedAt > existing.updatedAt
      ? { winner: incoming, resolution: "client_won" }
      : { winner: existing, resolution: "server_won" };
  },
};
