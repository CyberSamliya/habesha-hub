// Shared shell + static listing pages. Called at the end of build-pages.js; idempotent.
//  1. puts the shared header, web fonts and shell.css on every page except the homepage
//  2. writes one static, crawlable profile per listing to places/<id>.html
//  3. fills the homepage counters so they are right before JavaScript runs
// Links stay relative (works on Netlify and under the GitHub Pages /habesha-hub/ path).
'use strict';
const fs = require('fs'), path = require('path');
const { loadData } = require('./lib');

const V = '20261116-shell2';
// Production origin for canonical/OG/schema on places/ pages. The Netlify build only rewrites
// the GitHub Pages URL in top-level files, so these pages must name the real domain directly.
const PROD = 'https://habeshahubusa.com/';
const STATUS = { verified: 'Verified', community: 'Community listed', 'needs-review': 'Needs verification', 'temporarily-closed': 'Temporarily closed' };
const CAT = { Restaurant: 'Restaurants & Cafés', Grocery: 'Groceries & Markets', Shopping: 'Clothing & Shopping', Church: 'Churches & Faith', Beauty: 'Barbers & Beauty', Auto: 'Auto & Mechanics', Home: 'Home Services', Professional: 'Professional Services', Healthcare: 'Healthcare', Childcare: 'Children & Family', Community: 'Community & Culture' };
const SCHEMA = { Restaurant: 'Restaurant', Grocery: 'GroceryStore', Shopping: 'Store', Church: 'Church', Beauty: 'BeautySalon', Auto: 'AutoRepair', Home: 'HomeAndConstructionBusiness', Professional: 'ProfessionalService', Healthcare: 'MedicalBusiness', Childcare: 'ChildCare', Community: 'Organization' };
const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans+Ethiopic:wght@400;600;700&display=swap" rel="stylesheet">';
const NAV = [['index.html#directory', 'Directory'], ['index.html#states', 'Explore states'], ['events.html', 'Events'], ['daily-tools.html', 'Daily Life Tools'], ['resume.html', 'Free Resume Builder'], ['saved.html', 'Saved places'], ['contact.html', 'Contact']];
const SKIP = new Set(['index.html', 'googlebf1515838fda380e.html']);

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const http = u => /^https?:\/\//.test(u || '');
const slugState = s => s.toLowerCase().replace(/[^a-z]+/g, '-');
const fmt = d => { if (!/^\d{4}-\d{2}-\d{2}$/.test(d || '')) return 'Not yet checked'; const [y, m, day] = d.split('-').map(Number); return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }); };

function header(here, up) {
  return '<header class="hh-header"><div class="hh-nav"><a class="brand" href="' + up + 'index.html"><span class="mark" aria-hidden="true">ሀ</span>Habesha Hub</a>' +
    '<button class="hh-menu" id="shellMenu" type="button" aria-expanded="false" aria-controls="shellNav">Menu</button>' +
    '<nav id="shellNav" aria-label="Main navigation">' + NAV.map(([h, t]) => '<a href="' + up + h + '"' + (h === here ? ' aria-current="page"' : '') + '>' + t + '</a>').join('') +
    '<a class="hh-add-m" href="' + up + 'submission.html">+ Add a listing</a></nav>' +
    '<button type="button" class="lang" data-language-toggle>Switch to አማርኛ</button>' +
    '<a class="hh-add" href="' + up + 'submission.html">Add a listing</a></div></header>';
}

