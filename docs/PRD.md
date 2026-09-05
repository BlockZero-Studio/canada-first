# PRD — CanadaFirst v0.1

## Problem
When browsing, you can't tell at a glance whether the company behind a site is Canadian, from which province, or American. "Buy Canadian" decisions need that signal instantly, without research.

## User
Laurent (and Canadians who want to favour Canadian companies). Mac, Safari + Chrome.

## Core promise
One glance at the toolbar icon tells you: **🍁 QC** (Canadian, Québec), **⚠ US** (American — warning), **🌐 SE** (other country), or **?** (unknown). Click for details and ownership.

## Key decisions (locked for v0.1)
| Decision | Choice | Why |
|---|---|---|
| Ownership semantics | Verdict = country of the **ultimate controlling parent**. Province = HQ province of the Canadian entity. | "Canadian brand, US-owned" (Rona, Kijiji) is the case users most want exposed. |
| Signal surface | Toolbar badge + popup only. No in-page banner. | Zero page interference, works identically in Safari and Chrome, no content-script permissions. Banner deferred to v0.2 (setting already stored). |
| Data source | Bundled JSON seed (640 companies) → Wikidata fallback → user override. | Offline-first, instant, no backend. Wikidata covers the long tail. |
| Unknown handling | Show "?" and let user set the country manually (synced override) + "Suggest a fix" link to a GitHub issue. | Crowdsourcing without infra. |
| Platforms | Chrome (load unpacked) + Safari (Xcode converter, unsigned dev build). | Store submissions are out of scope for tomorrow. |
| Language | English default, French (Québec) when browser is fr. | Cheap; i18n map already exists. |
| Privacy | No analytics. Wikidata query sends only the registrable domain. Toggle to disable. | Trust. |

## v0.1 scope (ship tomorrow)
- Badge per tab with colour + text (CA red/province, US amber, other grey, unknown light grey).
- Popup: verdict, company, city/province, ultimate parent if different, notes, sources, Set manually, Suggest a fix.
- Options: Wikidata toggle, clear cache, manage overrides.
- Seed data ≥ 600 companies, validator green.
- Works in Chrome; Safari build runs locally.

## Out of scope (v0.2+)
In-page US warning banner · Store listings (CWS / App Store) · Product-level ownership (brands on Amazon etc.) · Company logos · Wikidata write-back · iOS Safari · Ownership % / mixed ownership · Domain-level for subsidiaries beyond one parent hop.

## Success for tomorrow
Load in Chrome and Safari, visit 20 known sites (10 CA, 5 US, 5 other) → correct badge each time; unknown site → Wikidata resolves or "?" with manual override working.
