'use strict';
const fs = require('fs'), cp = require('child_process'), assert = require('assert/strict');
const {loadData} = require('./lib');
const {listings} = loadData();
const files = cp.execFileSync('git', ['ls-files'], {encoding:'utf8'}).trim().split('\n');
function check(value, file) {
  if (!value || typeof value !== 'object') return;
  assert.ok(!Object.hasOwn(value, 'notes'), file + ': private research notes');
  Object.values(value).forEach(v => check(v, file));
}
listings.forEach(r => check(r, r.id));
files.filter(f => f.endsWith('.json')).forEach(f => check(JSON.parse(fs.readFileSync(f,'utf8')), f));
const cohort = listings.filter(r => r.detailsChecked === '2026-10-22');
assert.equal(cohort.length, 10, 'Retain all ten stable listing IDs');
assert.equal(cohort.filter(r => r.status === 'needs-review').length, 8);
for (const r of cohort) {
  assert.ok(r.connectionEvidence, r.id + ': record connection evidence');
  if (['language-only','unconfirmed'].includes(r.connectionEvidence)) assert.equal(r.status, 'needs-review');
}
for (const f of files.filter(f => /\.(html|js)$/.test(f) && !f.startsWith('tools/'))) {
  assert.ok(!/createClient\s*\(|\.supabase\.co|service_role/.test(fs.readFileSync(f,'utf8')), f + ': unexpected database client');
}
console.log('PASS: no private notes, ten retained records, eight unverified, no public database client');
