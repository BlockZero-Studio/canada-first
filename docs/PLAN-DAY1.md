# Day-1 plan — ship CanadaFirst v0.1 tomorrow

State at hand-off: scaffold complete, 57/57 tests green, data validator green (640 companies, 1,683 domains). Remaining work is integration, polish, and manual QA. Estimated 3–4 h in Claude Code.

## 1. Init (10 min)
- `git init && git add -A && git commit -m "CanadaFirst v0.1 scaffold"`; create GitHub repo; replace `OWNER` in `src/popup/popup.js` (`ISSUE_REPO`).
- `npm test && npm run validate`.

## 2. Chrome smoke (30 min)
Load unpacked. Visit and check badge + popup:
CA: shopify.com (ON), desjardins.com (QC), lululemon.com (BC), canadiantire.ca, cbc.ca, couche-tard.com (QC), telus.com (BC), wealthsimple.com, dollarama.com (QC), westjet.com.
US: amazon.ca, google.com, walmart.ca, netflix.com, github.com (→ Microsoft).
Foreign-owned CA: rona.ca, kijiji.ca, skipthedishes.com.
Other: spotify.com (SE), ikea.com, bbc.co.uk.
Unknown: a small local business site → Wikidata or `?` → Set manually → badge updates → Options shows override → delete → back to `?`.
Fix anything broken; add regression tests in `test/` for logic bugs.

## 3. Live Wikidata check (20 min)
Test 5 domains not in seed with known Wikidata P856 (e.g. `clio.com` if absent, `hootsuite.com`, a mid-size QC company). Verify province walk returns `QC`/`ON`. If P856-with-path misses are common, add a `CONTAINS(LCASE(STR(?site)), "domain")` variant behind the exact match.

## 4. Data fixes (30 min)
- Radio-Canada: split `radio-canada.ca` from CBC into its own entry (QC, Montréal) — currently maps to CBC/ON.
- Decide bank convention (legal HQ vs operational): BMO=QC, RBC/Scotia=ON today → pick one and apply.
- Review the 16 "unsure" entries in `docs/DATA-NOTES.md` (Parkland/Sunoco, EA take-private, WBD, Temu parent CN vs IE, Molson Coors). Web-search only those.
- `npm run validate`, commit.

## 5. Safari (45 min)
- `./scripts/build-safari.sh` (needs Xcode + `xcode-select`). Open project, set personal signing team, Run.
- Safari → Settings → Extensions → enable; Develop → Allow Unsigned Extensions.
- Repeat the smoke list. Watch for: badge colour ignored, `browser.action` vs `chrome.action`, module service worker → if Safari fails to load the SW, switch `"type":"module"` to classic + `importScripts` fallback (Safari 16.4+ supports module SWs; verify version).

## 6. Polish (30 min)
- OTHER verdict: show country name instead of ISO code in popup header (`Intl.DisplayNames`).
- Popup width/dark mode check in both browsers. French check with browser in fr-CA.
- Bump `version` to 0.1.0, tag, `zip -r canada-first-0.1.0.zip . -x '.git/*' 'test/*'` for sharing.

## 7. Verification gate
- `npm test` green · `npm run validate` green · 20-site smoke correct in both browsers · unknown → manual override round-trip works · no console errors in service worker.

## Deferred (v0.2 backlog)
In-page US banner (content script + `scripting` permission) · CWS + App Store submission (icons 1024, privacy policy, screenshots) · Wikidata contains-match · logos · Canadian alternatives.
