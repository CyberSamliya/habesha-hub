# Launch remediation — October 26, 2026 (Eastern)

Baseline: main b665b827849e59029dbc830e995f051933cd088a. Reviewed the October 23 Drive report and current source.

## Implemented

- Removed 227 directory research-note fields and 208 research JSON copies. Public facts and stable IDs retained. The serializer excludes private notes, validation rejects them, and a dependency-free GitHub Actions check scans tracked JSON.
- Preserved the October 24 corrections: eight of the ten October 22 service listings are Needs verification; two remain Verified based on the previously recorded public-source evidence. Added explicit evidence classifications and a regression check. No new independent source or licensing verification is claimed.
- Removed a contradictory community-affiliation claim from the unverified E&D description. Clarified that language support alone does not establish community affiliation.
- Added Netlify rules keeping retired admin/SOC surfaces and research paths unavailable. The checked main branch contains no public Supabase client. This is containment, not a database RLS fix.
- Added a read-only database inventory query for the next access-control review.

## Verification

Data validator: 340 records, 284 verified, 35 community, 16 needs-review, three closed, two duplicate; zero errors. Existing warnings: unconfirmed church tradition for ca-santa-clara-ecf-san-jose; shared address tx-richardson-ehpa / tx-richardson-maaec; shared phone va-arlington-ecdc / va-arlington-enterprise-development-group.

Public-data regression and JavaScript syntax checks pass. Pre-change live GETs: admin.html, admin-login.html and soc-lab.html returned 404; directory-data.js returned 200 with 227 note fields. Post-change live GETs confirmed directory-data.js returns 200 with zero note fields; admin.html, admin-login.html, soc-lab.html and tools/research/2026-10-22-services.json return 404. The Public data security workflow passed for commit ba7ffb8. The broader browser workflow was still running at this checkpoint.

## Remaining release risks

1. **Database access control is NOT confirmed.** Connected Supabase project yfzydixypuronzoeargv reports INACTIVE; the read-only catalog query failed with “Database is possibly not accessible at the moment.” No policies were guessed or applied. Before restoring database-backed features, inspect all exposed schemas, policies, grants, views, functions, storage and security advisors; test anonymous access, ordinary users, cross-user access and authorized administrators. Removing a page does not protect the API. Prior exposure cannot be ruled out.
2. **History and branches still contain old notes.** This commit cleans the current tree only. Public Git history, other branches, clones, caches and old deploys can retain the content. Complete historical erasure requires a separately coordinated rewrite and cleanup, and cannot recall third-party copies. Other research fields/prose have not been certified free of sensitive content.
3. **Evidence remains incomplete.** Eight service listings remain explicitly unverified. The two retained Verified records have not received new independent evidence or professional-license checks during this remediation. Most September records still need freshness review. Resolve the three validation warnings above.
4. **Live spot checks passed; coverage is limited.** The directory note cleanup and the five URLs above were checked live. This does not verify every historical URL, alternate hostname, cached response or browser workflow.
5. **Other report items are outside this patch and remain unverified:** Community Care preview destination; Stripe payout readiness and personal support contacts; private submission receipt/review operations; paid placement labeling and expiry on the live deployment; Search Console; trademark/name conflict; fluent Amharic and physical-device/accessibility acceptance. Do not treat the October 23 checklist as current proof of completion.

Do not enable the Supabase admin interface or announce unrestricted launch while item 1 remains unresolved. A limited directory-only launch still requires live deployment verification and acceptance of the historical-content risk.
