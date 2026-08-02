// Generated with Claude Code - CS 3660 Sprint 3
import { generateKeyPairSync } from "node:crypto";
import Database from "better-sqlite3";
import { createApp } from "../../src/app.js";

let cachedKeyStore = null;

function testKeyStore() {
  if (cachedKeyStore) return cachedKeyStore;
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  cachedKeyStore = { kid: "test-key", privateKey, publicKey };
  return cachedKeyStore;
}

export function buildTestApp() {
  const db = new Database(":memory:");
  const keyStore = testKeyStore();
  const app = createApp({ db, keyStore });
  return { app, db, keyStore };
}
