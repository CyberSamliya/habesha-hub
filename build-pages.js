#!/usr/bin/env node
// Builds one static, crawlable page per state that has listings (<slug>.html in the site root, e.g. ohio.html),
// refreshes sitemap.xml, and writes the state link list into the index.html footer.
// Run after every data change:  node tools/build-pages.js
// No dependencies. Pages contain no JavaScript; the full search lives on the home page.
"use strict";
const fs = require("fs"), path = require("path");
const { loadData } = require("./lib.js");
const ROOT = path.join(__dirname, "..");
const SITE = "https://cybersamliya.github.io/habesha-hub/";
const HIDDEN = new Set(["closed", "duplicate"]);

const CATS = [
  ["Restaurant", "Restaurants & Cafés", "Restaurant"],
  ["Grocery", "Groceries & Markets", "GroceryStore"],
  ["Shopping", "Clothing & Shopping", "Store"],
  ["Church", "Churches", "Church"],
  ["Beauty", "Barbers & Beauty", "BeautySalon"],
  ["Auto", "Auto & Mechanics", "AutoRepair"],
  ["Home", "Home Services", "HomeAndConstructionBusiness"],
  ["Professional", "Professional Services", "ProfessionalService"],
  ["Healthcare", "Healthcare", "MedicalBusiness"],
  ["Childcare", "Children & Family", "ChildCare"],
  ["Community", "Community & Culture", "Organization"]
];
const DENOMS = [["Orthodox", "Ethiopian Orthodox Tewahedo"], ["Protestant", "Ethiopian Protestant / Evangelical"], ["Catholic", "Ethiopian Catholic"], ["", "Church tradition not yet confirmed"]];
const STATUS = { "verified": "Verified", "community": "Community listed", "needs-review": "Needs verification", "temporarily-closed": "Temporarily closed" };
const ORDER = { "verified": 0, "community": 1, "needs-review": 2, "temporarily-closed": 3 };
const ABBR = {"Alabama":"AL","Alaska":"AK","Arizona":"AZ","Arkansas":"AR","California":"CA","Colorado":"CO","Connecticut":"CT","Delaware":"DE","District of Columbia":"DC","Florida":"FL","Georgia":"GA","Hawaii":"HI","Idaho":"ID","Illinois":"IL","Indiana":"IN","Iowa":"IA","Kansas":"KS","Kentucky":"KY","Louisiana":"LA","Maine":"ME","Maryland":"MD","Massachusetts":"MA","Michigan":"MI","Minnesota":"MN","Mississippi":"MS","Missouri":"MO","Montana":"MT","Nebraska":"NE","Nevada":"NV","New Hampshire":"NH","New Jersey":"NJ","New Mexico":"NM","New York":"NY","North Carolina":"NC","North Dakota":"ND","Ohio":"OH","Oklahoma":"OK","Oregon":"OR","Pennsylvania":"PA","Rhode Island":"RI","South Carolina":"SC","South Dakota":"SD","Tennessee":"TN","Texas":"TX","Utah":"UT","Vermont":"VT","Virginia":"VA","Washington":"WA","West Virginia":"WV","Wisconsin":"WI","Wyoming":"WY"};

const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const httpUrl = u => (typeof u === "string" && /^https?:\/\//i.test(u) ? u : "");
const telHref = p => { let d = String(p || "").replace(/[^0-9+]/g, ""); if (d.length === 10) d = "+1" + d; else if (d.length === 11 && d[0] === "1") d = "+" + d; return d.length >= 11 ? "tel:" + d : ""; };
const area = x => x.metro || x.city;
const cityLine = x => [x.city, (ABBR[x.state] || x.state) + (x.zip ? " " + x.zip : "")].filter(Boolean).join(", ");
const mapsHref = x => httpUrl(x.mapsUrl) || "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(x.address ? x.name + ", " + x.address + ", " + cityLine(x) : x.name + " " + x.city + " " + x.state);
const fmtDate = iso => { const p = String(iso || "").split("-"); if (p.length !== 3) return iso || ""; return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }); };
const sortRows = (a, b) => area(a).localeCompare(area(b)) || (ORDER[a.status] ?? 5) - (ORDER[b.status] ?? 5) || a.name.localeCompare(b.name);
const disp = s => (s === "District of Columbia" ? "Washington, DC" : s);
const listWords = arr => arr.length <= 1 ? arr.join("") : arr.slice(0, -1).join(", ") + " and " + arr[arr.length - 1];

