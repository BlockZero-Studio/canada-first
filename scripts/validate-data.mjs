#!/usr/bin/env node
// Validates data/companies.json for MapleCheck.
// Usage: node scripts/validate-data.mjs [path/to/companies.json]
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const file = process.argv[2] ?? resolve(here, "../data/companies.json");

const PROVINCES = new Set(["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"]);
const TYPES = new Set(["public","private","crown","coop","nonprofit","government"]);
const ISO2 = /^[A-Z]{2}$/;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DOMAIN = /^(?!www\.)[a-z0-9-]+(\.[a-z0-9-]+)+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const errors = [];
const err = (m) => errors.push(m);

let data;
try {
  data = JSON.parse(readFileSync(file, "utf8"));
} catch (e) {
  console.error(`JSON parse failed: ${e.message}`);
  process.exit(1);
}
if (!Array.isArray(data)) { console.error("Top-level value must be an array"); process.exit(1); }

const ids = new Map();
const domains = new Map();

data.forEach((c, i) => {
  const tag = `[${i}] ${c?.id ?? "(no id)"}`;
  if (!c || typeof c !== "object") { err(`${tag}: not an object`); return; }
  for (const k of ["id","name","domains","country","province","city","ultimate_parent","type","sources","updated"]) {
    if (!(k in c)) err(`${tag}: missing field "${k}"`);
  }
  if (typeof c.id !== "string" || !SLUG.test(c.id)) err(`${tag}: id must be a kebab slug`);
  if (ids.has(c.id)) err(`${tag}: duplicate id (also at [${ids.get(c.id)}])`); else ids.set(c.id, i);
  if (typeof c.name !== "string" || !c.name.trim()) err(`${tag}: name required`);
  if (!Array.isArray(c.domains) || c.domains.length === 0) err(`${tag}: domains must be a non-empty array`);
  else for (const d of c.domains) {
    if (typeof d !== "string" || !DOMAIN.test(d) || d !== d.toLowerCase()) err(`${tag}: bad domain "${d}"`);
    if (domains.has(d)) err(`${tag}: domain "${d}" also in "${domains.get(d)}"`); else domains.set(d, c.id);
  }
  if (!ISO2.test(c.country ?? "")) err(`${tag}: country must be ISO 3166-1 alpha-2`);
  if (c.country === "CA") {
    if (!PROVINCES.has(c.province)) err(`${tag}: CA entry needs a valid province (got ${JSON.stringify(c.province)})`);
  } else if (c.province !== null) err(`${tag}: province must be null when country != CA`);
  if (typeof c.city !== "string" || !c.city.trim()) err(`${tag}: city required`);
  const p = c.ultimate_parent;
  if (!p || typeof p !== "object") err(`${tag}: ultimate_parent required`);
  else {
    if (typeof p.name !== "string" || !p.name.trim()) err(`${tag}: ultimate_parent.name required`);
    if (!ISO2.test(p.country ?? "")) err(`${tag}: ultimate_parent.country must be ISO2`);
    if (p.country === "CA") { if (!PROVINCES.has(p.province)) err(`${tag}: ultimate_parent.province invalid for CA parent`); }
    else if (p.province !== null) err(`${tag}: ultimate_parent.province must be null when parent country != CA`);
  }
  if (!TYPES.has(c.type)) err(`${tag}: type "${c.type}" not in ${[...TYPES].join("|")}`);
  if (!Array.isArray(c.sources) || c.sources.length === 0 || !c.sources.every(s => /^https?:\/\//.test(s))) err(`${tag}: sources must be non-empty array of URLs`);
  if (c.notes !== undefined && typeof c.notes !== "string") err(`${tag}: notes must be a string`);
  if (!DATE.test(c.updated ?? "")) err(`${tag}: updated must be YYYY-MM-DD`);
});

// Sorted by name (case/accent-insensitive)
const collator = new Intl.Collator("en", { sensitivity: "base" });
for (let i = 1; i < data.length; i++) {
  if (collator.compare(data[i - 1].name, data[i].name) > 0) { err(`entries not sorted by name at [${i}] "${data[i].name}" (after "${data[i - 1].name}")`); break; }
}

// Summary
const byCountry = {};
const byProvince = {};
for (const c of data) {
  byCountry[c.country] = (byCountry[c.country] ?? 0) + 1;
  if (c.country === "CA") byProvince[c.province] = (byProvince[c.province] ?? 0) + 1;
}
const caForeignParent = data.filter(c => c.country === "CA" && c.ultimate_parent?.country !== "CA").length;
console.log(`entries: ${data.length}, domains: ${domains.size}`);
console.log("by country:", Object.fromEntries(Object.entries(byCountry).sort((a, b) => b[1] - a[1])));
console.log("CA by province:", Object.fromEntries(Object.entries(byProvince).sort((a, b) => b[1] - a[1])));
console.log(`CA-headquartered entries with a non-CA ultimate parent: ${caForeignParent}`);

if (errors.length) {
  console.error(`\n${errors.length} problem(s):`);
  for (const e of errors) console.error(" - " + e);
  process.exit(1);
}
console.log("OK");
