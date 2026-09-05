import { createI18n } from "../lib/i18n.js";
import { entryFromOverride } from "../lib/lookup.js";

const api = globalThis.browser ?? globalThis.chrome;
const i18n = createI18n();
const { t } = i18n;

const ISSUE_REPO = "https://github.com/OWNER/canada-first/issues/new";

const EMOJI = { CA: "🍁", US: "⚠️", OTHER: "🌐", UNKNOWN: "❓" };

const $ = (id) => document.getElementById(id);

let current = null; // last GET_VERDICT result

function send(msg) {
  return new Promise((resolve, reject) => {
    api.runtime.sendMessage(msg, (res) => {
      const err = api.runtime.lastError;
      if (err) return reject(new Error(err.message));
      if (!res) return reject(new Error("no response"));
      if (!res.ok) return reject(new Error(res.error));
      resolve(res.data);
    });
  });
}

function applyStaticI18n() {
  document.documentElement.lang = i18n.lang;
  for (const el of document.querySelectorAll("[data-i18n]")) {
    el.textContent = t(el.dataset.i18n);
  }
  // country select labels
  const cs = $("ov-country");
  for (const opt of cs.options) opt.textContent = i18n.countryName(opt.value);
  const ps = $("ov-province");
  ps.innerHTML = "";
  for (const [code, name] of Object.entries(i18n.provinces)) {
    const o = document.createElement("option");
    o.value = code;
    o.textContent = name;
    ps.appendChild(o);
  }
}

function verdictHeadline(v) {
  switch (v.verdict) {
    case "CA":
      return v.province ? `${t("verdict_CA")} — ${i18n.provinceName(v.province)}` : t("verdict_CA");
    case "US":
      return v.foreignOwned ? t("verdict_CA_foreign", { country: "US" }) : t("verdict_US");
    case "OTHER":
      return v.foreignOwned
        ? t("verdict_CA_foreign", { country: v.country })
        : t("verdict_OTHER", { country: regionName(v.country) });
    default:
      return t("verdict_UNKNOWN");
  }
}

function regionName(code) {
  try {
    const dn = new Intl.DisplayNames([i18n.lang], { type: "region" });
    return dn.of(code) ?? code;
  } catch {
    return code;
  }
}

function issueUrl(result) {
  const title = `Fix: ${result.domain ?? "unknown domain"}`;
  const body = [
    `Domain: ${result.domain ?? ""}`,
    `URL: ${result.url ?? ""}`,
    `Current verdict: ${result.verdict?.verdict ?? ""} (${result.source})`,
    `Current entry: ${result.entry ? `${result.entry.name} [${result.entry.id}]` : "none"}`,
    "",
    "What is wrong / what should it be?",
    "",
    "Sources (links):",
    "",
  ].join("\n");
  const q = new URLSearchParams({ title, body, labels: "data" });
  return `${ISSUE_REPO}?${q.toString()}`;
}

