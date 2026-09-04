# Data notes — seed dataset (2026-09-04)

642 entries · 1,684 domains · CA 325 (ON 118, QC 92, BC 37, AB 27, MB 15, SK 7, NS 7, NB 7, NL 6, PE 4, YT 3, NU 1, NT 1) · US 215 · other 102.
29 Canadian-HQ entries have a non-CA ultimate parent (Rona→Sycamore, Kijiji→Adevinta, Skip→Prosus, MEC→Kingswood, Postmedia→Chatham, Nuvei→Advent, Walmart/Costco/Home Depot/Best Buy/Staples/TJX Canada, Imperial Oil→Exxon, Kobo→Rakuten, Wattpad→Naver, Labatt→AB InBev, Sleeman→Sapporo, Arc'teryx→Anta, Parkland→Sunoco…).

## Modelling conventions
- `country` = operating HQ; verdict uses `ultimate_parent.country`. Burger King/Popeyes are US-HQ with parent RBI (CA/ON). Circle K under Couche-Tard (QC). Shaw under Rogers (ON).
- **Province shown = the Canadian entity's own `province`** (PRD). The parent's province is used only when the entity is not Canadian or has no province (e.g. Burger King → RBI/ON). So WestJet shows AB even though Onex is in Toronto, and Radio-Canada shows QC.
- **Banks: operational / executive HQ**, not legal head office. BMO, RBC, Scotiabank, TD, CIBC = Toronto/ON; National Bank = Montréal/QC. Legal head offices (BMO/RBC Montréal, Scotia Halifax) are mentioned in `notes`.
- CBC (`cbc.ca`, `cbcmusic.ca`) is ON (Ottawa/Toronto); Radio-Canada (`radio-canada.ca`, `ohdio.ca`) is its own entry, QC (Montréal). Both under Government of Canada.
- HBC: private, IP now owned by Canadian Tire (2025); thebay.com/zellers.ca may be dormant.
- Governments/crowns grouped per jurisdiction (canada.ca, gouv.qc.ca, LCBO, SaskTel, BC Hydro…). Universities typed `government`.
- Haivision is in the seed because Wikidata maps `haivision.com` to its US subsidiary Kulabyte.

## Verified 2026-09-04 (web)
- Parkland → Sunoco LP (US): **closed 2025-10-31**, delisted from TSX.
- Northwestel → Sixty North Unity: **not closed**; still under Bell (BCE). Reverted parent to BCE.
- Dayforce → Thoma Bravo: **closed 2026-02-04**.
- Electronic Arts → PIF / Silver Lake / Affinity: **closed 2026-08-04**.
- Lightspeed: stayed public after its strategic review.
- Teck / Anglo American: approved by shareholders, **not closed** (CN/KR approvals pending, expected Sept 2026 – Mar 2027). Left independent.

## Still to verify (web-search only these)
1. Warner Bros. Discovery — CNN/HBO parenting may change.
2. Comcast → Versant spin (cnbc.com still under Comcast).
3. Axel Springer / KKR split.
4. TechCrunch → Regent? (still under Yahoo).
5. Federated Co-op `.crs` hostnames.
6. Molson Coors — US (Golden, CO) with dual-HQ note.
7. Temu — parent PDD (IE); consider CN for warning purposes.
8. Canada Goose / Roots / Later / Moose Knuckles / Flair — CA-controlled with foreign stakes.
9. Sunwing folded into WestJet.

## Known badge ambiguity
ISO country codes NL, NU, PE, SK, YT collide with province codes. An OTHER verdict shows them in grey (province badges are red), e.g. SkipTheDishes → grey `NL` (Netherlands). Consider a distinct treatment in v0.2.
