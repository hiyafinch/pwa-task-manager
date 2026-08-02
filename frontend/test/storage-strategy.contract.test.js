// Generated with Claude Code - CS 3660 Sprint 3
import "fake-indexeddb/auto";
import { test } from "node:test";
import assert from "node:assert/strict";
import { openDB } from "idb";
import { MemoryStorage } from "../src/core/storage/memory-storage.js";
import { IdbStorage } from "../src/core/storage/idb-storage.js";

async function freshIdbStorage(name) {
  const dbPromise = openDB(name, 1, {
    upgrade(db) {
      db.createObjectStore("tasks", { keyPath: "id" });
    },
  });
  return new IdbStorage(dbPromise, "tasks");
}

const strategies = [
  ["MemoryStorage", async () => new MemoryStorage()],
  ["IdbStorage", async () => freshIdbStorage(`contract-test-${Math.random()}`)],
];

for (const [name, build] of strategies) {
  test(`${name}: put then get returns the same record`, async () => {
    const storage = await build();
    const record = { id: "1", title: "a" };
    await storage.put(record);
    const found = await storage.get("1");
    assert.deepEqual(found, record);
  });

  test(`${name}: list returns all put records`, async () => {
    const storage = await build();
    await storage.put({ id: "1", title: "a" });
    await storage.put({ id: "2", title: "b" });
    const all = await storage.list();
    assert.equal(all.length, 2);
  });

  test(`${name}: delete removes a record`, async () => {
    const storage = await build();
    await storage.put({ id: "1", title: "a" });
    await storage.delete("1");
    const found = await storage.get("1");
    assert.equal(found, undefined);
  });

  test(`${name}: clear empties the store`, async () => {
    const storage = await build();
    await storage.put({ id: "1", title: "a" });
    await storage.clear();
    const all = await storage.list();
    assert.equal(all.length, 0);
  });

  test(`${name}: put overwrites an existing record with the same id`, async () => {
    const storage = await build();
    await storage.put({ id: "1", title: "a" });
    await storage.put({ id: "1", title: "b" });
    const found = await storage.get("1");
    assert.equal(found.title, "b");
    assert.equal((await storage.list()).length, 1);
  });
}
