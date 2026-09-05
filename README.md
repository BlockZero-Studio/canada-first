# CanadaFirst 🍁

A tiny browser extension that tells you, for the site you're on, whether the company behind it is **Canadian** (and from which province), **American**, or from somewhere else.

The toolbar badge says it all:

| Badge | Meaning |
|---|---|
| `QC`, `ON`, `BC`… on red | Canadian company, headquartered in that province |
| `US` on amber | American company, or a Canadian brand owned by an American one (Rona, Walmart Canada…) |
| `SE`, `GB`, `FR`… on grey | Company from another country |
| `?` on light grey | Unknown. Click the badge and set it yourself |

Click the badge for details: company name, city, ultimate owner, and the sources used.

## Install (Chrome, Edge, Brave, Arc)

1. Unzip this folder somewhere you won't delete it.
2. Open `chrome://extensions` (or `edge://extensions`, `brave://extensions`).
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and pick the unzipped folder (the one with `manifest.json`).
5. Pin CanadaFirst to your toolbar and browse.

Safari support is coming; it needs a signed build.

## How it works

- Verdicts come from a built-in list of about 640 companies and 1,700 domains, kept in `data/companies.json`.
- The country is always the **ultimate owner's** country. A Canadian brand with a US parent shows as US-owned.
- Sites not in the list are looked up on Wikidata (public, no account). You can turn that off in Options.
- No tracking, no accounts, nothing leaves your browser except the optional Wikidata lookup.

## Something wrong?

Wrong country or province? Click the badge, then **Set manually** to fix it for yourself, and tell me which site so I can fix it for everyone. This is version 0.1, expect gaps.

Version 0.1.0 · MIT
