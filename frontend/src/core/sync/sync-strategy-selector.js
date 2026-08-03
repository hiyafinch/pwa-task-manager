// Generated with Claude Code - CS 3660 Sprint 3
import { config } from "../config.js";
import { BackgroundSyncStrategy } from "./background-sync-strategy.js";
import { PollingSyncStrategy } from "./polling-sync-strategy.js";

export const SyncStrategySelector = {
  async select(registrationPromise, logger = console) {
    const supported =
      !config.forcePollingSync &&
      typeof ServiceWorkerRegistration !== "undefined" &&
      "sync" in ServiceWorkerRegistration.prototype;

    const strategyName = supported ? "background-sync" : "polling";
    logger.log?.(JSON.stringify({ event: "sync.strategy.selected", strategy: strategyName }));

    if (supported) {
      const registration = await registrationPromise;
      return new BackgroundSyncStrategy(registration);
    }
    return new PollingSyncStrategy();
  },
};
