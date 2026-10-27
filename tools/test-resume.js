// End-to-end checks for the Free Resume Builder (resume.html): template gallery, the 8-step
// questionnaire and its validation, drafts, writing helpers, accessibility, page width, privacy,
// and the content of the PDF, Word and plain-text downloads.
// Usage: node tools/test-resume.js     (needs the playwright and axe-core dev dependencies)
const fs = require("fs"), http = require("http"), path = require("path"), zlib = require("zlib"), assert = require("assert/strict");
const { chromium } = require("playwright");
const root = path.resolve(__dirname, ".."), mime = {".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml"};

// Read one file out of a .docx (zip) without extra dependencies.
function zipEntry(buf, name) {
  let eocd = buf.length - 22; while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  let p = buf.readUInt32LE(eocd + 16); const n = buf.readUInt16LE(eocd + 10);
  for (let i = 0; i < n; i++) {
    const method = buf.readUInt16LE(p + 10), size = buf.readUInt32LE(p + 20), nl = buf.readUInt16LE(p + 28), xl = buf.readUInt16LE(p + 30), cl = buf.readUInt16LE(p + 32), off = buf.readUInt32LE(p + 42);
    const fname = buf.toString("utf8", p + 46, p + 46 + nl);
    if (fname === name) { const start = off + 30 + buf.readUInt16LE(off + 26) + buf.readUInt16LE(off + 28), raw = buf.subarray(start, start + size); return (method === 8 ? zlib.inflateRawSync(raw) : raw).toString("utf8"); }
    p += 46 + nl + xl + cl;
  }
  return null;
}
// All text-drawing content from a PDF (inflates each content stream).
function pdfText(buf) {
  const s = buf.toString("latin1"), out = []; const re = /stream\r?\n([\s\S]*?)\r?\nendstream/g; let m;
  while ((m = re.exec(s))) { try { out.push(zlib.inflateSync(Buffer.from(m[1], "latin1")).toString("latin1")); } catch (e) { out.push(m[1]); } }
  return {content: out.join("\n"), pages: (s.match(/\/Type \/Page\b/g) || []).length};
}

