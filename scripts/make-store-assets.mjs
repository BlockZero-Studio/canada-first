// Generate Chrome Web Store screenshots (1280x800) and a small promo tile
// (440x280) by rendering the real popup markup + CSS with real data through
// headless Chrome. No dependencies. Output: store/*.png
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { buildIndex, lookupDomain, classify } from "../src/lib/lookup.js";
import { STRINGS } from "../src/lib/i18n.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = path.join(ROOT, "store");
const TMP = path.join(ROOT, "store", ".tmp");
mkdirSync(TMP, { recursive: true });

const companies = JSON.parse(readFileSync(path.join(ROOT, "data/companies.json"), "utf8"));
const index = buildIndex(companies);
const css = readFileSync(path.join(ROOT, "src/popup/popup.css"), "utf8");
const icon = "data:image/png;base64," + readFileSync(path.join(ROOT, "icons/icon128.png")).toString("base64");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const t = (lang, k, vars = {}) => STRINGS[lang][k].replace(/\{(\w+)\}/g, (_, v) => vars[v] ?? "");
const region = (lang, code) => { try { return new Intl.DisplayNames([lang === "fr" ? "fr-CA" : "en-CA"], { type: "region" }).of(code) ?? code; } catch { return code; } };
const EMOJI = { CA: "🍁", US: "⚠️", OTHER: "🌐", UNKNOWN: "❓" };

function headline(lang, v) {
  const S = STRINGS[lang];
  if (v.verdict === "CA") return v.province ? `${S.verdict_CA} — ${S.provinces[v.province]}` : S.verdict_CA;
  if (v.verdict === "US") return v.foreignOwned ? t(lang, "verdict_CA_foreign", { country: "US" }) : S.verdict_US;
  if (v.verdict === "OTHER") return v.foreignOwned ? t(lang, "verdict_CA_foreign", { country: v.country }) : t(lang, "verdict_OTHER", { country: region(lang, v.country) });
  return S.verdict_UNKNOWN;
}

function popupHtml(domain, lang) {
  const S = STRINGS[lang];
  const e = lookupDomain(index, domain);
  const v = classify(e);
  const loc = [e?.city, e?.province ? S.provinces[e.province] : null, e?.country && e.country !== "CA" ? region(lang, e.country) : null].filter(Boolean).join(", ");
  const p = e?.ultimate_parent;
  const owner = p && p.name !== e.name ? `<div class="owner">${esc(t(lang, "ownedBy", { name: p.name, country: p.country ?? "?" }))}</div>` : "";
  const sources = (e?.sources ?? []).map((s) => `<a href="#">${esc(new URL(s).hostname.replace(/^www\./, ""))}</a>`).join("");
  return `<main class="card">
  <header class="verdict verdict-${v.verdict}"><span class="emoji">${EMOJI[v.verdict]}</span>
    <div class="verdict-text"><div class="verdict-label">${esc(headline(lang, v))}</div><div class="domain">${esc(domain)}</div></div></header>
  <section class="details">
    <div class="company">${esc(e?.name ?? domain)}</div><div class="muted">${esc(loc)}</div>${owner}
    ${e?.notes ? `<p class="notes">${esc(e.notes)}</p>` : ""}
    <div class="sources"><span class="muted">${S.source}: </span>${sources}</div>
  </section>
  <footer class="actions"><a class="btn link" href="#">${esc(S.suggestFix)}</a><button class="btn">${esc(S.setManually)}</button></footer>
  <nav class="bottom"><a href="#">${esc(S.options)}</a></nav></main>`;
}

const badgeOf = (domain) => classify(lookupDomain(index, domain));

