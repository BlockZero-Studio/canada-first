// CanadaFirst background service worker (MV3, ES module).
//
// Resolution order for a tab's registrable domain:
//   user override (storage.sync) -> local index (data/companies.json)
//   -> cache (storage.local, 30d) -> Wikidata (if enabled) -> UNKNOWN

import { getRegistrableDomainFromUrl } from "./lib/domain.js";
import { buildIndex, lookupDomain, classify } from "./lib/lookup.js";
import { lookupWikidataDetailed } from "./lib/wikidata.js";
import { createStore } from "./lib/cache.js";

const api = globalThis.browser ?? globalThis.chrome;

const store = createStore();

// ---- local data ------------------------------------------------------------

let indexPromise = null;
let dataMeta = { count: 0, version: null };

/** Load data/companies.json once per service-worker lifetime. */
function getIndex() {
  if (!indexPromise) {
    indexPromise = (async () => {
      try {
        const url = api.runtime.getURL("data/companies.json");
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const companies = Array.isArray(json) ? json : json.companies ?? [];
        dataMeta = {
          count: companies.length,
          version: Array.isArray(json)
            ? companies.reduce((max, c) => (c.updated > max ? c.updated : max), "") || null
            : json.version ?? null,
        };
        return buildIndex(companies);
      } catch (err) {
        console.warn("[CanadaFirst] could not load data/companies.json:", err);
        indexPromise = null; // allow a retry on the next call
        return new Map();
      }
    })();
  }
  return indexPromise;
}

// ---- per-tab state ---------------------------------------------------------

/** @type {Map<number, object>} tabId -> last result */
const tabResults = new Map();
/** @type {Map<number, Promise<object>>} in-flight resolutions */
const inflight = new Map();

function unknownResult(domain, url, reason) {
  return { domain, url, entry: null, verdict: classify(null), source: "none", reason };
}

/**
 * Resolve a domain to an entry using the priority chain.
 * @returns {Promise<{entry:object|null, source:string}>}
 */
async function resolveDomain(domain) {
  const override = await store.getOverride(domain);
  if (override) return { entry: override, source: "override" };

  const index = await getIndex();
  const local = lookupDomain(index, domain);
  if (local) return { entry: local, source: "local" };

  // Cache records are wrapped as { entry } so a negative result (null) can be
  // cached too and we do not hammer Wikidata on every tab switch.
  const cached = await store.getCached(domain);
  if (cached && typeof cached === "object" && "entry" in cached) {
    return cached.entry
      ? { entry: cached.entry, source: "cache" }
      : { entry: null, source: "cache-negative" };
  }

  const settings = await store.getSettings();
  if (settings.useWikidata) {
    const { status, entry: wd } = await lookupWikidataDetailed(domain);
    // Cache hits and genuine misses; never cache a transient failure
    // (timeout, 429/5xx), otherwise one bad request sticks for 30 days.
    if (status !== "error") await store.setCached(domain, { entry: wd });
    if (wd) return { entry: wd, source: "wikidata" };
  }
  return { entry: null, source: "none" };
}

async function setBadge(tabId, verdict, title) {
  try {
    await api.action.setBadgeText({ tabId, text: verdict.badgeText });
    await api.action.setBadgeBackgroundColor({ tabId, color: verdict.badgeColor });
    if (api.action.setBadgeTextColor) {
      await api.action.setBadgeTextColor({ tabId, color: verdict.verdict === "UNKNOWN" ? "#111827" : "#FFFFFF" });
    }
    await api.action.setTitle({ tabId, title });
  } catch (err) {
    // Tab may have closed in the meantime.
    console.debug("[CanadaFirst] badge update failed", err?.message);
  }
}

async function clearBadge(tabId) {
  try {
    await api.action.setBadgeText({ tabId, text: "" });
    await api.action.setTitle({ tabId, title: "CanadaFirst" });
  } catch {
    /* ignore */
  }
}