(async () => {
  const server = http.createServer((req, res) => {
    let f = path.join(root, decodeURIComponent(req.url.split("?")[0])); if (req.url.split("?")[0].endsWith("/")) f = path.join(f, "index.html");
    if (!f.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(f, (e, b) => { res.writeHead(e ? 404 : 200, {"Content-Type": mime[path.extname(f)] || "text/html"}); res.end(e ? "Not found" : b); });
  }).listen(0, "127.0.0.1");
  await new Promise(r => server.on("listening", r));
  const url = "http://127.0.0.1:" + server.address().port, host = new URL(url).host;
  const browser = await chromium.launch(); let count = 0;
  const ok = (c, m) => { assert.ok(c, m); count++; console.log("PASS " + m); };
  try {
    const context = await browser.newContext({acceptDownloads: true});
    await context.addInitScript({path: require.resolve("axe-core/axe.min.js")});
    await context.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    const p = await context.newPage(), errors = [], requests = [];
    p.on("pageerror", e => errors.push(e.message));
    p.on("console", m => { if (m.type() === "error" && !/ERR_FAILED|fonts/.test(m.text())) errors.push(m.text()); });
    p.on("request", r => requests.push(r.url()));
    async function axe(label) {
      const v = await p.evaluate(async () => (await axe.run(document, {runOnly: {type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"]}})).violations.map(x => ({id: x.id, nodes: x.nodes.map(n => n.target)})));
      ok(!v.length, "WCAG automated scan: " + label + " " + JSON.stringify(v));
    }
    async function fits(label) {
      for (const width of [320, 390, 768, 1280]) {
        await p.setViewportSize({width, height: 900});
        ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "No sideways scrolling: " + label + " at " + width + "px");
      }
      await p.setViewportSize({width: 1280, height: 900});
    }
    const next = () => p.click("#nextBtn");
    const stepTitle = () => p.textContent("#stepTitle");
    // The live preview redraws shortly after typing stops.
    const live = async () => { await p.waitForTimeout(250); return p.textContent("#livePage"); };
    const errs = () => p.$$eval("#stepBody .err:not([hidden])", n => n.map(e => e.id.replace(/-err$/, "") + ": " + e.textContent));

    // Entry points: homepage nav pill + call to action, and the shared header on support pages.
    await p.goto(url + "/index.html");
    ok(await p.locator('#mainNav a[href="resume.html"]').textContent() === "Free Resume Builder", "Homepage menu has the Free Resume Builder link");
    ok((await p.textContent(".hh-resume-cta")).includes("Build Your Professional Resume — 100% Free"), "Homepage call to action uses the approved headline");
    ok((await p.textContent(".hh-resume-cta")).includes("Choose a professional template, enter your experience, and download your job-ready resume in minutes. No payment required."), "Homepage call to action uses the approved message");
    await p.goto(url + "/daily-tools.html");
    ok(await p.locator('header nav a[href="resume.html"]').count() === 1, "Support-page header links to the resume builder");

    // Gallery.
    await p.goto(url + "/resume.html"); await p.evaluate(() => localStorage.clear()); await p.reload();
    ok(await p.locator('header nav a[href="resume.html"]').getAttribute("aria-current") === "page", "Header marks the resume builder as the current page");
    ok(await p.locator(".tcard").count() === 5, "Five templates in the gallery");
    for (const name of ["Modern Professional", "Executive Leadership", "Technology & Cybersecurity", "Recent Graduate & Entry-Level", "Classic Professional"])
      ok(await p.locator(".tcard h3", {hasText: name}).count() === 1, "Template listed: " + name);
    ok(await p.locator(".tcard .thumb .rdoc").count() === 5, "Every card shows a real rendered document preview");
    ok(await p.isHidden("#builder"), "Questionnaire stays hidden until a template is chosen");
    await axe("template gallery"); await fits("template gallery");
    await p.locator('[data-template="executive"] button', {hasText: "Preview Template"}).click();
    ok(await p.locator("#previewDialog[open]").count() === 1 && (await p.textContent("#dialogPage")).includes("Daniel Haile"), "Full-size template preview opens with sample content");
    await axe("template preview dialog");
    await p.locator("#dialogFoot button", {hasText: "Use This Template"}).click();
    ok(await p.locator('[data-template="executive"].selected').count() === 1, "Chosen template shows the selected state");
    ok(await p.locator('[data-template="executive"] .use').getAttribute("aria-pressed") === "true", "Selected template button is marked pressed");
    ok(await p.isVisible("#builder"), "Questionnaire opens after choosing a template");

    // Step 1: required fields, error messages and blocked Next.
    ok(await p.locator("#stepBody .req").count() === 6, "Step 1 marks six required fields with a red asterisk");
    const labels = (await p.$$eval("#stepBody label", n => n.map(l => l.textContent))).join(" | ");
    ok(!/social security|birth|marital|immigration|photo|street address|home address/i.test(labels), "No field asks for SSN, birth date, photo, marital or immigration status or home address");
    await next();
    ok((await stepTitle()) === "Personal information", "Next is blocked while required fields are empty");
    ok((await errs()).length === 6, "An error message appears under each empty required field");
    ok(await p.getAttribute("#f-personal-name", "aria-invalid") === "true" && (await p.getAttribute("#f-personal-name", "aria-describedby")).includes("f-personal-name-err"), "Errors are linked to their fields for screen readers");
    ok(await p.evaluate(() => document.activeElement.id) === "f-personal-name", "Focus moves to the first field that needs fixing");
    await axe("step 1 with errors");
    await p.fill("#f-personal-name", "Liya Bekele"); await p.fill("#f-personal-email", "liya@example"); await p.fill("#f-personal-phone", "555-01");
    await p.fill("#f-personal-city", "Seattle"); await p.selectOption("#f-personal-state", "WA"); await p.fill("#f-personal-headline", "Security Operations Analyst");
    await p.fill("#f-personal-linkedin", "not a url");
    await next();
    const e1 = (await errs()).join(" ");
    ok(e1.includes("valid email") && e1.includes("valid phone") && e1.includes("valid web address"), "Invalid email, phone and link are explained: " + e1);
    await p.fill("#f-personal-email", "liya.bekele@example.com"); await p.fill("#f-personal-phone", "(206) 555-0119"); await p.fill("#f-personal-linkedin", "linkedin.com/in/liyabekele");
    ok((await live()).includes("Liya Bekele"), "Live preview updates while typing");
    await next();
    ok((await stepTitle()) === "Career objective", "Valid step 1 moves on to step 2");

    // Step 2 and the summary helper (facts only).
    await next(); ok((await errs()).length === 3, "Step 2 requires position, industry and strongest skills");
    await p.fill("#f-objective-position", "SOC Analyst"); await p.fill("#f-objective-industry", "Cybersecurity");
    await p.fill("#f-objective-years", "3"); await p.fill("#f-objective-strengths", "alert triage, log analysis and clear incident notes");
    await p.getByRole("button", {name: "Help Me Write My Professional Summary"}).click();
    const sugg = await p.textContent(".assist pre");
    ok(sugg.includes("3 years") && sugg.includes("alert triage") && sugg.includes("SOC Analyst") && !/expert|award|certified|\d{2,}%/i.test(sugg), "Summary helper uses only the visitor's answers: " + sugg);
    await p.getByRole("button", {name: "Use this summary"}).click();
    ok((await p.inputValue("#f-summary")) === sugg, "Suggested summary goes into the editable field");
    await axe("step 2 with summary helper");
    await next(); ok((await stepTitle()) === "Work experience", "Step 2 complete");

    // Step 3: experience, date checks, ordering and the description helper.
    await next(); ok((await p.textContent("#stepAlert")).includes("Add at least one job"), "Experience is required unless the first-time box is checked");
    await p.fill("#f-experience-0-title", "IT Support Specialist"); await p.fill("#f-experience-0-employer", "Rainier School District");
    await p.fill("#f-experience-0-start", "2023-05"); await p.fill("#f-experience-0-end", "2021-09");
    await next(); ok((await errs()).join(" ").includes("can't be before the start date"), "End date before start date is caught");
    await p.fill("#f-experience-0-start", "2021-09"); await p.fill("#f-experience-0-end", "");
    await next(); ok((await errs()).join(" ").includes("currently work here"), "Missing end date asks for an end date or 'currently work here'");
    await p.check("#f-experience-0-current");
    ok(await p.locator("#f-experience-0-end").evaluate(e => !e.required), "End date is no longer required once 'I currently work here' is checked");
    await p.fill("#f-experience-0-description", "responsible for resetting accounts for 300 staff. I documented recurring problems in the knowledge base");
    await p.getByRole("button", {name: "Improve My Experience Description"}).click();
    const assist = await p.textContent(".assist");
    ok(assist.includes("Responsible for") && assist.includes("leave out"), "Description helper flags vague phrases and first-person words");
    const cleaned = await p.textContent(".assist pre");
    ok(cleaned === "Responsible for resetting accounts for 300 staff\nDocumented recurring problems in the knowledge base", "Cleaned version keeps the same facts, one per line: " + JSON.stringify(cleaned));
    await p.getByRole("button", {name: "Use this version"}).click();
    await p.getByRole("button", {name: "+ Add another"}).click();
    await p.fill("#f-experience-1-title", "Help Desk Intern"); await p.fill("#f-experience-1-employer", "City Library");
    await p.fill("#f-experience-1-start", "2020-06"); await p.fill("#f-experience-1-end", "2020-08"); await p.fill("#f-experience-1-description", "Answered patron computer questions");
    ok((await live()).indexOf("IT Support Specialist") < (await live()).indexOf("Help Desk Intern"), "Jobs are listed newest first by default");
    await p.locator('#experienceList .entry[data-index="1"] button[aria-label="Move up"]').click();
    ok((await live()).indexOf("Help Desk Intern") < (await live()).indexOf("IT Support Specialist"), "Move up changes the order on the resume");
    await p.getByRole("button", {name: "Sort newest first"}).click();
    ok((await live()).indexOf("IT Support Specialist") < (await live()).indexOf("Help Desk Intern"), "Sort newest first restores reverse-chronological order");
    await axe("step 3 experience");
    await next(); ok((await stepTitle()) === "Education", "Step 3 complete");

    // Step 4.
    await next(); ok((await p.textContent("#stepAlert")).includes("Add your education"), "Education is required unless skipped");
    await p.fill("#f-education-0-institution", "Bellevue College"); await next();
    ok((await errs()).some(x => x.startsWith("f-education-0-credential")), "A started education entry needs its degree or certificate");
    await p.fill("#f-education-0-credential", "Certificate"); await p.fill("#f-education-0-field", "Cybersecurity"); await p.fill("#f-education-0-graduation", "2023-06");
    await next(); ok((await stepTitle()) === "Skills", "Step 4 complete");

    // Step 5: chips, required professional skill, confirm-before-adding suggestions.
    await next(); ok((await errs()).some(x => x.startsWith("f-skills-professional")), "At least one professional skill is required");
    await p.fill("#f-skills-professional", "Documentation, Teamwork, Customer service"); await p.press("#f-skills-professional", "Enter");
    ok(await p.locator(".chip", {hasText: "Teamwork"}).count() === 1, "Comma-separated skills become chips");
    const addChecked = p.getByRole("button", {name: "Add the skills I checked"});
    ok(await p.locator(".sugg .check", {hasText: "Log analysis"}).count() === 1, "Skill suggestions match the target job");
    await p.locator(".sugg .check", {hasText: "Log analysis"}).locator("input").check();
    ok(await addChecked.isDisabled(), "Suggested skills cannot be added until the visitor confirms they have them");
    await p.check("#skillConfirm"); await addChecked.click();
    ok(await p.locator(".chip", {hasText: "Log analysis"}).count() === 1, "Confirmed suggestion is added");
    await p.fill("#f-skills-tools", "Splunk"); // typed but not added: kept when moving on
    await axe("step 5 skills");
    await next(); ok((await stepTitle()) === "Certifications and licenses", "Step 5 complete");
    ok((await live()).includes("Splunk"), "A skill typed but not added is kept when moving on");

    // Steps 6 and 7 are optional; partial entries are still checked.
    await next(); ok((await stepTitle()) === "Additional sections", "Certifications can be skipped");
    await p.click("#backBtn");
    await p.getByRole("button", {name: "+ Add another"}).click();
    await p.fill("#f-certifications-0-issuer", "CompTIA"); await next();
    ok((await errs()).some(x => x.startsWith("f-certifications-0-name")), "A started certification needs a name");
    await p.fill("#f-certifications-0-name", "CompTIA Security+"); await p.fill("#f-certifications-0-issued", "2024-08");
    await next();
    await p.getByRole("button", {name: "+ Add another"}).click();
    await p.selectOption("#f-extras-0-type", "professional-project"); await p.fill("#f-extras-0-title", "Home SOC lab");
    await p.fill("#f-extras-0-description", "Built a Splunk lab to practice alert triage");
    await axe("step 7 additional sections");
    await next(); ok((await stepTitle()) === "Review and download", "Reached review");

    // Review.
    ok((await p.textContent(".meter strong")) === "100%", "Completion indicator reaches 100% when everything is filled " + JSON.stringify(await p.$$eval(".checklist li:not(.ok)", n => n.map(x => x.textContent))));
    await axe("step 8 review"); await fits("review step");
    for (const width of [390]) { await p.setViewportSize({width, height: 900}); ok(await p.isVisible("#previewBtn"), "Phone layout offers a Preview button"); }
    await p.setViewportSize({width: 1280, height: 900});
    await p.click("#previewBtn"); ok((await p.textContent("#dialogPage")).includes("Liya Bekele"), "Preview shows the visitor's own resume"); await p.click("#closePreview");

    // Downloads: the libraries load only now, and every file has the same content.
    ok(!requests.some(u => u.includes("/vendor/")), "PDF and Word libraries are not loaded before a download is requested");
    const dl = async id => { const [d] = await Promise.all([p.waitForEvent("download"), p.click(id)]); return {name: d.suggestedFilename(), buf: fs.readFileSync(await d.path())}; };
    const txt = await dl("#dlTxt"), pdf = await dl("#dlPdf"), docx = await dl("#dlDocx");
    ok(txt.name === "Liya-Bekele-Resume.txt" && pdf.name === "Liya-Bekele-Resume.pdf" && docx.name === "Liya-Bekele-Resume.docx", "Downloads are named after the visitor");
    const t = txt.buf.toString("utf8"), P = pdfText(pdf.buf), W = zipEntry(docx.buf, "word/document.xml");
    ok(pdf.buf.subarray(0, 5).toString() === "%PDF-" && P.pages === 1, "PDF is a real one-page PDF");
    ok(W && W.includes("<w:numPr>"), "Word file is a real .docx with real bullet lists");
    for (const s of ["Liya Bekele", "Security Operations Analyst", "liya.bekele@example.com", "IT Support Specialist", "Rainier School District", "Help Desk Intern", "Bellevue College", "CompTIA Security+", "Home SOC lab", "Log analysis", "Splunk", "Documented recurring problems in the knowledge base"]) {
      ok(t.toLowerCase().includes(s.toLowerCase()), "Text file contains " + s);
      ok(P.content.includes(s), "PDF contains selectable text " + s);
      ok(W.includes(s.replace(/&/g, "&amp;")), "Word file contains " + s);
    }
    ok(/^EXECUTIVE SUMMARY\r?$/m.test(t) && /^KEY ACHIEVEMENTS|^LEADERSHIP EXPERIENCE/m.test(t), "Executive template headings are used");
    ok(!/[–—•]/.test(t), "Plain-text file uses plain punctuation");
    ok(requests.some(u => u.includes("/vendor/jspdf-4.2.1.umd.min.js")) && requests.some(u => u.includes("/vendor/docx-9.8.1.iife.js")), "Libraries load from this site when downloading");

    // Switching templates keeps every answer.
    await p.selectOption("#tplSelect", "graduate");
    ok(await p.locator("#livePage .rdoc.tpl-graduate").count() === 1 && (await live()).includes("Rainier School District"), "Changing the template keeps all entries");
    const txt2 = (await dl("#dlTxt")).buf.toString("utf8");
    ok(/^OBJECTIVE\r?$/m.test(txt2) && txt2.indexOf("EDUCATION") < txt2.indexOf("EXPERIENCE"), "Graduate template puts education before experience");

    // Drafts persist, back up and restore.
    await p.reload();
    ok(await p.isVisible("#continueDraft") && (await p.inputValue("#f-personal-name")) === "Liya Bekele", "Draft is still there after reloading");
    const [bk] = await Promise.all([p.waitForEvent("download"), p.click("#exportDraft")]);
    const backup = await bk.path();
    ok(JSON.parse(fs.readFileSync(backup, "utf8")).personal.email === "liya.bekele@example.com", "Draft backup contains the answers");
    const bad = path.join(path.dirname(backup), "not-a-draft.json"); fs.writeFileSync(bad, JSON.stringify({hello: "<img src=x onerror=alert(1)>"}));
    await p.setInputFiles("#importFile", bad);
    await p.waitForFunction(() => document.getElementById("status").textContent.includes("isn't a resume draft"));
    ok(true, "A file that is not a draft backup is refused");
    await p.click("#deleteDraft"); await p.click("#confirmYes");
    ok(await p.isHidden("#builder") && await p.evaluate(() => !localStorage.getItem("hh_resume_draft_v1")), "Delete my draft removes it from the browser");
    await p.setInputFiles("#importFile", backup); await p.click("#confirmYes");
    ok((await p.inputValue("#f-personal-name")) === "Liya Bekele" && (await live()).includes("CompTIA Security+"), "Draft backup restores every answer");

    // Restored text is shown as text, never run as code.
    await p.evaluate(() => { const d = window.HHResume.data; d.personal.name = '<img src=x onerror="window.__xss=1">Liya'; });
    await p.fill("#f-personal-city", "Seattle ");
    await p.waitForTimeout(200);
    ok(await p.evaluate(() => !window.__xss && !document.querySelector("#livePage img")), "Typed HTML is shown as text in the preview");
    await p.fill("#f-personal-city", "Seattle");

    // Non-Latin text: the PDF warns and the Word file keeps it.
    await p.evaluate(() => { window.HHResume.data.personal.name = "Liya Bekele"; window.HHResume.data.summary += " Fluent in Amharic (አማርኛ)."; });
    await p.click('#stepper button:has-text("Review")');
    await dl("#dlPdf");
    ok((await p.textContent("#dlNote")).includes("Amharic letters"), "PDF download warns when characters can't be shown");
    ok(zipEntry((await dl("#dlDocx")).buf, "word/document.xml").includes("አማርኛ"), "Word download keeps Amharic text");

    // Amharic interface; the resume itself stays as written.
    await p.click("[data-language-toggle]"); await p.waitForFunction(() => document.documentElement.lang === "am");
    ok((await p.textContent("#heroTitle")).includes("ሬዝዩሜ") && (await p.textContent("#stepTitle")).includes("ይገምግሙ"), "Interface switches to Amharic");
    ok((await live()).includes("Professional") || (await live()).includes("SUMMARY") || (await live()).includes("Summary"), "Resume preview is not translated");
    await axe("Amharic review step"); await fits("Amharic review step");
    await p.click("[data-language-toggle]");

    // Privacy: nothing leaves the site while building and downloading.
    const external = requests.filter(u => !u.startsWith(url) && !/fonts\.(googleapis|gstatic)\.com/.test(u) && !u.startsWith("blob:") && !u.startsWith("data:"));
    ok(!external.length, "No requests to other websites " + JSON.stringify(external));
    ok(!errors.length, "No script errors " + JSON.stringify(errors));
    console.log(count + " resume builder checks passed");
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
