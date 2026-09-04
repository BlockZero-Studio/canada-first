# Data notes — seed dataset (2026-09-04)

640 entries · 1,683 domains · CA 323 (ON 117, QC 91, BC 37, AB 27, MB 15, SK 7, NS 7, NB 7, NL 6, PE 4, YT 3, NU 1, NT 1) · US 215 · other 102.
29 Canadian-HQ entries have a non-CA ultimate parent (Rona→Sycamore, Kijiji→Adevinta, Skip→Prosus, MEC→Kingswood, Postmedia→Chatham, Nuvei→Advent, Walmart/Costco/Home Depot/Best Buy/Staples/TJX Canada, Imperial Oil→Exxon, Kobo→Rakuten, Wattpad→Naver, Labatt→AB InBev, Sleeman→Sapporo, Arc'teryx→Anta…).

## Modelling conventions
- `country` = operating HQ; verdict uses `ultimate_parent.country`. Burger King/Popeyes are US-HQ with parent RBI (CA/ON). Circle K under Couche-Tard (QC). Shaw under Rogers (ON).
- HBC: private, IP now owned by Canadian Tire (2025); thebay.com/zellers.ca may be dormant.
- Governments/crowns grouped per jurisdiction (canada.ca, gouv.qc.ca, LCBO, SaskTel, BC Hydro…). Universities typed `government`.

## To verify (web-search only these)
1. Parkland → Sunoco (US) — assumed closed.
2. Northwestel → Sixty North Unity — closing unverified.
3. Dayforce → Thoma Bravo — marked private/US.
4. Electronic Arts → PIF/Silver Lake (SA) — marked private.
5. Teck / Anglo American — left independent.
6. Warner Bros. Discovery — CNN/HBO parenting may change.
7. Comcast → Versant spin (cnbc.com still under Comcast).
8. Axel Springer / KKR split.
9. TechCrunch → Regent? (still under Yahoo).
10. Federated Co-op `.crs` hostnames.
11. Banks: BMO=QC (legal HQ) vs RBC/Scotia=ON (operational) — pick one convention.
12. Molson Coors — US (Golden, CO) with dual-HQ note.
13. Temu — parent PDD (IE); consider CN for warning purposes.
14. Canada Goose / Roots / Later / Moose Knuckles / Flair — CA-controlled with foreign stakes.
15. Lightspeed — public (QC); take-private reports 2025.
16. Sunwing folded into WestJet.
17. **Radio-Canada** currently under CBC (ON) — split to own entry (QC, Montréal).
