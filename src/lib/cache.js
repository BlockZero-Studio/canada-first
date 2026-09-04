// Storage layer: per-domain lookup cache (storage.local, 30-day TTL),
// user overrides (storage.sync, key "overrides") and settings (storage.sync).
//
// `createStore()` accepts injected storage areas so it can be unit-tested with
// a plain in-memory mock; in the extension it defaults to chrome.storage.

export const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const CACHE_PREFIX = "cache:";
export const OVERRIDES_KEY = "overrides";
export const SETTINGS_KEY = "settings";

export const DEFAULT_SETTINGS = Object.freeze({
  useWikidata: true,
  showUsBanner: false,
});

function defaultAreas() {
  const api = globalThis.browser ?? globalThis.chrome;
  return { local: api?.storage?.local, sync: api?.storage?.sync };
}

/**
 * @param {{local?: object, sync?: object, now?: () => number, ttlMs?: number}} [opts]
 */
export function createStore(opts = {}) {
  const areas = defaultAreas();
  const local = opts.local ?? areas.local;
  const sync = opts.sync ?? areas.sync ?? local;
  const now = opts.now ?? (() => Date.now());
  const ttlMs = opts.ttlMs ?? CACHE_TTL_MS;

  if (!local) throw new Error("No storage.local area available");

  const key = (domain) => CACHE_PREFIX + String(domain).toLowerCase();

  return {
    // ---- cache -----------------------------------------------------------
    async getCached(domain) {
      const k = key(domain);
      const res = await local.get(k);
      const rec = res?.[k];
      if (!rec || typeof rec !== "object") return null;
      if (typeof rec.expires !== "number" || rec.expires <= now()) {
        await local.remove(k);
        return null;
      }
      return rec.entry ?? null;
    },

    async setCached(domain, entry) {
      const k = key(domain);
      await local.set({ [k]: { entry, expires: now() + ttlMs, stored: now() } });
    },

    /** Remove every cache:* key (leaves overrides/settings alone). */
    async clearCache() {
      const all = await local.get(null);
      const keys = Object.keys(all ?? {}).filter((k) => k.startsWith(CACHE_PREFIX));
      if (keys.length) await local.remove(keys);
      return keys.length;
    },

    async cacheSize() {
      const all = await local.get(null);
      return Object.keys(all ?? {}).filter((k) => k.startsWith(CACHE_PREFIX)).length;
    },

    // ---- overrides -------------------------------------------------------
    async getOverrides() {
      const res = await sync.get(OVERRIDES_KEY);
      const o = res?.[OVERRIDES_KEY];
      return o && typeof o === "object" ? o : {};
    },

    async getOverride(domain) {
      const all = await this.getOverrides();
      return all[String(domain).toLowerCase()] ?? null;
    },

    async setOverride(domain, entry) {
      const all = await this.getOverrides();
      all[String(domain).toLowerCase()] = entry;
      await sync.set({ [OVERRIDES_KEY]: all });
    },

    async removeOverride(domain) {
      const all = await this.getOverrides();
      delete all[String(domain).toLowerCase()];
      await sync.set({ [OVERRIDES_KEY]: all });
    },

    async clearOverrides() {
      await sync.set({ [OVERRIDES_KEY]: {} });
    },

    // ---- settings --------------------------------------------------------
    async getSettings() {
      const res = await sync.get(SETTINGS_KEY);
      return { ...DEFAULT_SETTINGS, ...(res?.[SETTINGS_KEY] ?? {}) };
    },

    async setSettings(patch) {
      const cur = await this.getSettings();
      const next = { ...cur, ...patch };
      await sync.set({ [SETTINGS_KEY]: next });
      return next;
    },
  };
}

/**
 * Minimal in-memory implementation of the chrome.storage area API surface we
 * use (get/set/remove). Exported so tests and dev tooling share it.
 */
export function createMemoryArea(initial = {}) {
  let data = { ...initial };
  return {
    async get(keys) {
      if (keys === null || keys === undefined) return { ...data };
      if (typeof keys === "string") return keys in data ? { [keys]: data[keys] } : {};
      if (Array.isArray(keys)) {
        const out = {};
        for (const k of keys) if (k in data) out[k] = data[k];
        return out;
      }
      const out = {};
      for (const [k, dflt] of Object.entries(keys)) out[k] = k in data ? data[k] : dflt;
      return out;
    },
    async set(obj) {
      data = { ...data, ...obj };
    },
    async remove(keys) {
      for (const k of Array.isArray(keys) ? keys : [keys]) delete data[k];
    },
    async clear() {
      data = {};
    },
    _dump() {
      return { ...data };
    },
  };
}
