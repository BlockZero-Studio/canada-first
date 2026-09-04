# Architecture — MapleCheck v0.1

## Runtime
Manifest V3, module service worker, vanilla ES modules, no bundler. Same code runs in Chrome and Safari (Safari wraps it in a macOS app via `safari-web-extension-converter`).

## Resolution chain (background.js)
```
tab URL ──▶ skip non-http(s)
        ──▶ getRegistrableDomain(hostname)          src/lib/domain.js  (PSL subset: co.uk, on.ca, gc.ca, …)
        ──▶ 1. user override      (storage.sync "overrides")     src/lib/cache.js
        ──▶ 2. local index        (data/companies.json, Map domain→entry, built lazily)
        ──▶ 3. cache              (storage.local, 30-day TTL, negatives cached too)
        ──▶ 4. Wikidata SPARQL    (if setting enabled; 8s timeout; null on failure)   src/lib/wikidata.js
        ──▶ 5. UNKNOWN
        ──▶ classify(entry) → {verdict, province, badgeText, badgeColor, label, foreignOwned}
        ──▶ action.setBadgeText/BackgroundColor/Title({tabId})
```
Triggers: `tabs.onActivated`, `tabs.onUpdated` (status=complete), `windows.onFocusChanged`.
Popup asks `GET_VERDICT {tabId}`; writes `SET_OVERRIDE` / `CLEAR_OVERRIDE`. Options use `GET_SETTINGS/SET_SETTINGS/CLEAR_CACHE/LIST_OVERRIDES/GET_DATA_META`.

## Data model (`data/companies.json`)
```json
{ "id":"rona", "name":"RONA inc.", "domains":["rona.ca"], "country":"CA", "province":"QC", "city":"Boucherville",
  "ultimate_parent":{"name":"Sycamore Partners","country":"US","province":null},
  "type":"private", "sources":["https://…"], "notes":"…", "updated":"2026-09-04" }
```
Rules enforced by `scripts/validate-data.mjs`: unique ids, unique domains across entries, ISO-2 countries, `province` iff `country=="CA"`, allowed province set, sorted by name.

## Wikidata fallback
SPARQL against `query.wikidata.org`: item whose P856 (official website) matches 8 URL variants of the domain → P159 HQ → P17 country (P297 ISO) → if CA, `P131*` up to a province/territory (Q11828004/Q3750285) → P300 ISO 3166-2 minus `CA-` → P749 parent (one hop) with its country. Parsed into the same schema, `type:"wikidata"`, cached 30 days. Not called in tests (fixtures only). Known limit: P856 with a path won't match.

## Storage
- `storage.local`: `cache:{domain}` → {entry|null, ts}; settings.
- `storage.sync`: `overrides` → {domain: entry}. Synced across the user's browsers (Chrome). Safari sync works via iCloud only when signed app; fine for dev.

## Safari packaging
`./scripts/build-safari.sh` → `xcrun safari-web-extension-converter` → `../maple-check-safari/` Xcode project (macOS only, bundle id `studio.blockzero.maplecheck`). Run from Xcode with a personal team; enable in Safari → Settings → Extensions; for unsigned dev: Develop → Allow Unsigned Extensions. Guards in code: `setBadgeTextColor` optional; `browser` namespace preferred.

## Testing
`node --test test/*.test.mjs` — 57 tests: domain parsing (25), lookup/classify (14), Wikidata parsing (8), cache/overrides/settings with in-memory storage mock (7), i18n key parity (3). Data integrity via `npm run validate`. Manual smoke list in `docs/PLAN-DAY1.md`.

## Deliberate non-choices
No TypeScript, no bundler, no framework, no backend, no content script, no analytics. Each would cost hours and buy nothing for v0.1.
