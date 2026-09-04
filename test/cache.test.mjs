import { test } from "node:test";
import assert from "node:assert/strict";
import { createStore, createMemoryArea, CACHE_TTL_MS, DEFAULT_SETTINGS } from "../src/lib/cache.js";

function makeStore(extra = {}) {
  let t = 1_000_000;
  const local = createMemoryArea();
  const sync = createMemoryArea();
  const store = createStore({ local, sync, now: () => t, ...extra });
  return { store, local, sync, tick: (ms) => (t += ms) };
}

test("cache: set/get round trip, keyed by lowercase domain", async () => {
  const { store, local } = makeStore();
  await store.setCached("Shopify.com", { entry: { id: "shopify" } });
  assert.deepEqual(await store.getCached("shopify.com"), { entry: { id: "shopify" } });
  assert.ok("cache:shopify.com" in local._dump());
  assert.equal(await store.getCached("missing.com"), null);
});

test("cache: entries expire after the TTL and are removed", async () => {
  const { store, local, tick } = makeStore();
  await store.setCached("a.com", { entry: null });
  tick(CACHE_TTL_MS - 1);
  assert.deepEqual(await store.getCached("a.com"), { entry: null });
  tick(2);
  assert.equal(await store.getCached("a.com"), null);
  assert.ok(!("cache:a.com" in local._dump()));
});

test("cache: clearCache removes only cache keys and reports count", async () => {
  const { store, local } = makeStore();
  await store.setCached("a.com", { entry: null });
  await store.setCached("b.com", { entry: null });
  await local.set({ unrelated: 1 });
  assert.equal(await store.cacheSize(), 2);
  assert.equal(await store.clearCache(), 2);
  assert.equal(await store.cacheSize(), 0);
  assert.deepEqual(local._dump(), { unrelated: 1 });
});

test("overrides: live in sync storage under 'overrides' and can be listed/removed", async () => {
  const { store, sync } = makeStore();
  assert.deepEqual(await store.getOverrides(), {});
  await store.setOverride("Rona.ca", { country: "CA", province: "QC" });
  assert.deepEqual(sync._dump().overrides, { "rona.ca": { country: "CA", province: "QC" } });
  assert.deepEqual(await store.getOverride("rona.ca"), { country: "CA", province: "QC" });
  await store.setOverride("x.com", { country: "US" });
  assert.deepEqual(Object.keys(await store.getOverrides()).sort(), ["rona.ca", "x.com"]);
  await store.removeOverride("rona.ca");
  assert.equal(await store.getOverride("rona.ca"), null);
  await store.clearOverrides();
  assert.deepEqual(await store.getOverrides(), {});
});

test("settings: defaults merge with stored patch", async () => {
  const { store } = makeStore();
  assert.deepEqual(await store.getSettings(), DEFAULT_SETTINGS);
  assert.equal((await store.getSettings()).useWikidata, true);
  const next = await store.setSettings({ useWikidata: false });
  assert.equal(next.useWikidata, false);
  assert.equal(next.showUsBanner, false);
  assert.equal((await store.getSettings()).useWikidata, false);
});

test("createStore throws without a local area", () => {
  assert.throws(() => createStore({ local: undefined }));
});

test("memory area mimics chrome.storage get() forms", async () => {
  const a = createMemoryArea({ k1: 1, k2: 2 });
  assert.deepEqual(await a.get("k1"), { k1: 1 });
  assert.deepEqual(await a.get(["k1", "nope"]), { k1: 1 });
  assert.deepEqual(await a.get({ k2: 0, k3: "d" }), { k2: 2, k3: "d" });
  assert.deepEqual(await a.get(null), { k1: 1, k2: 2 });
});
