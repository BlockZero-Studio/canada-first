// Wikidata SPARQL fallback: resolve a registrable domain to a company entry
// in the same schema as data/companies.json.
//
// Property cheat-sheet:
//   P856  official website
//   P159  headquarters location
//   P17   country
//   P297  ISO 3166-1 alpha-2 code
//   P131  located in the administrative territorial entity
//   P300  ISO 3166-2 code (e.g. "CA-QC")
//   P749  parent organization
//   Q11828004 province of Canada, Q3750285 territory of Canada

export const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";
export const USER_AGENT = "MapleCheck/0.1 (browser extension)";
export const DEFAULT_TIMEOUT_MS = 8000;

/**
 * Candidate literal values for P856 given a registrable domain. Exact IRI
 * matching is indexed on the query service, whereas REGEX over every P856
 * value is not, so we enumerate the usual variants instead.
 * @param {string} domain
 * @returns {string[]}
 */
export function websiteCandidates(domain) {
  const d = String(domain).trim().toLowerCase();
  const hosts = [d, `www.${d}`];
  const out = [];
  for (const scheme of ["https", "http"]) {
    for (const h of hosts) {
      out.push(`${scheme}://${h}/`);
      out.push(`${scheme}://${h}`);
    }
  }
  return out;
}

/**
 * Build the SPARQL query for a domain. Kept in one function so tests can
 * assert on its shape without touching the network.
 * @param {string} domain
 * @returns {string}
 */
export function buildQuery(domain) {
  const values = websiteCandidates(domain)
    .map((u) => `<${u}>`)
    .join(" ");
  return `
SELECT ?item ?itemLabel ?itemCountryCode ?hq ?hqLabel ?hqCountryCode ?provCode
       ?parent ?parentLabel ?parentCountryCode
WHERE {
  VALUES ?website { ${values} }
  ?item wdt:P856 ?website .
  OPTIONAL { ?item wdt:P17 ?itemCountry . ?itemCountry wdt:P297 ?itemCountryCode . }
  OPTIONAL {
    ?item wdt:P159 ?hq .
    OPTIONAL { ?hq wdt:P17 ?hqCountry . ?hqCountry wdt:P297 ?hqCountryCode . }
    OPTIONAL {
      ?hq wdt:P131* ?prov .
      VALUES ?provClass { wd:Q11828004 wd:Q3750285 }
      ?prov wdt:P31 ?provClass .
      ?prov wdt:P300 ?provCode .
    }
  }
  OPTIONAL {
    ?item wdt:P749 ?parent .
    OPTIONAL { ?parent wdt:P17 ?parentCountry . ?parentCountry wdt:P297 ?parentCountryCode . }
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en,fr". }
}
LIMIT 10`.trim();
}

function qidFromUri(uri) {
  if (typeof uri !== "string") return null;
  const m = uri.match(/\/(Q\d+)$/);
  return m ? m[1] : null;
}

function val(binding, key) {
  const v = binding?.[key]?.value;
  return typeof v === "string" && v.length ? v : null;
}

/**
 * Parse a SPARQL JSON response into a company entry (or null).
 * Rows are grouped by ?item; the first item that has any country info wins.
 * @param {object} json  Parsed SPARQL JSON (`{ results: { bindings: [] } }`)
 * @param {string} domain
 * @returns {object|null}
 */
export function parseSparqlResponse(json, domain) {
  const bindings = json?.results?.bindings;
  if (!Array.isArray(bindings) || bindings.length === 0) return null;

  // Group by item URI, merging the optional fields across rows.
  const byItem = new Map();
  for (const b of bindings) {
    const itemUri = val(b, "item");
    if (!itemUri) continue;
    const acc = byItem.get(itemUri) ?? {
      itemUri,
      name: null,
      itemCountry: null,
      hqLabel: null,
      hqCountry: null,
      provCode: null,
      parentUri: null,
      parentName: null,
      parentCountry: null,
    };
    acc.name ??= val(b, "itemLabel");
    acc.itemCountry ??= val(b, "itemCountryCode");
    acc.hqLabel ??= val(b, "hqLabel");
    acc.hqCountry ??= val(b, "hqCountryCode");
    acc.provCode ??= val(b, "provCode");
    acc.parentUri ??= val(b, "parent");
    acc.parentName ??= val(b, "parentLabel");
    acc.parentCountry ??= val(b, "parentCountryCode");
    byItem.set(itemUri, acc);
  }
  if (byItem.size === 0) return null;

  const items = [...byItem.values()];
  const pick = items.find((i) => i.hqCountry || i.itemCountry) ?? items[0];
  const qid = qidFromUri(pick.itemUri);
  if (!qid) return null;

  const country = (pick.hqCountry ?? pick.itemCountry ?? null)?.toUpperCase() ?? null;
  let province = null;
  if (country === "CA" && pick.provCode) {
    province = pick.provCode.toUpperCase().replace(/^CA-/, "");
  }

  let ultimate_parent = null;
  if (pick.parentUri) {
    ultimate_parent = {
      name: pick.parentName ?? qidFromUri(pick.parentUri) ?? "Parent organization",
      country: pick.parentCountry ? pick.parentCountry.toUpperCase() : null,
      province: null,
    };
  }

  // A label that is just the QID means Wikidata had no label in en/fr.
  const name = pick.name && !/^Q\d+$/.test(pick.name) ? pick.name : domain;

  return {
    id: `wikidata:${qid}`,
    name,
    domains: [String(domain).toLowerCase()],
    country,
    province,
    city: pick.hqLabel ?? null,
    ultimate_parent,
    type: "wikidata",
    sources: [`https://www.wikidata.org/wiki/${qid}`],
    notes: "Resolved automatically from Wikidata; may be incomplete.",
    updated: new Date().toISOString().slice(0, 10),
  };
}

/**
 * Query Wikidata for a domain and report *why* there is no entry, so callers
 * can cache a genuine miss but not a transient failure (timeout, 429, 5xx).
 * @param {string} domain
 * @param {{fetch?: typeof fetch, timeoutMs?: number}} [opts]
 * @returns {Promise<{status: "hit"|"miss"|"error", entry: object|null}>}
 */
export async function lookupWikidataDetailed(domain, opts = {}) {
  const fetchFn = opts.fetch ?? globalThis.fetch;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  if (!fetchFn || !domain) return { status: "error", entry: null };

  const url = `${SPARQL_ENDPOINT}?format=json&query=${encodeURIComponent(buildQuery(domain))}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchFn(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/sparql-results+json",
        // Browsers silently drop User-Agent from fetch(); Wikimedia accepts
        // Api-User-Agent as the alternative. Both are set so Node gets the real one.
        "User-Agent": USER_AGENT,
        "Api-User-Agent": USER_AGENT,
      },
    });
    if (!res || !res.ok) return { status: "error", entry: null };
    const json = await res.json();
    const entry = parseSparqlResponse(json, domain);
    return entry ? { status: "hit", entry } : { status: "miss", entry: null };
  } catch {
    return { status: "error", entry: null };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Query Wikidata for a domain. Returns an entry or null on any failure
 * (network error, timeout, non-JSON, no match).
 * @param {string} domain
 * @param {{fetch?: typeof fetch, timeoutMs?: number}} [opts]
 * @returns {Promise<object|null>}
 */
export async function lookupWikidata(domain, opts = {}) {
  return (await lookupWikidataDetailed(domain, opts)).entry;
}
