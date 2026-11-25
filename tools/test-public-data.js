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
// One reviewed exception, approved by the site owner on November 25, 2026 (see
// security/RELEASE-RISKS.md): the Family Hub page reads public lesson uploads and lets admins
// upload, using the publishable key only. Access is enforced by supabase/family-hub-setup.sql.
// Every other page must still have no database client.
const DB_ALLOWED = new Set(['family-hub.js', 'family-hub-data.js', 'family-hub.html']);
for (const f of files.filter(f => /\.(html|js)$/.test(f) && !f.startsWith('tools/'))) {
  const src = fs.readFileSync(f,'utf8');
  assert.ok(!/createClient\s*\(|service_role|sb_secret_/.test(src), f + ': unexpected database client or secret key');
  if (!DB_ALLOWED.has(f)) assert.ok(!/\.supabase\.co/.test(src), f + ': unexpected database client');
}
{
  const data = fs.readFileSync('family-hub-data.js','utf8');
  const key = (data.match(/key:\s*'([^']*)'/) || [])[1];
  assert.ok(key === '' || /^sb_publishable_[A-Za-z0-9_-]+$/.test(key), 'family-hub-data.js: only a publishable key may be used');
  assert.ok(!/eyJ[A-Za-z0-9_-]{10,}\./.test(data), 'family-hub-data.js: no JWT keys');
}
console.log('PASS: no private notes, ten retained records, eight unverified, no database client outside the reviewed Family Hub uploads');
