#!/usr/bin/env node
// Applies a research batch file (JSON) to directory-data.js.
// Batch format: { "date": "YYYY-MM-DD", "update": { "<id>": {field: value, ...} }, "add": [ {listing}, ... ] }
// A field set to null is removed. New listings must have unique ids.
// Usage: node tools/apply-updates.js tools/research/<batch>.json
const fs = require("fs");
const { loadData, writeData } = require("./lib");
const batch = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const d = loadData();
const byId = Object.fromEntries(d.listings.map(r => [r.id, r]));
let upd = 0, add = 0;
for (const [id, patch] of Object.entries(batch.update || {})) {
  const r = byId[id]; if (!r) { console.error("Unknown id " + id); process.exit(1); }
  for (const [k, v] of Object.entries(patch)) { if (v === null) delete r[k]; else r[k] = v; }
  upd++;
}
for (const r of batch.add || []) {
  if (byId[r.id]) { console.error("Duplicate id " + r.id); process.exit(1); }
  d.listings.push(r); byId[r.id] = r; add++;
}
if (batch.date) d.meta.updated = batch.date;
writeData(d);
console.log(`Updated ${upd}, added ${add}. Total ${d.listings.length}.`);
