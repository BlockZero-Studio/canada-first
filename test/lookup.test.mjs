import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildIndex, lookupDomain, classify, entryFromOverride, BADGE_COLORS } from "../src/lib/lookup.js";

const companies = JSON.parse(
  readFileSync(new URL("./fixtures/companies.sample.json", import.meta.url), "utf8"),
);
const index = buildIndex(companies);
const get = (d) => lookupDomain(index, d);

test("buildIndex maps every domain, case-insensitively", () => {
  assert.equal(index.size, 12);
  assert.equal(get("shopify.com").id, "shopify");
  assert.equal(get("SHOPIFY.CA").id, "shopify");
  assert.equal(get("nope.example"), null);
  assert.equal(buildIndex(null).size, 0);
  assert.equal(buildIndex([{ name: "no domains" }, null]).size, 0);
});

test("CA verdict: Shopify -> ON badge on red", () => {
  const v = classify(get("shopify.com"));
  assert.equal(v.verdict, "CA");
  assert.equal(v.province, "ON");
  assert.equal(v.badgeText, "ON");
  assert.equal(v.badgeColor, BADGE_COLORS.CA);
  assert.equal(v.foreignOwned, false);
  assert.match(v.label, /Ontario/);
});

test("CA verdict: Desjardins -> QC", () => {
  const v = classify(get("desjardins.com"));
  assert.equal(v.verdict, "CA");
  assert.equal(v.badgeText, "QC");
});

test("CA verdict with Canadian parent: Tim Hortons -> CA/ON, not foreign-owned", () => {
  const v = classify(get("timhortons.ca"));
  assert.equal(v.verdict, "CA");
  assert.equal(v.province, "ON");
  assert.equal(v.foreignOwned, false);
  assert.equal(v.ownerName, "Restaurant Brands International");
});

test("US verdict: .ca domain of a US company (walmart.ca) is still US", () => {
  const v = classify(get("walmart.ca"));
  assert.equal(v.verdict, "US");
  assert.equal(v.badgeText, "US");
  assert.equal(v.badgeColor, BADGE_COLORS.US);
  assert.equal(v.province, null);
  assert.equal(v.foreignOwned, false);
  assert.equal(v.label, "American company");
});

test("US verdict: amazon.ca and amazon.com resolve to the same US entry", () => {
  assert.equal(get("amazon.ca"), get("amazon.com"));
  assert.equal(classify(get("amazon.ca")).verdict, "US");
});

test("US verdict via parent: GitHub (parent Microsoft US)", () => {
  const v = classify(get("github.com"));
  assert.equal(v.verdict, "US");
  assert.equal(v.ownerName, "Microsoft");
  assert.equal(v.foreignOwned, false);
});

test("OTHER verdict: Spotify -> SE on grey", () => {
  const v = classify(get("spotify.com"));
  assert.equal(v.verdict, "OTHER");
  assert.equal(v.country, "SE");
  assert.equal(v.badgeText, "SE");
  assert.equal(v.badgeColor, BADGE_COLORS.OTHER);
});

test("foreign-owned Canadian: Rona (CA/QC, parent Sycamore US) -> US verdict + flag", () => {
  const v = classify(get("rona.ca"));
  assert.equal(v.verdict, "US");
  assert.equal(v.foreignOwned, true);
  assert.equal(v.ownerCountry, "US");
  assert.equal(v.ownerName, "Sycamore Partners");
  assert.equal(v.label, "Canadian brand, US-owned");
  assert.equal(v.badgeText, "US");
});

test("foreign-owned Canadian with non-US parent gets OTHER + flag", () => {
  const v = classify({
    name: "X",
    country: "CA",
    province: "BC",
    ultimate_parent: { name: "Y", country: "GB", province: null },
  });
  assert.equal(v.verdict, "OTHER");
  assert.equal(v.foreignOwned, true);
  assert.equal(v.badgeText, "GB");
  assert.equal(v.label, "Canadian brand, GB-owned");
});

test("UNKNOWN verdict for null / no country", () => {
  for (const e of [null, undefined, {}, { country: "" }, { country: null }]) {
    const v = classify(e);
    assert.equal(v.verdict, "UNKNOWN");
    assert.equal(v.badgeText, "?");
    assert.equal(v.badgeColor, BADGE_COLORS.UNKNOWN);
  }
});

test("CA without province falls back to CA badge text", () => {
  const v = classify({ country: "CA", province: null });
  assert.equal(v.verdict, "CA");
  assert.equal(v.badgeText, "CA");
  assert.equal(v.label, "Canadian");
});

test("country codes are normalised to uppercase", () => {
  assert.equal(classify({ country: "ca", province: "qc" }).badgeText, "QC");
  assert.equal(classify({ country: "us" }).verdict, "US");
});

test("entryFromOverride builds a schema-shaped entry", () => {
  const e = entryFromOverride({ domain: "example.com", country: "ca", province: "qc", name: "Ex" });
  assert.equal(e.country, "CA");
  assert.equal(e.province, "QC");
  assert.deepEqual(e.domains, ["example.com"]);
  assert.equal(e.type, "override");
  assert.equal(classify(e).badgeText, "QC");
  const us = entryFromOverride({ domain: "example.com", country: "US", province: "QC" });
  assert.equal(us.province, null);
});

test("province comes from the Canadian entity, not its Canadian parent", () => {
  // WestJet (AB) owned by Onex (ON) must show AB.
  const v = classify({
    country: "CA",
    province: "AB",
    ultimate_parent: { name: "Onex", country: "CA", province: "ON" },
  });
  assert.equal(v.verdict, "CA");
  assert.equal(v.province, "AB");
  assert.equal(v.badgeText, "AB");
});

test("province falls back to the Canadian parent when the entity has none", () => {
  const v = classify({
    country: "CA",
    province: null,
    ultimate_parent: { name: "P", country: "CA", province: "QC" },
  });
  assert.equal(v.province, "QC");
  assert.equal(v.badgeText, "QC");
});
