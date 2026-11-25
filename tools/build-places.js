#!/usr/bin/env node
// Builds data/places/<CC>.json and data/places/countries.json for the Family Hub join form,
// so every member's city and state or region can be checked against real places.
// Source: GeoNames (https://www.geonames.org), CC BY 4.0, via the "cities.json" npm package
// (all places with population over 1,000, plus regional capitals).
// Usage: npm pack cities.json && tar xzf cities.json-*.tgz && node tools/build-places.js package
'use strict';
const fs = require('fs'), path = require('path');
const src = process.argv[2];
if (!src) { console.error('Usage: node tools/build-places.js <path to unpacked cities.json package>'); process.exit(1); }
const cities = JSON.parse(fs.readFileSync(path.join(src, 'cities.json'), 'utf8'));
const admin1 = JSON.parse(fs.readFileSync(path.join(src, 'admin1.json'), 'utf8'));
const regionName = new Map(admin1.map(a => [a.code, a.name]));
const OTHER = 'Other areas';

const byCountry = new Map();
for (const c of cities) {
  const name = String(c.name || '').trim();
  if (!name || !/^[A-Z]{2}$/.test(c.country)) continue;
  const reg = regionName.get(c.country + '.' + c.admin1) || OTHER;
  if (!byCountry.has(c.country)) byCountry.set(c.country, new Map());
  const regions = byCountry.get(c.country);
  if (!regions.has(reg)) regions.set(reg, new Set());
  regions.get(reg).add(name);
}

const out = path.join(__dirname, '..', 'data', 'places');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const names = new Intl.DisplayNames(['en'], { type: 'region' });
const countries = [];
let total = 0, bytes = 0;
const cmp = (a, b) => a.localeCompare(b, 'en');
for (const [cc, regions] of byCountry) {
  let name; try { name = names.of(cc); } catch (e) { name = cc; }
  if (!name || name === cc) continue;
  // [[region, [cities...]], ...]; "Other areas" last. A country whose places have no
  // regions at all (for example Singapore) has a single "Other areas" entry.
  const list = [...regions].sort(([a], [b]) => (a === OTHER) - (b === OTHER) || cmp(a, b))
    .map(([r, set]) => [r, [...set].sort(cmp)]);
  const json = JSON.stringify({ country: name, regions: list });
  fs.writeFileSync(path.join(out, cc + '.json'), json);
  countries.push([cc, name]);
  total += list.reduce((n, [, c]) => n + c.length, 0); bytes += json.length;
}
countries.sort((a, b) => cmp(a[1], b[1]));
fs.writeFileSync(path.join(out, 'countries.json'), JSON.stringify(countries));
fs.writeFileSync(path.join(out, 'LICENSE.txt'),
  'Place names in this folder come from GeoNames (https://www.geonames.org),\n' +
  'licensed under Creative Commons Attribution 4.0 (https://creativecommons.org/licenses/by/4.0/).\n' +
  'Built by tools/build-places.js from the "cities.json" npm package.\n');
console.log(countries.length + ' countries, ' + total + ' places, ' + (bytes / 1e6).toFixed(1) + ' MB');
