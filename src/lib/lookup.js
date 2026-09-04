// Local index + verdict classification. Pure functions, no browser APIs.

export const BADGE_COLORS = Object.freeze({
  CA: "#D52B1E",
  US: "#F59E0B",
  OTHER: "#6B7280",
  UNKNOWN: "#D1D5DB",
});

export const PROVINCES = Object.freeze({
  AB: "Alberta",
  BC: "British Columbia",
  MB: "Manitoba",
  NB: "New Brunswick",
  NL: "Newfoundland and Labrador",
  NS: "Nova Scotia",
  NT: "Northwest Territories",
  NU: "Nunavut",
  ON: "Ontario",
  PE: "Prince Edward Island",
  QC: "Quebec",
  SK: "Saskatchewan",
  YT: "Yukon",
});

/**
 * Build a Map from registrable domain -> company entry.
 * Later entries win on duplicate domains (lets local overrides be appended).
 * @param {Array<object>} companies
 * @returns {Map<string, object>}
 */
export function buildIndex(companies) {
  const index = new Map();
  if (!Array.isArray(companies)) return index;
  for (const entry of companies) {
    if (!entry || !Array.isArray(entry.domains)) continue;
    for (const d of entry.domains) {
      if (typeof d !== "string") continue;
      index.set(d.trim().toLowerCase(), entry);
    }
  }
  return index;
}

/**
 * Look up a registrable domain in an index.
 * @param {Map<string, object>} index
 * @param {string} domain
 * @returns {object|null}
 */
export function lookupDomain(index, domain) {
  if (!index || !domain) return null;
  return index.get(String(domain).toLowerCase()) ?? null;
}

function normCountry(c) {
  return typeof c === "string" && c.trim() ? c.trim().toUpperCase() : null;
}

/**
 * Classify an entry into a verdict for badge + popup.
 * Verdict is driven by the ultimate parent's country, falling back to the
 * entry's own country.
 * @param {object|null|undefined} entry
 * @returns {{
 *   verdict: "CA"|"US"|"OTHER"|"UNKNOWN",
 *   country: string|null,
 *   province: string|null,
 *   badgeText: string,
 *   badgeColor: string,
 *   label: string,
 *   foreignOwned: boolean,
 *   ownerCountry: string|null,
 *   ownerName: string|null
 * }}
 */
export function classify(entry) {
  if (!entry) {
    return {
      verdict: "UNKNOWN",
      country: null,
      province: null,
      badgeText: "?",
      badgeColor: BADGE_COLORS.UNKNOWN,
      label: "Unknown",
      foreignOwned: false,
      ownerCountry: null,
      ownerName: null,
    };
  }

  const ownCountry = normCountry(entry.country);
  const parent = entry.ultimate_parent || null;
  const parentCountry = parent ? normCountry(parent.country) : null;
  const effectiveCountry = parentCountry ?? ownCountry;

  const foreignOwned = ownCountry === "CA" && parentCountry !== null && parentCountry !== "CA";

  // Province: prefer the parent's province when the parent is Canadian,
  // otherwise the entry's own province.
  let province = null;
  if (effectiveCountry === "CA") {
    const p = parentCountry === "CA" && parent?.province ? parent.province : entry.province;
    province = typeof p === "string" && p.trim() ? p.trim().toUpperCase() : null;
  }

  if (!effectiveCountry) {
    return {
      ...classify(null),
      country: null,
    };
  }

  if (effectiveCountry === "CA") {
    return {
      verdict: "CA",
      country: "CA",
      province,
      badgeText: province ?? "CA",
      badgeColor: BADGE_COLORS.CA,
      label: province ? `Canadian — ${PROVINCES[province] ?? province}` : "Canadian",
      foreignOwned: false,
      ownerCountry: parentCountry,
      ownerName: parent?.name ?? null,
    };
  }

  if (effectiveCountry === "US") {
    return {
      verdict: "US",
      country: "US",
      province: null,
      badgeText: "US",
      badgeColor: BADGE_COLORS.US,
      label: foreignOwned ? "Canadian brand, US-owned" : "American company",
      foreignOwned,
      ownerCountry: parentCountry,
      ownerName: parent?.name ?? null,
    };
  }

  return {
    verdict: "OTHER",
    country: effectiveCountry,
    province: null,
    badgeText: effectiveCountry,
    badgeColor: BADGE_COLORS.OTHER,
    label: foreignOwned
      ? `Canadian brand, ${effectiveCountry}-owned`
      : `Company from ${effectiveCountry}`,
    foreignOwned,
    ownerCountry: parentCountry,
    ownerName: parent?.name ?? null,
  };
}

/**
 * Build a minimal entry from a user override form.
 * @param {{domain:string,country:string,province?:string|null,name?:string}} o
 */
export function entryFromOverride(o) {
  const country = normCountry(o.country);
  return {
    id: `override:${o.domain}`,
    name: o.name || o.domain,
    domains: [o.domain],
    country,
    province: country === "CA" && o.province ? String(o.province).toUpperCase() : null,
    city: null,
    ultimate_parent: null,
    type: "override",
    sources: [],
    notes: "Set manually by the user.",
    updated: new Date().toISOString().slice(0, 10),
  };
}
