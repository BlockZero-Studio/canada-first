# MapleCheck — developer notes

Browser extension (Manifest V3) that shows, for the site you are on, whether the
company behind it is **Canadian** (and which province), **American** (warning),
or from **another country**. The toolbar badge shows the province code
(`QC`, `ON`, ...) on red, `US` on amber, a country code on grey, or `?`.

Vanilla JavaScript, no build step, no npm dependencies. Data lives in
`data/companies.json`; unknown sites fall back to Wikidata (optional, on by
default, cached 30 days). You can override any site manually.

## Chrome (load unpacked)

1. `npm run icons` (once, generates `icons/*.png`).
2. Open `chrome://extensions`, enable **Developer mode** (top right).
3. **Load unpacked** and pick this folder (the one with `manifest.json`).
4. Pin MapleCheck in the toolbar. Browse to a site and click the icon.

Also works in Edge/Brave/Arc the same way.

## Safari (macOS)

Requires Xcode. Then:

```sh
npm run safari        # runs scripts/build-safari.sh (xcrun safari-web-extension-converter)
```

Open the generated Xcode project in `../maple-check-safari`, set your Personal
Team under *Signing & Capabilities*, **Run**, then enable the extension in
*Safari > Settings > Extensions*. For dev builds also enable
*Develop > Allow Unsigned Extensions*. See the comments in
`scripts/build-safari.sh` for details.

## Tests

```sh
npm test              # node --test test/
npm run validate      # checks data/companies.json against the schema
```

Node 20+ (uses `node:test`). Tests never hit the network.

## Layout

```
manifest.json
src/background.js         service worker: tab events, resolution chain, badge, messages
src/lib/domain.js         registrable-domain (eTLD+1) extraction, small PSL subset
src/lib/lookup.js         buildIndex(), classify() -> verdict/badge
src/lib/wikidata.js       SPARQL fallback (P856 -> P159 -> P17/P131/P300, P749)
src/lib/cache.js          storage.local cache (30d TTL), storage.sync overrides + settings
src/lib/i18n.js           en + fr (Québec) strings
src/popup/                toolbar popup
src/options/              options page
data/companies.json       the dataset (see schema below)
scripts/                  make-icons.mjs, validate-data.mjs, build-safari.sh
test/                     node:test suites + fixtures
```

Resolution order per tab: user override → local data → cache → Wikidata → unknown.
The verdict is based on `ultimate_parent.country` when present, else `country`;
a Canadian company with a foreign parent is flagged ("Canadian brand, US-owned").

## Data schema

`data/companies.json` is an array of:

```json
{
  "id": "rona",
  "name": "Rona",
  "domains": ["rona.ca"],
  "country": "CA",
  "province": "QC",
  "city": "Boucherville",
  "ultimate_parent": { "name": "Sycamore Partners", "country": "US", "province": null },
  "type": "private",
  "sources": ["https://www.rona.ca/en/about-rona"],
  "notes": "Acquired from Lowe's by Sycamore Partners in 2023.",
  "updated": "2026-09-01"
}
```

- `domains`: registrable domains only (eTLD+1, lowercase, no `www.`), e.g.
  `walmart.ca`, `canada.gc.ca`. Each domain may appear in only one entry.
- `country` / `ultimate_parent.country`: ISO 3166-1 alpha-2, uppercase.
- `province`: two-letter code (`QC`, `ON`, ...), `null` outside Canada.
- `ultimate_parent`: `null` when independent.
- `updated`: `YYYY-MM-DD`.

## Adding a company

1. Append an object to `data/companies.json` following the schema above.
   Use the ultimate parent (the top of the ownership chain), with at least
   one public source (annual report, corporate site, registry).
2. `npm run validate` and `npm test`.
3. Reload the extension (`chrome://extensions` → reload icon).

Users can also click **Wrong? Suggest a fix** in the popup, which opens a
pre-filled GitHub issue (repo URL is a placeholder in `src/popup/popup.js`).
