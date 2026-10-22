# Immediate audit fixes — October 22, 2026

- Repaired shared textarea construction across all six affected daily tools.
- Moved directory results directly after the hero, added Show results with a count and keyboard focus, and kept Clear secondary.
- Rebuilt state pages from the authoritative data; Ohio now has 36 listings. Latest check dates drive update labels without claiming a new business verification.
- Classified events using explicit timezone-aware end times, refreshing the archive while the page remains open.
- Corrected verified-first sorting (including the zero-rank fallback).
- Expanded Amharic navigation, search recovery, tool names, form labels, and submission instructions. Business names and user-entered records retain their original text.
- Added category coverage counts and distinct search/category/state empty results with reset and contribution actions.
- Added a real GitHub Actions workflow for data validation, generated-page consistency, and browser regression tests.

## Validation
Run npm install, npx playwright install chromium --only-shell, npm test, npm run validate, and npm run build.
Browser coverage includes all ten tools, saved entries and reload persistence, deletion, JSON/ICS exports, verified ordering, all populated state-page counts, language switching, expired events and timed transitions, search recovery, and 390/768/1280px layouts.

## External limitation
The embedded Google Form remains English; it is managed in Google Forms, outside this repository. The submission page states this and explains that Amharic responses are accepted. Human review of the new Amharic wording is recommended before calling the entire website fully bilingual. No new businesses, licensing claims, or event facts were invented.
