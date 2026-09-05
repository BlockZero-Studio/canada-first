import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildQuery,
  websiteCandidates,
  parseSparqlResponse,
  lookupWikidata,
  lookupWikidataDetailed,
  SPARQL_ENDPOINT,
} from "../src/lib/wikidata.js";
import { classify } from "../src/lib/lookup.js";

const fixture = (name) => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8"));

test("websiteCandidates enumerates scheme/www/slash variants", () => {
  const c = websiteCandidates("Shopify.com");
  assert.equal(c.length, 8);
  assert.ok(c.includes("https://www.shopify.com/"));
  assert.ok(c.includes("http://shopify.com"));
});

test("buildQuery references the expected properties and domain", () => {
  const q = buildQuery("shopify.com");
  for (const needle of ["wdt:P856", "wdt:P159", "wdt:P17", "wdt:P297", "wdt:P131*", "wdt:P300", "wdt:P749", "wd:Q11828004", "wd:Q3750285"]) {
    assert.ok(q.includes(needle), `query should include ${needle}`);
  }
  assert.ok(q.includes("<https://www.shopify.com/>"));
  assert.ok(q.startsWith("SELECT"));
});

test("parseSparqlResponse: Canadian company with province across rows", () => {
  const e = parseSparqlResponse(fixture("wikidata.shopify.json"), "shopify.com");
  assert.equal(e.id, "wikidata:Q7501569");
  assert.equal(e.name, "Shopify");
  assert.equal(e.country, "CA");
  assert.equal(e.province, "ON");
  assert.equal(e.city, "Ottawa");
  assert.equal(e.ultimate_parent, null);
  assert.equal(e.type, "wikidata");
  assert.deepEqual(e.domains, ["shopify.com"]);
  assert.deepEqual(e.sources, ["https://www.wikidata.org/wiki/Q7501569"]);
  assert.match(e.updated, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(classify(e).badgeText, "ON");
});

test("parseSparqlResponse: US company with parent org", () => {
  const e = parseSparqlResponse(fixture("wikidata.github.json"), "github.com");
  assert.equal(e.country, "US");
  assert.equal(e.province, null);
  assert.deepEqual(e.ultimate_parent, { name: "Microsoft", country: "US", province: null });
  assert.equal(classify(e).verdict, "US");
});

test("parseSparqlResponse: empty / malformed responses return null", () => {
  assert.equal(parseSparqlResponse({ results: { bindings: [] } }, "x.com"), null);
  assert.equal(parseSparqlResponse({}, "x.com"), null);
  assert.equal(parseSparqlResponse(null, "x.com"), null);
  assert.equal(parseSparqlResponse({ results: { bindings: [{ itemLabel: { value: "no item" } }] } }, "x.com"), null);
});

test("parseSparqlResponse: falls back to domain when label is a bare QID, province ignored outside CA", () => {
  const e = parseSparqlResponse(
    {
      results: {
        bindings: [
          {
            item: { value: "http://www.wikidata.org/entity/Q1" },
            itemLabel: { value: "Q1" },
            itemCountryCode: { value: "fr" },
            provCode: { value: "CA-QC" },
          },
        ],
      },
    },
    "example.fr",
  );
  assert.equal(e.name, "example.fr");
  assert.equal(e.country, "FR");
  assert.equal(e.province, null);
});

test("lookupWikidata uses injected fetch, GET with format=json and UA headers", async () => {
  let seen;
  const fakeFetch = async (url, init) => {
    seen = { url, init };
    return { ok: true, json: async () => fixture("wikidata.shopify.json") };
  };
  const e = await lookupWikidata("shopify.com", { fetch: fakeFetch });
  assert.equal(e.province, "ON");
  assert.ok(seen.url.startsWith(SPARQL_ENDPOINT + "?format=json&query="));
  assert.equal(seen.init.method, "GET");
  assert.equal(seen.init.headers["User-Agent"], "CanadaFirst/0.1 (browser extension)");
  assert.ok(seen.init.signal instanceof AbortSignal);
});

test("lookupWikidata returns null on HTTP error, thrown error and timeout", async () => {
  assert.equal(await lookupWikidata("x.com", { fetch: async () => ({ ok: false, status: 500 }) }), null);
  assert.equal(await lookupWikidata("x.com", { fetch: async () => { throw new Error("boom"); } }), null);
  const slow = (url, { signal }) =>
    new Promise((_, reject) => {
      signal.addEventListener("abort", () => reject(new Error("aborted")));
    });
  const t0 = Date.now();
  assert.equal(await lookupWikidata("x.com", { fetch: slow, timeoutMs: 30 }), null);
  assert.ok(Date.now() - t0 < 2000);
  assert.equal(await lookupWikidata("", { fetch: async () => ({}) }), null);
});

test("lookupWikidataDetailed distinguishes hit / miss / error", async () => {
  const okJson = (bindings) => async () => ({ ok: true, json: async () => ({ results: { bindings } }) });
  const hit = await lookupWikidataDetailed("shopify.com", {
    fetch: okJson([{ item: { value: "http://www.wikidata.org/entity/Q1" }, itemCountryCode: { value: "CA" } }]),
  });
  assert.equal(hit.status, "hit");
  assert.equal(hit.entry.country, "CA");

  const miss = await lookupWikidataDetailed("nobody.example", { fetch: okJson([]) });
  assert.deepEqual(miss, { status: "miss", entry: null });

  assert.equal((await lookupWikidataDetailed("x.com", { fetch: async () => ({ ok: false, status: 429 }) })).status, "error");
  assert.equal((await lookupWikidataDetailed("x.com", { fetch: async () => { throw new Error("boom"); } })).status, "error");
  const slow = (url, { signal }) => new Promise((_, reject) => signal.addEventListener("abort", () => reject(new Error("aborted"))));
  assert.equal((await lookupWikidataDetailed("x.com", { fetch: slow, timeoutMs: 30 })).status, "error");
  assert.equal((await lookupWikidataDetailed("", { fetch: async () => ({}) })).status, "error");
});
