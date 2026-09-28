// Shared helpers for Habesha Hub maintenance scripts (Node.js, no dependencies).
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.join(__dirname, "..");
const DATA_FILE = path.join(ROOT, "directory-data.js");

function loadData(file = DATA_FILE) {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(file, "utf8"), ctx, { filename: file });
  return { listings: ctx.window.HABESHA_LISTINGS || [], housing: ctx.window.HABESHA_HOUSING || [], meta: ctx.window.HABESHA_META || {}, labels: ctx.window.HABESHA_STATUS_LABELS || {} };
}

const FIELD_ORDER = ["id","name","altNames","category","subcategory","denomination","address","city","state","zip","phone","website","social","mapsUrl","source","secondSource","status","verifiedDate","publicNote","notes","privacy","keywords"];
function orderRecord(r) {
  const o = {};
  FIELD_ORDER.forEach(k => { if (r[k] !== undefined && r[k] !== "" && !(Array.isArray(r[k]) && !r[k].length)) o[k] = r[k]; });
  Object.keys(r).forEach(k => { if (!(k in o) && r[k] !== undefined && r[k] !== "" && !k.startsWith("_")) o[k] = r[k]; });
  return o;
}

const HEADER = `// Habesha Hub community directory data (schema v2)
// One listing per line. Edit carefully, then run:  node tools/validate-data.js
//
// Fields: id (stable, never reuse), name, altNames[], category, subcategory, denomination (churches only:
// Orthodox | Protestant | Catholic, leave empty if not confirmed), address (street only), city, state (full name),
// zip, phone (public business line only), website, social, mapsUrl, source (URL used to verify),
// secondSource, status, verifiedDate (YYYY-MM-DD the details were last checked), publicNote (shown on card),
// notes (internal, not shown), privacy ("limited" hides street/phone for individual providers), keywords[].
//
// status: verified | community | needs-review | temporarily-closed | closed | duplicate
//   verified            current official or strong independent source confirms name, location and Ethiopian connection
//   community           publicly listed (directory, social page) but not independently confirmed
//   needs-review        incomplete, conflicting or unconfirmed details; keep until evidence decides
//   temporarily-closed  shown with a warning
//   closed / duplicate  kept for audit history, hidden from the site
`;

function writeData({ listings, housing, meta, labels }, file = DATA_FILE) {
  const lines = listings.map(r => "  " + JSON.stringify(orderRecord(r)));
  const out = HEADER +
    "window.HABESHA_META = " + JSON.stringify(meta) + ";\n\n" +
    "window.HABESHA_LISTINGS = [\n" + lines.join(",\n") + "\n];\n\n" +
    "// Housing posts: see README (Housing). Never include a private street address.\n" +
    "window.HABESHA_HOUSING = " + (housing.length ? "[\n" + housing.map(h => "  " + JSON.stringify(h)).join(",\n") + "\n]" : "[]") + ";\n\n" +
    "window.HABESHA_STATUS_LABELS = " + JSON.stringify(labels, null, 1) + ";\n";
  fs.writeFileSync(file, out);
}

function slug(s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/['’.]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

module.exports = { loadData, writeData, slug, ROOT, DATA_FILE };
