#!/usr/bin/env node
// End-to-end checks for the directory UI. Requires Playwright:  npm i -D playwright  (or a global install)
// Usage: node tools/test-site.js [url]   default: file://<repo>/index.html
const path = require("path");
let chromium; try { ({ chromium } = require("playwright")); } catch (e) { ({ chromium } = require(path.join(process.env.PW_PATH || "/home/claude/test/node_modules", "playwright"))); }
const target = process.argv[2] || "file://" + path.join(__dirname, "..", "index.html");
let fails = 0;
const ok = (cond, msg) => { console.log((cond ? "PASS " : "FAIL ") + msg); if (!cond) fails++; };

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errs = [];
  page.on("pageerror", e => errs.push(e.message));
  page.on("console", m => { if (m.type() === "error" && !/ERR_FAILED|fonts/.test(m.text())) errs.push(m.text()); });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.goto(target);
  const meta = () => page.textContent("#resultMeta");
  const count = async () => parseInt(await meta(), 10);
  const cards = () => page.$$eval("#listingGrid .listing", n => n.length);
  const data = await page.evaluate(() => window.HABESHA_LISTINGS.filter(x => !["closed","duplicate"].includes(x.status)));
  const expect = f => data.filter(f).length;

  ok(await count() === data.length, `initial count ${await count()} equals visible data ${data.length}`);
  ok(await page.isHidden("#denomWrap"), "denomination hidden until Church selected");
  ok(await page.isDisabled("#dirCity"), "city disabled until state chosen");

  await page.selectOption("#dirState", "Ohio");
  ok(!(await page.isDisabled("#dirCity")), "city enabled after state");
  const ohCities = await page.$$eval("#dirCity option", o => o.map(x => x.value).filter(Boolean));
  const areaOf = x => x.metro || x.city;
  ok(ohCities.length === new Set(data.filter(x => x.state === "Ohio").map(areaOf)).size, "Ohio city list built from data: " + ohCities.join(", "));
  await page.selectOption("#dirCategory", "Church");
  ok(await page.isVisible("#denomWrap"), "denomination visible for Church");
  await page.selectOption("#dirDenomination", "Orthodox");
  const oo = expect(x => x.state === "Ohio" && x.category === "Church" && x.denomination === "Orthodox");
  ok(await count() === oo && oo > 0, `Ohio > Church > Orthodox shows ${await count()} (expected ${oo}, must be > 0)`);
  ok((await page.$$eval("#listingGrid .listing .type", n => n.map(x => x.textContent))).every(t => /Orthodox/.test(t)), "all Orthodox cards labelled Orthodox");
  await page.selectOption("#dirDenomination", "Protestant");
  const op = expect(x => x.state === "Ohio" && x.category === "Church" && x.denomination === "Protestant");
  ok(await count() === op && op > 0, `Ohio > Church > Protestant/Evangelical shows ${await count()} (expected ${op}, must be > 0)`);
  ok(page.url().includes("denomination=Protestant") && page.url().includes("state=Ohio"), "URL reflects filters");
  await page.selectOption("#dirDenomination", "Catholic");
  ok(await count() === expect(x => x.state === "Ohio" && x.denomination === "Catholic"), "Ohio Catholic count matches data (may be 0)");
  if (await count() === 0) ok(await page.isVisible("#listingGrid .empty"), "empty state shown for zero results");
  await page.selectOption("#dirCategory", "Restaurant");
  ok(await page.isHidden("#denomWrap") && (await page.inputValue("#dirDenomination")) === "", "denomination reset when leaving Church");

  if (ohCities.includes("Columbus")) {
    await page.selectOption("#dirCategory", "");
    await page.selectOption("#dirCity", "Columbus");
    ok(await count() === expect(x => x.state === "Ohio" && areaOf(x) === "Columbus"), "Ohio > Columbus count matches");
  }
  await page.click("#clearFilters");
  ok(await count() === data.length && (await page.inputValue("#dirState")) === "" && await page.isDisabled("#dirCity"), "Clear resets everything");

  for (const [st, cat] of [["Maryland","Restaurant"],["Virginia","Grocery"],["Georgia","Beauty"],["Texas","Auto"],["California","Professional"],["Washington","Healthcare"]]) {
    await page.selectOption("#dirState", st); await page.selectOption("#dirCategory", cat);
    const e = expect(x => x.state === st && x.category === cat);
    ok(await count() === e, `${st} + ${cat}: ${e}`);
  }
  await page.click("#clearFilters");

  await page.fill("#q", "Silver Spring");
  ok(await count() === expect(x => x.city === "Silver Spring"), "multi-word city search");
  await page.fill("#q", "churches ohio");
  ok(await count() === expect(x => x.category === "Church" && x.state === "Ohio"), "plural + state search 'churches ohio'");
  const aZip = data.find(x => x.zip);
  if (aZip) { await page.fill("#q", aZip.zip); ok(await count() >= 1, "ZIP search " + aZip.zip); }
  await page.fill("#q", "zzzznotathing"); ok(await page.isVisible("#listingGrid .empty"), "no-match empty state");
  await page.click("#clearFilters");

  await page.fill("#heroWhat", "orthodox church"); await page.selectOption("#heroState", "Ohio"); await page.click("#heroSearch button");
  ok((await page.inputValue("#dirCategory")) === "Church" && (await page.inputValue("#dirDenomination")) === "Orthodox" && (await page.inputValue("#dirState")) === "Ohio", "hero 'orthodox church' + Ohio maps to filters");
  await page.click("#clearFilters");

  // card integrity
  const bad = await page.$$eval("#listingGrid .listing a", as => as.filter(a => !/^(https?:|tel:\+1\d{10}$|mailto:)/.test(a.getAttribute("href"))).map(a => a.getAttribute("href")));
  ok(bad.length === 0, "all card links are http(s), tel:+1XXXXXXXXXX or mailto " + bad.slice(0, 3).join(" "));
  ok(await page.$$eval("#listingGrid .listing", n => n.every(c => c.querySelector(".badge") && c.querySelector(".meta-line"))), "every card shows status and last-checked line");

  // deep link
  await page.goto(target + "?state=Ohio&denomination=Orthodox");
  ok((await page.inputValue("#dirCategory")) === "Church" && await count() === oo, "deep link ?state=Ohio&denomination=Orthodox restores filters");
  await page.goto(target);

  // state explorer + coverage
  ok(await page.$$eval("#coverageGrid button", b => b.length) === 51, "coverage grid lists 50 states + DC");
  await page.selectOption("#stateExplorer", "Wyoming");
  const wy = expect(x => x.state === "Wyoming");
  if (!wy) ok(/No verified community listings yet/.test(await page.textContent("#stateSummary")), "empty state honest message");

  // language toggle
  await page.click("#langBtn");
  ok((await page.getAttribute("html", "lang")) === "am", "Amharic toggle sets lang=am");
  await page.click("#langBtn");

  // housing
  const hs = await page.evaluate(() => { const f = window.HabeshaHub.housingStatus, n = new Date(), td = Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()), iso = d => new Date(td - d * 864e5).toISOString().slice(0, 10);
    return [f({datePosted: iso(3), dateLastChecked: iso(3)}, td), f({datePosted: iso(20), dateLastChecked: iso(20)}, td), f({datePosted: iso(60), dateLastChecked: iso(60)}, td), f({datePosted: iso(2), dateLastChecked: iso(2), expires: iso(1)}, td)]; });
  ok(hs.join() === "active,recheck,expired,expired", "housing status logic " + hs.join());

  // mobile
  await page.setViewportSize({ width: 375, height: 800 });
  ok(await page.isVisible("#menuBtn") && await page.isHidden("#mainNav"), "mobile: menu button shown, nav collapsed");
  await page.click("#menuBtn"); ok(await page.isVisible("#mainNav"), "mobile: menu opens");
  ok(await page.isVisible("#langBtn"), "mobile: language button visible");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  ok(!overflow, "mobile: no horizontal scroll");

  ok(errs.length === 0, "no JS errors " + errs.join(" | "));
  await browser.close();
  console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
  process.exit(fails ? 1 : 0);
})();