function frame({ domain, lang, title, sub, chips }) {
  const b = badgeOf(domain);
  const badgeFg = b.verdict === "US" ? "#1f1300" : b.verdict === "UNKNOWN" ? "#111827" : "#fff";
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>
${css}
html,body{width:1280px;height:800px;overflow:hidden;background:#f6f1ea;color:#111827;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
body{display:grid;grid-template-columns:560px 1fr;align-items:center;padding:0 0 0 88px}
.copy .eyebrow{display:flex;align-items:center;gap:12px;font-weight:700;font-size:22px;color:#d52b1e;margin-bottom:22px}
.copy .eyebrow img{width:40px;height:40px;border-radius:9px}
.copy h1{font-size:50px;line-height:1.08;margin:0 0 18px;letter-spacing:-0.5px}
.copy p{font-size:21px;line-height:1.4;color:#4b5563;margin:0 0 30px;max-width:470px}
.chips{display:flex;gap:10px;flex-wrap:wrap}
.chip{display:inline-flex;align-items:center;gap:8px;font-size:15px;color:#374151}
.chip b{display:inline-block;min-width:36px;text-align:center;padding:4px 8px;border-radius:6px;color:#fff;font-size:14px}
.stage{position:relative;justify-self:center}
.toolbar{position:absolute;right:-40px;top:-96px;display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:10px 14px;box-shadow:0 8px 24px rgba(0,0,0,.08)}
.toolbar .url{width:300px;height:30px;border-radius:15px;background:#f3f4f6;display:flex;align-items:center;padding:0 14px;color:#6b7280;font-size:14px}
.toolbar .ext{position:relative;width:30px;height:30px}
.toolbar .ext img{width:30px;height:30px;border-radius:7px}
.toolbar .badge{position:absolute;right:-8px;bottom:-6px;padding:1px 4px;border-radius:4px;font-size:11px;font-weight:700;border:2px solid #fff;line-height:1.2}
.popup{width:320px;background:var(--bg);border-radius:12px;overflow:hidden;box-shadow:0 30px 60px rgba(0,0,0,.18),0 0 0 1px rgba(0,0,0,.06);transform:scale(1.6);transform-origin:top center}
.popup .card{padding-bottom:12px}
</style></head><body>
<div class="copy"><div class="eyebrow"><img src="${icon}">CanadaFirst</div><h1>${title}</h1><p>${sub}</p>
<div class="chips">${chips.map(([txt, bg, label]) => `<span class="chip"><b style="background:${bg};${bg === "#F59E0B" ? "color:#1f1300" : ""}">${txt}</b>${label}</span>`).join("")}</div></div>
<div class="stage"><div class="toolbar"><div class="url">${esc(domain)}</div><div class="ext"><img src="${icon}"><span class="badge" style="background:${b.badgeColor};color:${badgeFg}">${esc(b.badgeText)}</span></div></div>
<div class="popup">${popupHtml(domain, lang)}</div></div>
</body></html>`;
}

const EN_CHIPS = [["QC", "#D52B1E", "Canadian, by province"], ["US", "#F59E0B", "American-owned"], ["SE", "#6B7280", "Other country"]];
const FR_CHIPS = [["QC", "#D52B1E", "Canadienne, par province"], ["US", "#F59E0B", "Propriété américaine"], ["SE", "#6B7280", "Autre pays"]];

const shots = [
  { file: "screenshot-1-shopify.png", domain: "shopify.com", lang: "en", title: "Is this company Canadian?", sub: "A badge on your toolbar tells you at a glance, with the province of its head office.", chips: EN_CHIPS },
  { file: "screenshot-2-rona.png", domain: "rona.ca", lang: "en", title: "Canadian brand, foreign owner? It shows.", sub: "The verdict follows the ultimate owner. Rona is headquartered in Québec but owned by a US fund.", chips: EN_CHIPS },
  { file: "screenshot-3-amazon.png", domain: "amazon.ca", lang: "en", title: "A .ca address doesn't make it Canadian.", sub: "American companies get the amber warning, even on their Canadian storefronts.", chips: EN_CHIPS },
  { file: "screenshot-4-spotify.png", domain: "spotify.com", lang: "en", title: "Private by design.", sub: "Everything runs in your browser. No account, no tracking. Unknown sites are looked up on Wikidata, and you can turn that off.", chips: EN_CHIPS },
  { file: "screenshot-5-desjardins-fr.png", domain: "desjardins.com", lang: "fr", title: "Cette entreprise est-elle canadienne ?", sub: "Une pastille sur la barre d'outils vous le dit d'un coup d'œil, avec la province du siège social. Interface en français et en anglais.", chips: FR_CHIPS },
];

function tile() {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{width:440px;height:280px;margin:0;overflow:hidden;background:linear-gradient(135deg,#d52b1e 0%,#b3221a 100%);color:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
body{display:flex;align-items:center;gap:26px;padding:0 36px;box-sizing:border-box}
img{width:112px;height:112px;border-radius:24px;box-shadow:0 12px 30px rgba(0,0,0,.25)}
h1{font-size:40px;margin:0 0 8px;letter-spacing:-0.5px}p{margin:0;font-size:17px;line-height:1.35;opacity:.95}
</style></head><body><img src="${icon}"><div><h1>CanadaFirst</h1><p>Is the company behind this site Canadian? Find out at a glance.</p></div></body></html>`;
}

function shoot(html, file, w, h) {
  const src = path.join(TMP, file.replace(/\.png$/, ".html"));
  writeFileSync(src, html);
  execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1", `--window-size=${w},${h}`, `--screenshot=${path.join(OUT, file)}`, "file://" + src], { stdio: "ignore", timeout: 60000 });
  console.log("wrote", path.relative(ROOT, path.join(OUT, file)));
}

for (const s of shots) shoot(frame(s), s.file, 1280, 800);
shoot(tile(), "promo-small-440x280.png", 440, 280);
rmSync(TMP, { recursive: true, force: true });