function render(result) {
  current = result;
  const v = result.verdict;
  const header = $("verdict");
  header.className = `verdict verdict-${v.verdict}`;
  $("verdict-emoji").textContent = EMOJI[v.verdict] ?? "❓";
  $("verdict-label").textContent = result.reason === "not-http" ? t("notWebPage") : verdictHeadline(v);
  $("domain").textContent = result.domain ?? "";

  const details = $("details");
  const e = result.entry;
  if (e) {
    details.hidden = false;
    $("company-name").textContent = e.name ?? result.domain;
    const loc = [e.city, e.province ? i18n.provinceName(e.province) : null, e.country && e.country !== "CA" ? regionName(e.country) : null]
      .filter(Boolean)
      .join(", ");
    $("location").textContent = loc;

    const owner = $("owner");
    const p = e.ultimate_parent;
    if (p && p.name && p.name !== e.name) {
      owner.hidden = false;
      owner.textContent = t("ownedBy", { name: p.name, country: p.country ?? "?" });
    } else {
      owner.hidden = true;
    }

    const note = $("override-note");
    if (result.source === "override") {
      note.hidden = false;
      note.textContent = t("userOverride");
    } else if (result.source === "wikidata" || (result.source === "cache" && e.type === "wikidata")) {
      note.hidden = false;
      note.textContent = t("dataSourceWikidata");
    } else {
      note.hidden = true;
    }

    const notes = $("notes");
    if (e.notes && result.source !== "override") {
      notes.hidden = false;
      notes.textContent = e.notes;
    } else {
      notes.hidden = true;
    }

    const sources = $("sources");
    sources.innerHTML = "";
    if (Array.isArray(e.sources) && e.sources.length) {
      sources.hidden = false;
      const label = document.createElement("span");
      label.className = "muted";
      label.textContent = `${e.sources.length > 1 ? t("sources") : t("source")}: `;
      sources.appendChild(label);
      e.sources.forEach((s, i) => {
        const a = document.createElement("a");
        a.href = s;
        a.target = "_blank";
        a.rel = "noopener";
        try {
          a.textContent = new URL(s).hostname.replace(/^www\./, "");
        } catch {
          a.textContent = `#${i + 1}`;
        }
        sources.appendChild(a);
      });
    } else {
      sources.hidden = true;
    }
  } else {
    details.hidden = true;
  }

  const hint = $("unknown-hint");
  if (!e && result.domain) {
    hint.hidden = false;
    hint.textContent = t("unknownHint", { domain: result.domain });
  } else {
    hint.hidden = true;
  }

  $("suggest").href = issueUrl(result);
  // Hidden until ISSUE_REPO points at a real repository.
  $("suggest").hidden = !result.domain || ISSUE_REPO.includes("/OWNER/");
  $("set-manually").hidden = !result.domain;
  $("clear-override").hidden = result.source !== "override";
}

function showForm(show) {
  const form = $("override-form");
  form.hidden = !show;
  if (show) {
    const e = current?.entry;
    const country = e?.country && ["CA", "US"].includes(e.country) ? e.country : e?.country ? "OTHER" : "CA";
    $("ov-country").value = country;
    $("ov-other").value = country === "OTHER" ? e.country : "";
    $("ov-province").value = e?.province ?? "QC";
    $("ov-name").value = e?.name ?? "";
    syncFormVisibility();
    $("ov-country").focus();
  }
}

function syncFormVisibility() {
  const c = $("ov-country").value;
  $("ov-province-wrap").hidden = c !== "CA";
  $("ov-other-wrap").hidden = c !== "OTHER";
}

async function load() {
  try {
    const result = await send({ type: "GET_VERDICT" });
    render(result);
  } catch (err) {
    $("verdict-label").textContent = t("verdict_UNKNOWN");
    $("domain").textContent = err.message;
  }
}

function wire() {
  $("set-manually").addEventListener("click", () => showForm(true));
  $("ov-cancel").addEventListener("click", () => showForm(false));
  $("ov-country").addEventListener("change", syncFormVisibility);

  $("override-form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    if (!current?.domain) return;
    let country = $("ov-country").value;
    if (country === "OTHER") country = $("ov-other").value.trim().toUpperCase() || "XX";
    const entry = entryFromOverride({
      domain: current.domain,
      country,
      province: country === "CA" ? $("ov-province").value : null,
      name: $("ov-name").value.trim() || null,
    });
    await send({ type: "SET_OVERRIDE", domain: current.domain, entry });
    showForm(false);
    await load();
  });

  $("clear-override").addEventListener("click", async () => {
    if (!current?.domain) return;
    await send({ type: "CLEAR_OVERRIDE", domain: current.domain });
    await load();
  });

  $("open-options").addEventListener("click", (ev) => {
    ev.preventDefault();
    api.runtime.openOptionsPage();
  });
}

applyStaticI18n();
wire();
load();
