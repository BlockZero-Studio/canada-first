# CanadaFirst — Claude Code project guide

Browser extension (Chrome + Safari on Mac) that shows, for the site you're on, whether the company behind it is **Canadian (and which province)**, **American (warning)**, or other.

## Ground rules
- Speed of delivery > features. v0.1 ships tomorrow. Anything not in `docs/PRD.md` "v0.1 scope" is out.
- Vanilla JS, Manifest V3, **no build step, no npm dependencies**. Tests use `node:test`.
- `chrome.*` API via the shim `const api = globalThis.browser ?? globalThis.chrome`. Never use APIs Safari lacks without a guard (see `setBadgeTextColor`).
- Verdict is always computed from `ultimate_parent.country` (fallback `country`). Province = HQ province of the Canadian entity.
- No telemetry. Only network call: Wikidata SPARQL on local-data miss (user can disable).
- Data edits go in `data/companies.json` only; run `npm run validate` after every edit. Every domain is eTLD+1, unique across entries.
- Strings live in `src/lib/i18n.js` (en + fr-CA). Never hardcode UI text.

## Commands
```
npm test            # 57 unit tests
npm run validate    # data integrity (ids, domains, provinces, sort order)
npm run icons       # regenerate icons/*.png
./scripts/build-safari.sh   # Xcode project via safari-web-extension-converter
```
Chrome: `chrome://extensions` → Developer mode → Load unpacked → this folder.

## Layout
```
manifest.json          MV3
src/background.js      tab listeners, resolution chain, badge, messaging
src/lib/domain.js      hostname → registrable domain (PSL subset)
src/lib/lookup.js      index + classify() → verdict/badge
src/lib/wikidata.js    SPARQL fallback (P856 → P159 → P17/P131 → P300, P749)
src/lib/cache.js       storage.local cache (30d TTL), storage.sync overrides, settings
src/lib/i18n.js        en/fr strings
src/popup/             verdict card + "Set manually" + "Suggest a fix"
src/options/           settings, overrides, clear cache
data/companies.json    640 companies / 1,683 domains (seed)
scripts/               validate-data, make-icons, build-safari
test/                  node:test suites + fixtures
docs/                  PRD, ARCHITECTURE, DESIGN, PLAN-DAY1
```

## Docs
- `docs/PRD.md` — product decisions and scope
- `docs/ARCHITECTURE.md` — resolution chain, data model, Safari packaging
- `docs/DESIGN.md` — badge/popup UX spec
- `docs/PLAN-DAY1.md` — ordered task list to ship tomorrow (start here)