function applyShell(file, html) {
  if (/<header[\s>][\s\S]*?<\/header>/.test(html)) html = html.replace(/<header[\s>][\s\S]*?<\/header>/, header(file, ''));
  else html = html.replace(/(<body[^>]*>(?:\s*<a class="skip"[^>]*>[^<]*<\/a>)?)/, '$1' + header(file, ''));
  html = html.replace(/<body([^>]*)>/, (m, a) => /hh-shell/.test(a) ? m : /class="/.test(a) ? '<body' + a.replace(/class="/, 'class="hh-shell ') + '>' : '<body class="hh-shell"' + a + '>');
  html = html.replace(/<link rel="preconnect" href="https:\/\/fonts\.g[^>]*>/g, '')
    .replace(/<link href="https:\/\/fonts\.googleapis\.com\/css2[^>]*>/g, '')
    .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/g, '')
    .replace(/<link rel="stylesheet" href="shell\.css[^"]*">/g, '')
    .replace(/<\/head>/, FONTS + '<link rel="stylesheet" href="shell.css?v=' + V + '"></head>');
  html = html.replace(/(<meta http-equiv="Content-Security-Policy" content=")([^"]*)"/, (m, a, c) => {
    if (!/fonts\.googleapis\.com/.test(c)) c = c.replace(/style-src ([^;]*)/, 'style-src $1 https://fonts.googleapis.com');
    if (!/font-src/.test(c)) c += '; font-src https://fonts.gstatic.com';
    else if (!/fonts\.gstatic\.com/.test(c)) c = c.replace(/font-src ([^;]*)/, 'font-src $1 https://fonts.gstatic.com');
    return a + c + '"';
  });
  if (/site-shell\.js/.test(html)) html = html.replace(/src="site-shell\.js(\?v=[^"]*)?"/, 'src="site-shell.js?v=' + V + '"');
  else html = html.replace(/<\/body>/, '<script src="site-shell.js?v=' + V + '" defer></script></body>');
  return html
    .replace(/src="places\.js(\?v=[^"]*)?"/, 'src="places.js?v=' + V + '"')
    .replace(/(['"])listing(?:\.html)?\?id=([a-z0-9-]+)\1/g, '$1places/$2.html$1');
}

function profile(x, live, site, csp) {
  const up = '../', limited = x.privacy === 'limited', where = x.city + ', ' + x.state;
  const kind = x.subcategory || CAT[x.category] || 'Listing';
  const title = x.name + ' – ' + kind + ' in ' + where + ' | Habesha Hub';
  const intro = x.description || x.subcategory || 'Community directory listing.';
  const desc = (x.description || (kind + ' in ' + where + '.')) + ' ' + (STATUS[x.status] || 'Needs verification') + ' listing on Habesha Hub, last checked ' + fmt(x.detailsChecked || x.verifiedDate) + '.';
  const url = site + 'places/' + x.id + '.html';
  const btn = (t, h, ext) => '<a class="btn secondary" href="' + esc(h) + '"' + (ext ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + esc(t) + '</a>';
  const req = type => up + 'submission.html?' + new URLSearchParams({ type, id: x.id, name: x.name, city: x.city, state: x.state });
  const actions = [];
  if (x.phone && !limited) actions.push(btn('Call', 'tel:+1' + x.phone.replace(/\D/g, '')));
  if (http(x.website || x.social)) actions.push(btn('Website or contact page', x.website || x.social, true));
  if (x.address && !limited) actions.push(btn('Directions', 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(x.name + ', ' + x.address + ', ' + where), true));
  if (x.profile && /^[a-z0-9-]+\.html$/.test(x.profile)) actions.push(btn('Photos & menu', up + x.profile));
  actions.push('<button type="button" class="btn secondary" data-save-place>Save place</button>', '<button type="button" class="btn secondary" data-copy-link>Copy profile link</button>');
  const introAttrs = x.descriptionAm ? ' data-en="' + esc(x.description) + '" data-am="' + esc(x.descriptionAm) + '"' : ' lang="en"';
  const hoursAttrs = x.hoursAm ? ' data-en="' + esc(x.hours) + '" data-am="' + esc(x.hoursAm) + '"' : '';
  const related = live.filter(y => y.id !== x.id && y.category === x.category && y.state === x.state).slice(0, 3);
  const ld = { '@context': 'https://schema.org', '@type': SCHEMA[x.category] || 'LocalBusiness', name: x.name, url, description: intro,
    address: Object.assign({ '@type': 'PostalAddress', addressLocality: x.city, addressRegion: x.state, addressCountry: 'US' }, limited ? {} : { streetAddress: x.address || undefined, postalCode: x.zip || undefined }) };
  if (x.phone && !limited) ld.telephone = '+1-' + x.phone.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  if (http(x.website)) ld.sameAs = [x.website];
  const crumbs = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Habesha Hub', item: site },
    { '@type': 'ListItem', position: 2, name: x.state, item: site + slugState(x.state) + '.html' },
    { '@type': 'ListItem', position: 3, name: x.name, item: url }] };
  const json = o => JSON.stringify(o).replace(/</g, '\\u003c');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="strict-origin-when-cross-origin">${csp}
<title>${esc(title)}</title><meta name="description" content="${esc(desc.slice(0, 300))}">${x.status === 'needs-review' ? '<meta name="robots" content="noindex,follow">' : ''}
<link rel="canonical" href="${url}">
<meta property="og:site_name" content="Habesha Hub"><meta property="og:type" content="website"><meta property="og:title" content="${esc(x.name + ' | Habesha Hub')}"><meta property="og:description" content="${esc(desc.slice(0, 200))}"><meta property="og:url" content="${url}"><meta property="og:image" content="${site}assets/social-preview.png"><meta name="twitter:card" content="summary">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3E%3Crect width='10' height='30' fill='%231f6a45'/%3E%3Crect x='10' width='10' height='30' fill='%23e1b53e'/%3E%3Crect x='20' width='10' height='30' fill='%23a83d2c'/%3E%3C/svg%3E">
<link rel="stylesheet" href="../styles.css?v=20261024-featured">${FONTS}<link rel="stylesheet" href="../shell.css?v=${V}">
<script type="application/ld+json">${json(ld)}</script><script type="application/ld+json">${json(crumbs)}</script></head>
<body class="hh-shell"><a class="skip" href="#main">Skip to main content</a>${header('', up)}
<main id="main"><div class="wrap profile-wrap"><div id="profile" data-id="${esc(x.id)}">
<div class="profile-head"><a class="back-link" href="../${slugState(x.state)}.html">← All ${esc(x.state)} listings</a>
<p class="loc">${esc(where)} · ${esc(CAT[x.category] || x.category)}</p><h1>${esc(x.name)}</h1>
<p class="badge s-${esc(x.status)}">${esc(STATUS[x.status] || 'Needs verification')}</p>
<p${introAttrs}>${esc(intro)}</p></div>
<div class="profile-actions">${actions.join('')}</div><p id="profileStatus" role="status"></p>
<div class="profile-grid"><section><h2>Plan your visit</h2>${x.address && !limited ? '<address>' + esc(x.address + ', ' + where + ' ' + (x.zip || '')) + '</address>' : '<p>' + esc(where) + '</p><p>Contact the provider for the service location.</p>'}
${x.phone && !limited ? '<p><a href="tel:+1' + x.phone.replace(/\D/g, '') + '">' + esc(x.phone) + '</a></p>' : ''}
<h3>Hours</h3><p${hoursAttrs}>${esc(x.hours || 'Hours are not confirmed. Contact the provider before visiting.')}</p>
<h3>Services</h3>${x.services?.length ? '<ul>' + x.services.map(s => '<li>' + esc(s) + '</li>').join('') + '</ul>' : '<p>Confirm current services and prices directly with the provider.</p>'}
<h3>Language support</h3><p>${esc(x.languages?.join(', ') || 'Language availability is not confirmed. Ask the provider.')}</p></section>
<section><h2>Sources &amp; verification</h2><p>Last checked: ${esc(fmt(x.detailsChecked || x.verifiedDate))}</p>
<p>Verified means factual directory details were checked. It does not certify licensing, quality, safety or availability.</p>
${x.publicNote ? '<h3>Source note (original language)</h3><p lang="en">' + esc(x.publicNote) + '</p>' : ''}
<div class="profile-actions">${http(x.source) ? btn('Primary source', x.source, true) : ''}${http(x.secondSource) ? btn('Additional source', x.secondSource, true) : ''}</div>
<p>Professional licenses and insurance should be checked with the relevant authority before hiring.</p></section></div>
<section><h2>Keep this information accurate</h2><div class="profile-actions">${btn('Suggest a correction', req('correction'))}${btn('Claim this listing', req('claim'))}${btn('Request removal', req('remove'))}</div></section>
${related.length ? '<section><h2>Related places in ' + esc(x.state) + '</h2><ul>' + related.map(y => '<li><a href="' + y.id + '.html">' + esc(y.name) + '</a> · ' + esc(y.city) + '</li>').join('') + '</ul></section>' : ''}
</div></div></main><footer></footer>
<script src="../directory-data.js?v=20261022-quality"></script><script src="../places.js?v=${V}" defer></script><script src="../site-shell.js?v=${V}" defer></script><script src="../quality-i18n.js?v=20261027-resume" defer></script><script src="../bilingual.js?v=20261022-quality" defer></script>
</body></html>
`;
}

module.exports = function buildShell({ root, site }) {
  const read = f => fs.readFileSync(path.join(root, f), 'utf8');
  const write = (f, s) => { const p = path.join(root, f); fs.mkdirSync(path.dirname(p), { recursive: true }); if (!fs.existsSync(p) || fs.readFileSync(p, 'utf8') !== s) fs.writeFileSync(p, s); };
  const live = loadData().listings.filter(x => !['closed', 'duplicate'].includes(x.status));

  const pages = fs.readdirSync(root).filter(f => f.endsWith('.html') && !SKIP.has(f));
  for (const f of pages) write(f, applyShell(f, read(f)));

  let idx = read('index.html');
  const nums = { statListings: live.length, statVerified: live.filter(x => x.status === 'verified').length, statStates: new Set(live.map(x => x.state)).size, statCities: new Set(live.map(x => (x.metro || x.city) + '|' + x.state)).size };
  for (const [id, n] of Object.entries(nums)) idx = idx.replace(new RegExp('(<strong id="' + id + '"[^>]*>)[^<]*'), '$1' + n);
  write('index.html', idx.replace(/src="app\.js(\?v=[^"]*)?"/, 'src="app.js?v=' + V + '"'));

  const csp = read('listing.html').match(/<meta http-equiv="Content-Security-Policy" content="[^"]*">/)[0];
  const dir = path.join(root, 'places'), want = new Set(live.map(x => x.id + '.html'));
  if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir)) if (!want.has(f)) fs.rmSync(path.join(dir, f));
  for (const x of live) write('places/' + x.id + '.html', profile(x, live, PROD, csp));
  console.log(`Shared shell on ${pages.length} pages; ${live.length} static listing pages in places/.`);
};