function card(x) {
  const limited = x.privacy === "limited", isChurch = x.category === "Church";
  const type = isChurch ? (DENOMS.find(d => d[0] === (x.denomination || ""))[1]) : (x.subcategory || "");
  const tel = telHref(x.phone), web = httpUrl(x.website) || httpUrl(x.social), src = httpUrl(x.source), src2 = httpUrl(x.secondSource);
  const addr = limited || !x.address ? esc(cityLine(x)) : esc(x.address) + "<br>" + esc(cityLine(x));
  const acts = [];
  if (tel && !limited) acts.push(`<a class="pri" href="${esc(tel)}">Call</a>`);
  if (web) acts.push(`<a class="sec" href="${esc(web)}" target="_blank" rel="noopener">Website</a>`);
  if (!limited) acts.push(`<a class="sec" href="${esc(mapsHref(x))}" target="_blank" rel="noopener">${x.address ? "Directions" : "Map search"}</a>`);
  const meta = (x.verifiedDate ? "Last checked " + esc(fmtDate(x.verifiedDate)) : "Not yet checked") +
    (src ? ` · <a href="${esc(src)}" target="_blank" rel="noopener nofollow">Source</a>` : "") +
    (src2 ? ` · <a href="${esc(src2)}" target="_blank" rel="noopener nofollow">2nd source</a>` : "");
  return `<article class="listing" id="l-${esc(x.id)}">` +
    (type ? `<span class="type">${esc(type)}</span>` : "") +
    `<h3>${esc(x.name)}</h3><address>${addr}</address>` +
    (x.phone && !limited ? `<p><a href="${esc(tel)}">${esc(x.phone)}</a></p>` : "") +
    (x.publicNote ? `<p class="note">${esc(x.publicNote)}</p>` : "") +
    `<div><span class="badge s-${esc(x.status)}">${esc(STATUS[x.status] || x.status)}</span></div>` +
    `<span class="meta-line">${meta}</span>` +
    (acts.length ? `<div class="listing-actions">${acts.join("")}</div>` : "") + `</article>`;
}

function schemaItem(x, i) {
  const c = CATS.find(k => k[0] === x.category), limited = x.privacy === "limited";
  const o = { "@type": c ? c[2] : "LocalBusiness", "name": x.name };
  const addr = { "@type": "PostalAddress", "addressLocality": x.city, "addressRegion": ABBR[x.state] || x.state, "addressCountry": "US" };
  if (x.address && !limited) addr.streetAddress = x.address;
  if (x.zip && !limited) addr.postalCode = x.zip;
  o.address = addr;
  if (x.phone && !limited) o.telephone = x.phone;
  if (httpUrl(x.website)) o.url = x.website;
  if (httpUrl(x.social)) o.sameAs = [x.social];
  return { "@type": "ListItem", "position": i + 1, "item": o };
}

function page(state, rows, allStates, updated) {
  const name = disp(state), s = slug(state), url = SITE + s + ".html";
  const present = CATS.filter(c => rows.some(r => r.category === c[0]));
  const areas = {}; rows.forEach(r => { areas[area(r)] = (areas[area(r)] || 0) + 1; });
  const topAreas = Object.keys(areas).sort((a, b) => areas[b] - areas[a] || a.localeCompare(b));
  const verified = rows.filter(r => r.status === "verified").length;
  const churches = rows.filter(r => r.category === "Church");
  const nouns = present.map(c => c[1].split(" & ")[0].toLowerCase());
  const title = `Ethiopian ${listWords(nouns.slice(0, 3).map(n => n.replace("cafés", "cafes")))} in ${name} | Habesha Hub`;
  const desc = `${rows.length} Ethiopian and Habesha ${rows.length === 1 ? "listing" : "listings"} in ${name}` +
    (topAreas.length ? ` (${topAreas.slice(0, 4).join(", ")})` : "") + `: ${present.map(c => c[1].toLowerCase()).join(", ")}. Each listing shows its source and the date it was last checked.`;
  let body = "";
  for (const c of present) {
    const list = rows.filter(r => r.category === c[0]).sort(sortRows);
    body += `<section class="state-cat" id="${slug(c[0])}"><h2>${esc(c[1])} <span class="count-pill">${list.length}</span></h2>`;
    if (c[0] === "Church") {
      for (const d of DENOMS) {
        const sub = list.filter(r => (r.denomination || "") === d[0]);
        if (sub.length) body += `<h3 class="denom-h" id="church-${slug(d[0] || "unconfirmed")}">${esc(d[1])} (${sub.length})</h3><div class="grid listings">${sub.map(card).join("")}</div>`;
      }
    } else body += `<div class="grid listings">${list.map(card).join("")}</div>`;
    body += `</section>`;
  }
  const jumps = present.map(c => `<a href="#${slug(c[0])}">${esc(c[1])} (${rows.filter(r => r.category === c[0]).length})</a>`).join("");
  const cityChips = topAreas.sort().map(a => `<a class="chip" href="./?state=${encodeURIComponent(state)}&amp;city=${encodeURIComponent(a)}#directory">${esc(a)} (${areas[a]})</a>`).join("");
  const others = allStates.map(o => o === state ? `<li aria-current="page"><strong>${esc(o)}</strong></li>` : `<li><a href="${slug(o)}.html">${esc(o)}</a></li>`).join("");
  const ld = { "@context": "https://schema.org", "@graph": [
    { "@type": "BreadcrumbList", "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Habesha Hub", "item": SITE },
      { "@type": "ListItem", "position": 2, "name": "States", "item": SITE + "#states" },
      { "@type": "ListItem", "position": 3, "name": state, "item": url }] },
    { "@type": "CollectionPage", "@id": url, "url": url, "name": title, "description": desc, "isPartOf": { "@id": SITE + "#website" }, "dateModified": updated },
    { "@type": "ItemList", "name": `Verified Ethiopian community listings in ${name}`, "numberOfItems": verified,
      "itemListElement": rows.filter(r => r.status === "verified").sort(sortRows).map(schemaItem) }] };
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'none'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; base-uri 'self'; form-action 'self'; object-src 'none'">
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#173b2c">
<link rel="canonical" href="${url}">
<meta property="og:site_name" content="Habesha Hub">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3E%3Crect width='10' height='30' fill='%231f6a45'/%3E%3Crect x='10' width='10' height='30' fill='%23e1b53e'/%3E%3Crect x='20' width='10' height='30' fill='%23a83d2c'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/styles.css?v=20260929">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
</head>
<body class="state-page">
<a class="skip" href="#main">Skip to main content</a>
<header><div class="wrap nav"><a class="brand" href="./"><span class="mark" aria-hidden="true"></span>Habesha Hub</a><a class="btn secondary" href="./?state=${encodeURIComponent(state)}#directory">Search and filter</a></div></header>
<main id="main">
<section class="state-hero"><div class="wrap">
 <div class="crumbs" role="navigation" aria-label="Breadcrumb"><a href="./">Home</a> › <a href="./#states">States</a> › <span aria-current="page">${esc(state)}</span></div>
 <h1>Ethiopian &amp; Habesha community in ${esc(name)}</h1>
 <p>${rows.length} ${rows.length === 1 ? "listing" : "listings"} (${verified} verified)${churches.length ? `, including ${churches.length} ${churches.length === 1 ? "church" : "churches"}` : ""}. Every listing shows where the information came from and when it was last checked. Call ahead before visiting.</p>
 <div class="jump">${jumps}</div>
 <h2 class="sub">Cities and metros</h2><div class="chips">${cityChips}</div>
