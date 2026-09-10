import { test } from "node:test";
import assert from "node:assert/strict";
import { ISSUE_REPO, fixIssueUrl, reviewFields, reviewIssueUrl } from "../src/lib/issue.js";
import { entryFromOverride } from "../src/lib/lookup.js";

test("fixIssueUrl targets the repo with a data label and the domain in the title", () => {
  const u = new URL(fixIssueUrl({ domain: "x.ca", verdict: { verdict: "US" }, source: "local", entry: { name: "X", id: "x" } }));
  assert.equal(`${u.origin}${u.pathname}`, ISSUE_REPO);
  assert.equal(u.searchParams.get("title"), "Fix: x.ca");
  assert.equal(u.searchParams.get("labels"), "data");
  assert.match(u.searchParams.get("body"), /Current verdict: US \(local\)/);
});

test("reviewFields lists exactly the fields sent, province only for CA", () => {
  const ca = entryFromOverride({ domain: "boutique.ca", country: "ca", province: "qc", name: "Boutique" });
  const f = reviewFields({ domain: "boutique.ca", entry: ca, previous: { verdict: { verdict: "UNKNOWN", province: null }, source: "none" }, version: "0.1.0" });
  assert.deepEqual(f.map(([k]) => k), ["domain", "country", "province", "companyName", "previousVerdict", "version"]);
  assert.deepEqual(f.find(([k]) => k === "province"), ["province", "QC"]);
  assert.deepEqual(f.find(([k]) => k === "previousVerdict"), ["previousVerdict", "UNKNOWN (none)"]);

  const us = entryFromOverride({ domain: "shop.com", country: "US" });
  const g = reviewFields({ domain: "shop.com", entry: us, previous: null });
  assert.deepEqual(g.map(([k]) => k), ["domain", "country", "previousVerdict"]);
  assert.ok(!g.some(([, v]) => v === undefined || v === null), "no empty values leak into the issue");
});

test("reviewIssueUrl encodes the proposal in title and body with both labels", () => {
  const e = entryFromOverride({ domain: "boutique.ca", country: "CA", province: "QC", name: "Boutique" });
  const u = new URL(reviewIssueUrl({ domain: "boutique.ca", entry: e, previous: { verdict: { verdict: "US", province: null }, source: "wikidata" } }));
  assert.equal(u.searchParams.get("title"), "Review: boutique.ca → CA/QC");
  assert.equal(u.searchParams.get("labels"), "data,user-submitted");
  const body = u.searchParams.get("body");
  assert.match(body, /^domain: boutique\.ca$/m);
  assert.match(body, /^companyName: Boutique$/m);
  assert.match(body, /^previousVerdict: US \(wikidata\)$/m);
  assert.doesNotMatch(body, /notes|updated|sources/, "internal entry fields are not sent");
});
