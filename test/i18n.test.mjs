import { test } from "node:test";
import assert from "node:assert/strict";
import { createI18n, detectLanguage, STRINGS } from "../src/lib/i18n.js";

test("detectLanguage picks fr for fr-CA and en otherwise", () => {
  assert.equal(detectLanguage("fr-CA"), "fr");
  assert.equal(detectLanguage("FR"), "fr");
  assert.equal(detectLanguage("en-CA"), "en");
  assert.equal(detectLanguage("de"), "en");
});

test("fr and en tables have the same keys", () => {
  const en = Object.keys(STRINGS.en).sort();
  const fr = Object.keys(STRINGS.fr).sort();
  assert.deepEqual(fr, en);
  assert.deepEqual(Object.keys(STRINGS.fr.provinces).sort(), Object.keys(STRINGS.en.provinces).sort());
});

test("t() interpolates and falls back to en, then key", () => {
  const fr = createI18n("fr");
  assert.equal(fr.t("ownedBy", { name: "Sycamore", country: "US" }), "Propriété de Sycamore (US)");
  assert.equal(fr.provinceName("QC"), "Québec");
  assert.equal(fr.provinceName("NL"), "Terre-Neuve-et-Labrador");
  assert.equal(fr.t("nonexistent_key"), "nonexistent_key");
  const en = createI18n("en");
  assert.equal(en.t("verdict_OTHER", { country: "Sweden" }), "Company from Sweden");
});