</div></section>
<div class="wrap state-body">
${body}
<div class="notice"><strong>Know a place we missed or something that changed?</strong> Use <a href="./#contribute">Add a listing or report a correction</a> on the home page. Submissions are reviewed before they appear.</div>
</div>
</main>
<footer><div class="wrap">
 <div class="state-links" role="navigation" aria-labelledby="otherStates"><h2 id="otherStates">Ethiopian community in other states</h2><ul>${others}</ul></div>
 <p class="foot-note">© Habesha Hub, a community project. Directory data updated ${esc(updated)}. <a href="./">Back to the full directory</a></p>
</div></footer>
</body>
</html>
`;
}

function main() {
  const { listings, meta } = loadData();
  const rows = listings.filter(r => !HIDDEN.has(r.status));
  const updated = meta.updated || new Date().toISOString().slice(0, 10);
  const byState = {};
  rows.forEach(r => (byState[r.state] = byState[r.state] || []).push(r));
  const states = Object.keys(byState).sort();
  // State pages live in the site root so they can be uploaded without folders.
  const dir = ROOT;
  const keep = new Set(states.map(s => slug(s) + ".html"));
  for (const s of Object.keys(ABBR)) { const f = slug(s) + ".html"; if (!keep.has(f) && fs.existsSync(path.join(dir, f))) { fs.unlinkSync(path.join(dir, f)); console.log("Removed " + f + " (no active listings)"); } }
  for (const s of states) fs.writeFileSync(path.join(dir, slug(s) + ".html"), page(s, byState[s], states, updated));

  const urls = [`  <url><loc>${SITE}</loc><lastmod>${updated}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>`]
    .concat(states.map(s => `  <url><loc>${SITE}${slug(s)}.html</loc><lastmod>${updated}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`));
  fs.writeFileSync(path.join(ROOT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`);

  const idx = path.join(ROOT, "index.html");
  const html = fs.readFileSync(idx, "utf8");
  const links = "<ul>" + states.map(s => `<li><a href="${slug(s)}.html">${esc(s)}</a></li>`).join("") + "</ul>";
  const out = html.replace(/<!--STATE_LINKS-->[\s\S]*?<!--\/STATE_LINKS-->/, `<!--STATE_LINKS-->${links}<!--/STATE_LINKS-->`);
  if (out === html && !html.includes(links)) console.warn("WARN index.html has no STATE_LINKS markers");
  fs.writeFileSync(idx, out);
  console.log(`Built ${states.length} state pages, sitemap with ${urls.length} URLs.`);
}
main();
