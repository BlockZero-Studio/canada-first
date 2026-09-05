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

## Privacy: where your data goes

- **Everything runs in your browser.** The extension reads the domain of the tab you are on and matches it against a list bundled inside the extension. There is no CanadaFirst server, no account, no analytics.
- **One optional outside lookup.** When a domain is not in the bundled list, the extension sends that domain name, and nothing else, to Wikidata's public query service (`query.wikidata.org`, run by the Wikimedia Foundation) to find the company's country and headquarters. You can turn this off in Options, after which unknown sites simply show `?`.
- **What is stored, and where.** Three things, all in your browser's local extension storage on this device:
  - **Lookup cache**: for domains checked on Wikidata, the result (company name, country, province, parent company) or a "not found" marker, kept for 30 days. Options > Clear cache removes them all.
  - **Manual settings**: the country and province you set yourself for a site. These use the browser's sync storage, so if your browser profile syncs, they follow you to your other devices.
  - **Options**: whether the Wikidata lookup is on.
- **What is never recorded**: page contents, full URLs, browsing history, or anything that identifies you. Domains you visit are not sent anywhere except the single Wikidata request described above.

Uninstalling the extension deletes all of it.

## Something wrong?

Wrong country or province? Click the badge, then **Set manually** to fix it for yourself, and tell me which site so I can fix it for everyone. This is version 0.1, expect gaps.

Version 0.1.0 · MIT
