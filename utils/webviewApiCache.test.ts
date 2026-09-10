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

  it("returns a stable non-reversible fingerprint", () => {
    const token = "short-token";
    const fp1 = cache.tokenFingerprint(token);
    const fp2 = cache.tokenFingerprint(token);
    assert.equal(fp1, fp2);
    assert.equal(fp1.startsWith("h"), true);
    assert.equal(fp1.includes(token), false);
    const jwt = "aaaaaaaaaaaaaaaabbbbbbbbbbbbbbbb";
    assert.equal(
      cache.tokenFingerprint(jwt).includes("bbbbbbbbbbbbbbbb"),
      false,
    );
  });

  it("distinguishes two authenticated users", () => {
    assert.notEqual(
      cache.tokenFingerprint("header.payload.userA-signature"),
      cache.tokenFingerprint("header.payload.userB-signature"),
    );
  });
});

describe("znw cache hygiene", () => {
  before(() => {
    memory.clear();
  });

  it("prunes expired znw keys on write and leaves unrelated keys", () => {
    memory.setItem(
      "znw.v2.packs.ZINTEL1234.dead",
      JSON.stringify({ t: Date.now() - 11 * 60 * 1000, v: [] }),
    );
    memory.setItem("keep.me", "x");
    cache.writeApiCache("znw.v2.packs.ZINTEL1234.live", ["ok"]);
    assert.equal(memory.getItem("znw.v2.packs.ZINTEL1234.dead"), null);
    assert.equal(memory.getItem("keep.me"), "x");
    assert.deepEqual(
      cache.readApiCache("znw.v2.packs.ZINTEL1234.live", 10 * 60 * 1000),
      ["ok"],
    );
  });

  it("wipes leftover znw.v1 keys that could still hold JWT suffixes", () => {
    memory.setItem(
      "znw.v1.packs.BIFFLE1234.bbbbbbbbbbbbbbbb",
      JSON.stringify({ t: Date.now(), v: [] }),
    );
    cache.writeApiCache("znw.v2.packs.BIFFLE1234.live", ["ok"]);
    assert.equal(
      memory.getItem("znw.v1.packs.BIFFLE1234.bbbbbbbbbbbbbbbb"),
      null,
    );
    assert.equal(memory.getItem("keep.me"), "x");
  });

  it("clearAllApiCache only drops znw cache keys", () => {
    cache.writeApiCache("znw.v2.userDetails.x", { is_member: false });
    memory.setItem("zintle_jwt", "token");
    memory.setItem(
      "znw.v1.packs.orphan.suffix",
      JSON.stringify({ t: Date.now(), v: [] }),
    );
    cache.clearAllApiCache();
    assert.equal(memory.getItem("znw.v2.userDetails.x"), null);
    assert.equal(memory.getItem("znw.v2.packs.ZINTEL1234.live"), null);
    assert.equal(memory.getItem("znw.v1.packs.orphan.suffix"), null);
    assert.equal(memory.getItem("zintle_jwt"), "token");
    assert.equal(memory.getItem("keep.me"), "x");
  });

  it("drops corrupt cache entries on read", () => {
    memory.setItem("znw.v2.packs.ZINTEL1234.bad", "{not-json");
    assert.equal(
      cache.readApiCache("znw.v2.packs.ZINTEL1234.bad", 10 * 60 * 1000),
      null,
    );
    assert.equal(memory.getItem("znw.v2.packs.ZINTEL1234.bad"), null);
  });
});
