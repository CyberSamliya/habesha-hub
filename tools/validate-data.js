#!/usr/bin/env node
// Validates directory-data.js. Exit code 1 on errors (used by GitHub Actions).
// Usage: node tools/validate-data.js [--strict]   (--strict also fails on warnings)
const { loadData } = require("./lib");
const { listings, housing, labels } = loadData();
const STATES = ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","District of Columbia","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"];
const CATS = ["Restaurant","Grocery","Shopping","Church","Beauty","Auto","Home","Professional","Healthcare","Childcare","Community"];
const STATUSES = Object.keys(labels);
const DENOMS = ["Orthodox","Protestant","Catholic"];
const errors = [], warnings = [];
const E = (r, m) => errors.push(`${r.id || r.name}: ${m}`), W = (r, m) => warnings.push(`${r.id || r.name}: ${m}`);
const ids = new Set(), byKey = {}, byAddr = {}, byPhone = {};
const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/\b(the|ethiopian|orthodox|tewahedo|church|restaurant|market|grocery|and|of|eotc|st|saint|kidus|kidist|kedus|debre)\b/g, "").replace(/[^a-z0-9]/g, "");
const today = new Date().toISOString().slice(0, 10);

listings.forEach(r => {
  if (!r.id || !/^[a-z0-9-]+$/.test(r.id)) E(r, "missing or malformed id");
  if (ids.has(r.id)) E(r, "duplicate id"); ids.add(r.id);
  ["name","category","city","state","status"].forEach(f => { if (!r[f]) E(r, `missing ${f}`); });
  if (!STATES.includes(r.state)) E(r, `unknown state "${r.state}"`);
  if (!CATS.includes(r.category)) E(r, `unknown category "${r.category}"`);
  if (!STATUSES.includes(r.status)) E(r, `unknown status "${r.status}"`);
  if (r.denomination && !DENOMS.includes(r.denomination)) E(r, `unknown denomination "${r.denomination}"`);
  if (r.denomination && r.category !== "Church") E(r, "denomination set on a non-church listing");
  if (r.category === "Church" && !r.denomination) W(r, "church tradition not confirmed (shown as 'not yet confirmed')");
  ["website","social","mapsUrl","source","secondSource"].forEach(f => { if (r[f] && !/^https:\/\/|^http:\/\//.test(r[f])) E(r, `${f} is not an http(s) URL`); });
  if (r.zip && !/^\d{5}$/.test(r.zip)) E(r, "zip must be 5 digits");
  if (r.phone && r.phone.replace(/\D/g, "").length !== 10) E(r, "phone should be a 10-digit US number");
  if (r.verifiedDate && !/^\d{4}-\d{2}-\d{2}$/.test(r.verifiedDate)) E(r, "verifiedDate must be YYYY-MM-DD");
  if (r.verifiedDate && r.verifiedDate > today) E(r, "verifiedDate is in the future");
  if (r.status === "verified") {
    if (!r.source) E(r, "verified listing has no source URL");
    if (!r.verifiedDate) E(r, "verified listing has no verifiedDate");
    if (!r.address && r.privacy !== "limited" && r.category !== "Community") W(r, "verified listing has no street address");
  }
  if (!["closed","duplicate"].includes(r.status)) {
    if (!r.source) W(r, "no source recorded");
    if (r.verifiedDate) { const age = (Date.parse(today) - Date.parse(r.verifiedDate)) / 864e5; if (age > 365) W(r, `last checked ${Math.round(age)} days ago`); }
    const k = r.state + "|" + norm(r.name); (byKey[k] = byKey[k] || []).push(r.id);
    if (r.address) { const a = r.state + "|" + r.city.toLowerCase() + "|" + r.address.toLowerCase().replace(/[^a-z0-9]/g, ""); (byAddr[a] = byAddr[a] || []).push(r.id); }
    if (r.phone) { const p = r.phone.replace(/\D/g, ""); (byPhone[p] = byPhone[p] || []).push(r.id); }
  }
  if (r.status === "duplicate" && !/duplicate of/i.test(r.notes || "")) W(r, "duplicate without 'Duplicate of <id>' note");
});
Object.values(byKey).filter(v => v.length > 1).forEach(v => warnings.push(`possible duplicate (similar name): ${v.join(", ")}`));
Object.values(byAddr).filter(v => v.length > 1).forEach(v => warnings.push(`possible duplicate (same address): ${v.join(", ")}`));
Object.values(byPhone).filter(v => v.length > 1).forEach(v => warnings.push(`possible duplicate (same phone): ${v.join(", ")}`));

housing.forEach(h => {
  ["id","type","city","state","datePosted","dateLastChecked","source"].forEach(f => { if (!h[f]) E(h, `housing missing ${f}`); });
  if (/\d+\s+\w+\s+(st|street|ave|avenue|rd|road|dr|drive|ln|lane|ct|court|blvd)\b/i.test(h.area || "")) E(h, "housing area looks like a street address (privacy)");
});

const count = s => listings.filter(r => r.status === s).length;
console.log(`Listings: ${listings.length} (verified ${count("verified")}, community ${count("community")}, needs-review ${count("needs-review")}, temporarily-closed ${count("temporarily-closed")}, closed ${count("closed")}, duplicate ${count("duplicate")}); housing: ${housing.length}`);
warnings.forEach(w => console.log("WARN  " + w));
errors.forEach(e => console.log("ERROR " + e));
console.log(`${errors.length} error(s), ${warnings.length} warning(s)`);
process.exit(errors.length || (process.argv.includes("--strict") && warnings.length) ? 1 : 0);