/** Compute and apply the verdict for a tab. */
async function processTab(tabId, url) {
  if (typeof tabId !== "number") return null;
  const domain = getRegistrableDomainFromUrl(url);
  if (!domain) {
    tabResults.set(tabId, unknownResult(null, url, "not-http"));
    await clearBadge(tabId);
    return tabResults.get(tabId);
  }

  if (inflight.has(tabId)) return inflight.get(tabId);
  const p = (async () => {
    let result;
    try {
      const { entry, source } = await resolveDomain(domain);
      const verdict = classify(entry);
      result = { domain, url, entry, verdict, source };
    } catch (err) {
      console.warn("[CanadaFirst] resolve failed", err);
      result = unknownResult(domain, url, "error");
    }
    tabResults.set(tabId, result);
    const titleParts = ["CanadaFirst", result.verdict.label];
    if (result.entry?.name) titleParts.push(result.entry.name);
    await setBadge(tabId, result.verdict, titleParts.join(" — "));
    return result;
  })();
  inflight.set(tabId, p);
  try {
    return await p;
  } finally {
    inflight.delete(tabId);
  }
}

async function processActiveTab() {
  try {
    const [tab] = await api.tabs.query({ active: true, lastFocusedWindow: true });
    if (tab?.id !== undefined && tab.url) await processTab(tab.id, tab.url);
  } catch (err) {
    console.debug("[CanadaFirst] processActiveTab", err?.message);
  }
}

// ---- events ----------------------------------------------------------------

api.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await api.tabs.get(tabId);
    if (tab?.url) await processTab(tabId, tab.url);
  } catch {
    /* tab gone */
  }
});

api.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" || changeInfo.url) {
    if (tab?.url) processTab(tabId, tab.url);
  }
});

api.tabs.onRemoved.addListener((tabId) => {
  tabResults.delete(tabId);
});

api.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === api.windows.WINDOW_ID_NONE) return;
  processActiveTab();
});

api.runtime.onInstalled.addListener(() => {
  getIndex();
  processActiveTab();
});

api.runtime.onStartup?.addListener(() => {
  getIndex();
});

// ---- messages --------------------------------------------------------------

async function handleMessage(msg, sender) {
  switch (msg?.type) {
    case "GET_VERDICT": {
      let tabId = msg.tabId;
      let url = msg.url;
      if (typeof tabId !== "number") {
        const [tab] = await api.tabs.query({ active: true, lastFocusedWindow: true });
        tabId = tab?.id;
        url = tab?.url;
      } else if (!url) {
        try {
          url = (await api.tabs.get(tabId))?.url;
        } catch {
          /* ignore */
        }
      }
      if (typeof tabId !== "number") return unknownResult(null, null, "no-tab");
      // Service worker may have restarted: recompute if we have nothing.
      const cached = tabResults.get(tabId);
      if (cached && cached.url === url) return cached;
      return (await processTab(tabId, url)) ?? unknownResult(null, url, "no-url");
    }
    case "SET_OVERRIDE": {
      if (!msg.domain || !msg.entry) throw new Error("domain and entry required");
      await store.setOverride(msg.domain, msg.entry);
      await refreshTabsForDomain(msg.domain);
      return { ok: true };
    }
    case "CLEAR_OVERRIDE": {
      if (!msg.domain) throw new Error("domain required");
      await store.removeOverride(msg.domain);
      await refreshTabsForDomain(msg.domain);
      return { ok: true };
    }
    case "LIST_OVERRIDES":
      return store.getOverrides();
    case "GET_SETTINGS":
      return store.getSettings();
    case "SET_SETTINGS":
      return store.setSettings(msg.settings ?? {});
    case "CLEAR_CACHE": {
      const n = await store.clearCache();
      tabResults.clear();
      await processActiveTab();
      return { ok: true, cleared: n };
    }
    case "GET_DATA_META": {
      await getIndex();
      return { ...dataMeta, cacheSize: await store.cacheSize() };
    }
    default:
      throw new Error(`Unknown message type: ${msg?.type}`);
  }
}

async function refreshTabsForDomain(domain) {
  for (const [tabId, r] of tabResults) {
    if (r.domain === domain) {
      tabResults.delete(tabId);
      await processTab(tabId, r.url);
    }
  }
}

api.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  handleMessage(msg, sender)
    .then((data) => sendResponse({ ok: true, data }))
    .catch((err) => sendResponse({ ok: false, error: err?.message ?? String(err) }));
  return true; // keep the channel open for the async response
});

// Warm the index right away.
getIndex();
