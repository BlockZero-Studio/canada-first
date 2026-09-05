# CanadaFirst — to-do

## Before store submission
- [ ] Publish the privacy policy (`PRIVACY.md`, English + French) at https://www.blockzero.ca/privacy-policy/canadafirst — both the Chrome Web Store and App Store Connect fetch that URL.
- [ ] Create the GitHub repo (`canada-first`) and set `ISSUE_REPO` in `src/popup/popup.js`, which re-enables "Suggest a fix".
- [ ] Have counsel skim `PRIVACY.md`, especially the section 17 (outside-Québec) assessment.
- [ ] Rename the project folder from `maple-check` to `canada-first`.

## v0.2 backlog (from docs/PLAN-DAY1.md)
- [ ] In-page US warning banner (content script + `scripting` permission; the option is already hidden in Options).
- [ ] Chrome Web Store + App Store submission: 1024px icon, screenshots, developer name "BlockZero Innovations Inc.".
- [ ] Badge collision: ISO codes NL, NU, PE, SK, YT vs province codes (see docs/DATA-NOTES.md).
- [ ] Wikidata contains-match fallback (exact P856 only today; CONTAINS scan timed out at 65 s).
- [ ] Logos, Canadian alternatives.
- [ ] Remaining "still to verify" data items in docs/DATA-NOTES.md.
