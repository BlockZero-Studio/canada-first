# Chrome Web Store submission — CanadaFirst 0.1.0

Everything to paste into the developer dashboard (https://chrome.google.com/webstore/devconsole). Prepared 2026-09-08.

## Before you start
- Developer account: register with a Google account, pay the one-time US$5 fee, verify the contact email. Register as **BlockZero Innovations Inc.** (publisher name shown to users). Optional: verify the `blockzero.ca` domain later for a "verified publisher" badge.
- Package: `npm run package` → `dist/canadafirst-0.1.0-chrome.zip`.
- Assets: `npm run store-assets` → `store/*.png` (five 1280×800 screenshots, one 440×280 small tile).

## Store listing tab

**Name** (from manifest): CanadaFirst

**Summary** (≤132 chars, from manifest description):
> Shows whether the company behind the current site is Canadian (and which province), American, or other.

**Category**: Shopping (alternative: Productivity)

**Language**: English. French text is included in the description below because the extension's UI is bilingual (follows the browser language).

**Detailed description**:
```
Is the company behind this website Canadian?

CanadaFirst answers at a glance. A small badge on the toolbar shows:
• QC, ON, BC… on red — a Canadian company, and the province where it is headquartered
• US on amber — an American company, or a Canadian brand owned by an American one (Rona, Walmart Canada…)
• SE, GB, FR… on grey — a company from another country
• ? — unknown; click to set it yourself

Click the badge for the details: company name, city, ultimate owner, and the sources.

The verdict always follows the ultimate owner. A Canadian brand with a US parent is shown as US-owned, because that is what "buy Canadian" decisions need.

How it works
• A built-in list of about 640 companies and 1,700 domains, curated with public sources.
• Sites not in the list are looked up on Wikidata (public, no account). You can turn this off in Options.
• Everything runs in your browser. No account, no tracking, no analytics. Nothing leaves your device except the optional Wikidata lookup, which sends only the domain name.
• Wrong verdict? Set it manually in two clicks, and use "Suggest a fix" to help everyone.

Interface in English and French (Québec).

Open source: https://github.com/BlockZero-Studio/canada-first
Privacy policy: see the link on this page.

—

L'entreprise derrière ce site est-elle canadienne ?

CanadaFirst répond d'un coup d'œil. Une pastille sur la barre d'outils indique :
• QC, ON, BC… sur fond rouge — entreprise canadienne, et la province de son siège social
• US sur fond ambre — entreprise américaine, ou marque canadienne détenue par une entreprise américaine (Rona, Walmart Canada…)
• SE, GB, FR… sur fond gris — entreprise d'un autre pays
• ? — inconnue ; cliquez pour la définir vous-même

Le verdict suit toujours le propriétaire ultime. Tout fonctionne dans votre navigateur : aucun compte, aucun suivi. Seule la consultation facultative de Wikidata envoie le nom de domaine, et vous pouvez la désactiver dans les Options.

Interface en français et en anglais. Code source ouvert (MIT), données sous CC BY 4.0.
```

**Graphic assets**
- Store icon 128×128: `icons/icon128.png`
- Screenshots 1280×800 (upload in this order): `store/screenshot-1-shopify.png`, `store/screenshot-2-rona.png`, `store/screenshot-3-amazon.png`, `store/screenshot-4-spotify.png`, `store/screenshot-5-desjardins-fr.png`
- Small promo tile 440×280: `store/promo-small-440x280.png`
- Marquee 1400×560: optional, skip for 0.1.

**Additional fields**
- Official URL: https://github.com/BlockZero-Studio/canada-first (switch to blockzero.ca when the page exists)
- Homepage URL: same
- Support URL: https://github.com/BlockZero-Studio/canada-first/issues

## Privacy practices tab

**Single purpose description**:
> CanadaFirst shows, for the website in the current tab, whether the company that owns it is Canadian (and from which province), American, or from another country, using a bundled company list and an optional Wikidata lookup.

**Permission justifications**
- `tabs`: Read the URL of the active tab to extract its domain name (for example `shopify.com`) and show the verdict badge for that tab. No page content is read.
- `storage`: Save the user's manual corrections and settings (sync storage) and cache Wikidata results for 30 days (local storage) so the same domain is not looked up twice.
- Host permission `https://query.wikidata.org/*`: Query Wikidata's public SPARQL endpoint for the company behind a domain that is not in the bundled list. Optional; can be disabled in Options.
- Host permission `https://www.wikidata.org/*`: Reserved for linking to the Wikidata item shown as a source. No requests are made to it today.
- Remote code: **No**. All code is packaged; the extension only fetches JSON data from Wikidata.

**Data usage** — what the extension collects (anything leaving the device):
- Tick **Web history** only. Justification: when a domain is not in the bundled list and the Wikidata option is on, the domain name of the current tab (not the full URL, not page content) is sent to the Wikimedia Foundation's query service. Nothing is sent to the developer.
- Leave every other category unticked (no personal data, no authentication, no location, no website content, no financial, no health, no personal communications, no user activity).
- Certify all three statements: not sold to third parties; not used for purposes unrelated to the single purpose; not used for creditworthiness or lending.

**Privacy policy URL**: https://www.blockzero.ca/privacy-policy/canadafirst once live. Until then use https://github.com/BlockZero-Studio/canada-first/blob/main/PRIVACY.md — the dashboard accepts any public URL, and it can be changed later without a new review.

## Distribution tab
- Visibility: Public
- Regions: all
- Pricing: free

## Submit
Save draft → "Submit for review". Uncheck "Publish automatically after review" if you want to time the launch. First reviews for a `tabs` + host-permission extension typically take one to three business days.

## After approval
- Note the extension ID; add the Web Store link to README.md and the GitHub release.
- Edge Add-ons (free, same zip) is a 15-minute follow-up at https://partner.microsoft.com/dashboard/microsoftedge.
