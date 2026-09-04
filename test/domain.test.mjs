import { test } from "node:test";
import assert from "node:assert/strict";
import { getRegistrableDomain, getRegistrableDomainFromUrl } from "../src/lib/domain.js";

const cases = [
  ["www.shopify.com", "shopify.com"],
  ["shopify.com", "shopify.com"],
  ["help.shopify.com", "shopify.com"],
  ["WWW.Desjardins.COM", "desjardins.com"],
  ["www.canada.ca", "canada.ca"],
  ["www.canada.gc.ca", "canada.gc.ca"],
  ["cra-arc.gc.ca", "cra-arc.gc.ca"],
  ["www.ontario.on.ca", "ontario.on.ca"],
  ["www.gouv.qc.ca", "gouv.qc.ca"],
  ["portail.sante.gouv.qc.ca", "gouv.qc.ca"],
  ["www.bbc.co.uk", "bbc.co.uk"],
  ["news.bbc.co.uk", "bbc.co.uk"],
  ["www.abc.net.au", "abc.net.au"],
  ["shop.example.com.br", "example.com.br"],
  ["localhost", "localhost"],
  ["192.168.1.1", "192.168.1.1"],
  ["[::1]", "[::1]"],
  ["a.b.c.d.example.org", "example.org"],
  ["example.org.", "example.org"],
  ["gc.ca", "gc.ca"],
  ["www.example.com", "example.com"],
  ["", null],
  ["   ", null],
];

for (const [input, expected] of cases) {
  test(`getRegistrableDomain(${JSON.stringify(input)}) -> ${JSON.stringify(expected)}`, () => {
    assert.equal(getRegistrableDomain(input), expected);
  });
}

test("getRegistrableDomain rejects non-strings", () => {
  assert.equal(getRegistrableDomain(null), null);
  assert.equal(getRegistrableDomain(undefined), null);
  assert.equal(getRegistrableDomain(42), null);
});

test("getRegistrableDomainFromUrl handles http(s) and rejects others", () => {
  assert.equal(getRegistrableDomainFromUrl("https://www.rona.ca/fr/x?y=1"), "rona.ca");
  assert.equal(getRegistrableDomainFromUrl("http://help.shopify.com:8080/"), "shopify.com");
  assert.equal(getRegistrableDomainFromUrl("chrome://extensions"), null);
  assert.equal(getRegistrableDomainFromUrl("about:blank"), null);
  assert.equal(getRegistrableDomainFromUrl("file:///Users/x/index.html"), null);
  assert.equal(getRegistrableDomainFromUrl("not a url"), null);
  assert.equal(getRegistrableDomainFromUrl(undefined), null);
});
