# Habesha Hub

Habesha Hub is a community-maintained discovery and resource platform for Ethiopian and Habesha communities across the United States.

## Structure

- `index.html` — interface, search, state explorer, resources and contribution flows.
- `directory-data.js` — community directory records and verification status.

## Adding a listing

Add an object to `window.HABESHA_LISTINGS` in `directory-data.js` with `name`, `category`, `city`, `state`, `address`, and `status`.

Status values:
- `verified` — independently reviewed against a reliable current source.
- `community` — community submitted/listed but not independently verified.
- `needs-review` — legacy or incomplete listing that needs confirmation.

## Trust rules

1. Never invent listings to make a state look complete.
2. Show an honest empty state where coverage is missing.
3. Prefer official business or organization sources when verifying details.
4. Keep a correction path available for listings.
5. Government and immigration information should link to official sources.
6. Do not present community information as individualized legal, immigration, or benefits advice.

## Roadmap

Expand verified listings city by city; add business submission/claim workflow; create dedicated state/city pages; add events and organizations; expand English/Amharic localization; add structured data and sitemap as content grows.
