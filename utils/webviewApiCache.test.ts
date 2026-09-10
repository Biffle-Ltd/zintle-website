import assert from "node:assert/strict";
import { before, describe, it } from "node:test";

class MemoryStorage {
  private map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  clear() {
    this.map.clear();
  }
  key(index: number) {
    return [...this.map.keys()][index] ?? null;
  }
  getItem(key: string) {
    return this.map.has(key) ? this.map.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.map.set(key, value);
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
}

const memory = new MemoryStorage();
Object.defineProperty(globalThis, "localStorage", {
  value: memory,
  configurable: true,
});

const cache = await import("./webviewApiCache.ts");

describe("tokenFingerprint", () => {
  it("uses anon when token is missing", () => {
    assert.equal(cache.tokenFingerprint(null), "anon");
    assert.equal(cache.tokenFingerprint(undefined), "anon");
    assert.equal(cache.tokenFingerprint(""), "anon");
  });

  it("keeps short tokens and suffixes long JWTs", () => {
    assert.equal(cache.tokenFingerprint("short-token"), "short-token");
    assert.equal(
      cache.tokenFingerprint("aaaaaaaaaaaaaaaabbbbbbbbbbbbbbbb"),
      "bbbbbbbbbbbbbbbb",
    );
  });

  it("distinguishes two authenticated users", () => {
    assert.notEqual(
      cache.tokenFingerprint("header.payload.userA-signature"),
      cache.tokenFingerprint("header.payload.userB-signature"),
    );
  });
});

describe("znw.v1 cache hygiene", () => {
  before(() => {
    memory.clear();
  });

  it("prunes expired znw keys on write and leaves unrelated keys", () => {
    memory.setItem(
      "znw.v1.packs.ZINTEL1234.dead",
      JSON.stringify({ t: Date.now() - 11 * 60 * 1000, v: [] }),
    );
    memory.setItem("keep.me", "x");
    cache.writeApiCache("znw.v1.packs.ZINTEL1234.live", ["ok"]);
    assert.equal(memory.getItem("znw.v1.packs.ZINTEL1234.dead"), null);
    assert.equal(memory.getItem("keep.me"), "x");
    assert.deepEqual(
      cache.readApiCache("znw.v1.packs.ZINTEL1234.live", 10 * 60 * 1000),
      ["ok"],
    );
  });

  it("clearAllApiCache only drops znw.v1 keys", () => {
    cache.writeApiCache("znw.v1.userDetails.x", { is_member: false });
    memory.setItem("zintle_jwt", "token");
    cache.clearAllApiCache();
    assert.equal(memory.getItem("znw.v1.userDetails.x"), null);
    assert.equal(memory.getItem("znw.v1.packs.ZINTEL1234.live"), null);
    assert.equal(memory.getItem("zintle_jwt"), "token");
    assert.equal(memory.getItem("keep.me"), "x");
  });
});
