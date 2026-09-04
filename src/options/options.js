import { createI18n } from "../lib/i18n.js";

const api = globalThis.browser ?? globalThis.chrome;
const i18n = createI18n();
const { t } = i18n;
const $ = (id) => document.getElementById(id);

function send(msg) {
  return new Promise((resolve, reject) => {
    api.runtime.sendMessage(msg, (res) => {
      const err = api.runtime.lastError;
      if (err) return reject(new Error(err.message));
      if (!res?.ok) return reject(new Error(res?.error ?? "no response"));
      resolve(res.data);
    });
  });
}

function applyStaticI18n() {
  document.documentElement.lang = i18n.lang;
  for (const el of document.querySelectorAll("[data-i18n]")) el.textContent = t(el.dataset.i18n);
}

function flash(el, text) {
  el.textContent = text;
  setTimeout(() => {
    if (el.textContent === text) el.textContent = "";
  }, 2000);
}

async function loadSettings() {
  const s = await send({ type: "GET_SETTINGS" });
  $("opt-wikidata").checked = !!s.useWikidata;
  $("opt-banner").checked = !!s.showUsBanner;
}

async function saveSettings() {
  await send({
    type: "SET_SETTINGS",
    settings: {
      useWikidata: $("opt-wikidata").checked,
      // TODO: showUsBanner is stored but not yet acted upon (needs a content
      // script + "scripting"/host permissions). Kept here so the UI is ready.
      showUsBanner: $("opt-banner").checked,
    },
  });
  flash($("settings-status"), t("optSaved"));
}

async function loadDataMeta() {
  try {
    const meta = await send({ type: "GET_DATA_META" });
    $("data-count").textContent = t("optDataCount", { n: meta.count ?? 0 });
    $("data-version").textContent = t("optDataVersion", { v: meta.version ?? "—" });
  } catch (err) {
    $("data-count").textContent = err.message;
  }
}

async function loadOverrides() {
  const all = await send({ type: "LIST_OVERRIDES" });
  const domains = Object.keys(all).sort();
  const table = $("overrides-table");
  const empty = $("no-overrides");
  const body = $("overrides-body");
  body.innerHTML = "";
  if (domains.length === 0) {
    table.hidden = true;
    empty.hidden = false;
    return;
  }
  table.hidden = false;
  empty.hidden = true;
  for (const d of domains) {
    const e = all[d] ?? {};
    const tr = document.createElement("tr");
    const cells = [d, e.name ?? "", e.country ?? "", e.province ?? ""];
    for (const c of cells) {
      const td = document.createElement("td");
      td.textContent = c;
      tr.appendChild(td);
    }
    const td = document.createElement("td");
    const btn = document.createElement("button");
    btn.className = "danger";
    btn.textContent = t("remove");
    btn.addEventListener("click", async () => {
      await send({ type: "CLEAR_OVERRIDE", domain: d });
      await loadOverrides();
    });
    td.appendChild(btn);
    tr.appendChild(td);
    body.appendChild(tr);
  }
}

function wire() {
  $("opt-wikidata").addEventListener("change", saveSettings);
  $("opt-banner").addEventListener("change", saveSettings);
  $("clear-cache").addEventListener("click", async () => {
    const r = await send({ type: "CLEAR_CACHE" });
    flash($("cache-status"), t("optCacheCleared", { n: r.cleared ?? 0 }));
  });
}

applyStaticI18n();
wire();
loadSettings();
loadDataMeta();
loadOverrides();
