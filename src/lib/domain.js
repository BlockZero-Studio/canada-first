// Registrable domain (eTLD+1) extraction without the full Public Suffix List.
// We keep a small subset of multi-part public suffixes that matter for a
// Canadian-focused extension plus the most common international ones.

const MULTI_PART_SUFFIXES = new Set([
  // Canada (provincial / sector second-level domains)
  "ab.ca", "bc.ca", "mb.ca", "nb.ca", "nf.ca", "nl.ca", "ns.ca", "nt.ca",
  "nu.ca", "on.ca", "pe.ca", "qc.ca", "sk.ca", "yk.ca", "gc.ca",
  // United Kingdom
  "co.uk", "org.uk", "ac.uk", "gov.uk", "ltd.uk", "plc.uk", "me.uk", "net.uk",
  // Australia / New Zealand
  "com.au", "net.au", "org.au", "edu.au", "gov.au", "co.nz", "org.nz", "net.nz",
  // Asia
  "co.jp", "ne.jp", "or.jp", "ac.jp", "co.kr", "com.cn", "com.hk", "com.sg",
  "co.in", "com.tw",
  // Americas
  "com.br", "com.mx", "com.ar", "com.co",
  // Europe
  "co.za", "com.tr", "com.pl", "co.il", "com.ua", "co.at",
]);

const IPV4_RE = /^(\d{1,3})(\.\d{1,3}){3}$/;

/**
 * Returns the registrable domain (eTLD+1) for a hostname, e.g.
 *   "www.shopify.com"      -> "shopify.com"
 *   "shop.canada.gc.ca"    -> "canada.gc.ca"
 *   "www.bbc.co.uk"        -> "bbc.co.uk"
 *   "localhost"            -> "localhost"
 *   "192.168.1.1"          -> "192.168.1.1"
 * Returns null for empty/invalid input.
 * @param {string} hostname
 * @returns {string|null}
 */
export function getRegistrableDomain(hostname) {
  if (typeof hostname !== "string") return null;
  let h = hostname.trim().toLowerCase();
  if (!h) return null;
  // strip trailing dot (FQDN) and a leading "www."
  h = h.replace(/\.$/, "");
  if (h.startsWith("[") && h.endsWith("]")) return h; // IPv6 literal
  if (h.includes(":")) return h; // bare IPv6
  if (IPV4_RE.test(h)) return h;
  h = h.replace(/^www\./, "");

  const parts = h.split(".").filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0]; // "localhost", "intranet"

  const lastTwo = parts.slice(-2).join(".");
  if (MULTI_PART_SUFFIXES.has(lastTwo)) {
    if (parts.length === 2) return lastTwo; // the suffix itself, e.g. "gc.ca"
    return parts.slice(-3).join(".");
  }
  return lastTwo;
}

/**
 * Convenience: extract the registrable domain from a full URL string.
 * Returns null for non-http(s) URLs or unparsable input.
 * @param {string} url
 * @returns {string|null}
 */
export function getRegistrableDomainFromUrl(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return getRegistrableDomain(u.hostname);
  } catch {
    return null;
  }
}

export const PUBLIC_SUFFIX_SUBSET = MULTI_PART_SUFFIXES;
