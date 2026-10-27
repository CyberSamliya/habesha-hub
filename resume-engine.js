/* Habesha Hub Free Resume Builder: document engine.
 * Turns the questionnaire data into one structured document, then renders that same
 * structure as an HTML preview, a PDF (jsPDF), a Word file (docx) and plain text, so
 * all outputs always contain the same information in the same order.
 * No network calls; everything runs in the visitor's browser.
 */
(function (root) {
  "use strict";

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var EXTRA_TYPES = [
    {id: "achievement", label: "Key achievement"},
    {id: "professional-project", label: "Professional project"},
    {id: "academic-project", label: "Academic project"},
    {id: "volunteer", label: "Volunteer experience"},
    {id: "award", label: "Award or honor"},
    {id: "publication", label: "Publication"},
    {id: "community", label: "Community leadership"},
    {id: "membership", label: "Professional membership"}
  ];
  var SKILL_GROUPS = [
    {id: "professional", label: "Professional"},
    {id: "technical", label: "Technical"},
    {id: "tools", label: "Software & Tools"},
    {id: "languages", label: "Languages"},
    {id: "leadership", label: "Leadership"},
    {id: "industry", label: "Industry"}
  ];

  // Section order and titles per template. Every template is single-column and ATS-friendly;
  // they differ in typography, emphasis and which sections lead.
  var TEMPLATES = [
    {id: "modern", name: "Modern Professional", font: "sans", accent: [14, 124, 87], nameAlign: "left",
      tagline: "Clean, contemporary and balanced, with a subtle emerald accent.",
      bestFor: "Corporate, administrative, operations and business roles",
      order: ["summary", "experience", "skills", "education", "certifications", "achievement", "professional-project", "academic-project", "volunteer", "award", "community", "membership", "publication"],
      titles: {summary: "Professional Summary", experience: "Professional Experience"}},
    {id: "executive", name: "Executive Leadership", font: "serif", accent: [14, 26, 43], nameAlign: "left",
      tagline: "Sophisticated and understated; leads with impact and leadership.",
      bestFor: "Managers, directors, executives and senior professionals",
      order: ["summary", "achievement", "leadership", "experience", "education", "certifications", "skills", "community", "membership", "award", "professional-project", "publication", "volunteer", "academic-project"],
      titles: {summary: "Executive Summary", achievement: "Key Achievements", leadership: "Leadership", experience: "Leadership Experience", community: "Board & Community Leadership"}},
    {id: "technology", name: "Technology & Cybersecurity", font: "sans", accent: [29, 78, 137], nameAlign: "left",
      tagline: "Technical and organized; skills, certifications and projects up front.",
      bestFor: "Cybersecurity, IT, engineering, software and technical support",
      skillOrder: ["technical", "tools", "professional", "industry", "leadership", "languages"],
      order: ["summary", "skills", "certifications", "professional-project", "academic-project", "experience", "education", "achievement", "award", "publication", "volunteer", "community", "membership"],
      titles: {summary: "Summary", skills: "Technical Skills", "professional-project": "Projects", "academic-project": "Lab & Academic Projects"}},
    {id: "graduate", name: "Recent Graduate & Entry-Level", font: "sans", accent: [194, 69, 45], nameAlign: "left",
      tagline: "Education, projects and volunteer work first. No job history needed.",
      bestFor: "Students, recent graduates and first-time job seekers",
      order: ["summary", "education", "academic-project", "professional-project", "experience", "volunteer", "skills", "certifications", "award", "achievement", "community", "membership", "publication"],
      titles: {summary: "Objective", "academic-project": "Academic Projects", experience: "Experience & Internships"}},
    {id: "classic", name: "Classic Professional", font: "serif", accent: [0, 0, 0], nameAlign: "center",
      tagline: "Traditional, timeless and black-and-white. Highly readable.",
      bestFor: "Government, healthcare, education, finance and general employment",
      order: ["summary", "experience", "education", "certifications", "skills", "achievement", "award", "professional-project", "academic-project", "volunteer", "community", "membership", "publication"],
      titles: {summary: "Summary", experience: "Experience"}}
  ];
  var DEFAULT_TITLES = {summary: "Professional Summary", experience: "Experience", education: "Education", skills: "Skills",
    certifications: "Certifications & Licenses", leadership: "Leadership", achievement: "Key Achievements",
    "professional-project": "Professional Projects", "academic-project": "Academic Projects", volunteer: "Volunteer Experience",
    award: "Awards & Honors", publication: "Publications", community: "Community Leadership", membership: "Professional Memberships"};

  function template(id) { for (var i = 0; i < TEMPLATES.length; i++) if (TEMPLATES[i].id === id) return TEMPLATES[i]; return TEMPLATES[0]; }
  function clean(s) { return String(s == null ? "" : s).replace(/\s+/g, " ").trim(); }
  function list(a) { return Array.isArray(a) ? a : []; }

  // "2024-03" -> "Mar 2024"; "2024" -> "2024"
  function fmtMonth(v) {
    var m = /^(\d{4})-(\d{2})/.exec(v || "");
    if (m) return MONTHS[+m[2] - 1] + " " + m[1];
    return clean(v);
  }
  function range(start, end, current) {
    var a = fmtMonth(start), b = current ? "Present" : fmtMonth(end);
    return a && b ? a + " – " + b : a || b;
  }
  // Free-text description -> bullet lines (one per line; leading dashes and bullets removed).
  function bullets(text) {
    return String(text || "").split(/\r?\n/).map(function (l) { return clean(l.replace(/^\s*[-–—•*●▪]+\s*/, "")); }).filter(Boolean);
  }
  function sortKey(e) { return (e.current ? "9999-99" : (e.end || e.start || "0000-00")) + "|" + (e.start || ""); }

  function buildDocument(data) {
    var d = data || {}, p = d.personal || {}, t = template(d.template);
    var contact = [p.email, p.phone, [p.city, p.state].filter(Boolean).join(", ") + (p.country && p.country !== "United States" ? ", " + p.country : "")]
      .concat([p.linkedin, p.portfolio, p.github]).map(clean).filter(Boolean);
    var sections = {};
    var summary = clean(d.summary);
    if (summary) sections.summary = {kind: "text", text: summary};

    var exp = list(d.experience).filter(function (e) { return clean(e.title) || clean(e.employer); });
    if (!d.customOrder) exp = exp.slice().sort(function (a, b) { return sortKey(b) < sortKey(a) ? -1 : sortKey(b) > sortKey(a) ? 1 : 0; });
    if (exp.length) sections.experience = {kind: "entries", entries: exp.map(function (e) {
      return {title: clean(e.title), org: clean(e.employer), location: clean(e.location), dates: range(e.start, e.end, e.current), bullets: bullets(e.description)};
    })};

    var edu = list(d.education).filter(function (e) { return clean(e.institution) || clean(e.credential); });
    if (edu.length) sections.education = {kind: "entries", entries: edu.map(function (e) {
      var lines = [];
      if (clean(e.gpa)) lines.push("GPA: " + clean(e.gpa));
      if (clean(e.honors)) lines.push("Honors: " + clean(e.honors));
      if (clean(e.coursework)) lines.push("Relevant coursework: " + clean(e.coursework));
      return {title: [clean(e.credential), clean(e.field)].filter(Boolean).join(", "), org: clean(e.institution), location: "", dates: fmtMonth(e.graduation) ? (e.expected ? "Expected " : "") + fmtMonth(e.graduation) : "", bullets: lines};
    })};

    var sk = d.skills || {}, skillLines = [];
    var groups = t.skillOrder ? t.skillOrder.map(function (id) { return SKILL_GROUPS.filter(function (g) { return g.id === id; })[0]; }) : SKILL_GROUPS;
    groups.forEach(function (g) {
      var items = list(sk[g.id]).map(clean).filter(Boolean);
      if (items.length && !(t.id === "executive" && g.id === "leadership")) skillLines.push({label: g.label, items: items});
    });
    if (skillLines.length) sections.skills = {kind: "lines", lines: skillLines};

    var certs = list(d.certifications).filter(function (c) { return clean(c.name); });
    if (certs.length) sections.certifications = {kind: "entries", entries: certs.map(function (c) {
      var dates = fmtMonth(c.issued) ? "Issued " + fmtMonth(c.issued) + (fmtMonth(c.expires) ? " · Expires " + fmtMonth(c.expires) : "") : "";
      return {title: clean(c.name), org: clean(c.issuer), location: "", dates: dates, bullets: clean(c.url) ? [clean(c.url)] : []};
    })};

    // Executive template: a dedicated Leadership section from leadership skills.
    if (t.id === "executive") {
      var lead = list(sk.leadership).map(clean).filter(Boolean);
      if (lead.length) sections.leadership = {kind: "lines", lines: [{label: "", items: lead}]};
    }

    EXTRA_TYPES.forEach(function (x) {
      var items = list(d.extras).filter(function (e) { return e.type === x.id && clean(e.title); });
      if (!items.length) return;
      items = items.slice().sort(function (a, b) { return (b.date || "") < (a.date || "") ? -1 : 1; });
      sections[x.id] = {kind: "entries", entries: items.map(function (e) {
        var b = bullets(e.description); if (clean(e.url)) b.push(clean(e.url));
        return {title: clean(e.title), org: clean(e.organization), location: "", dates: fmtMonth(e.date), bullets: b};
      })};
    });

    var out = [];
    t.order.forEach(function (key) { if (sections[key]) out.push({key: key, title: t.titles[key] || DEFAULT_TITLES[key], body: sections[key]}); });
    return {template: t, name: clean(p.name), headline: clean(p.headline), contact: contact, sections: out};
  }

  // ---------- plain text ----------
  function toText(doc) {
    var L = [];
    L.push(doc.name.toUpperCase());
    if (doc.headline) L.push(doc.headline);
    if (doc.contact.length) L.push(doc.contact.join(" | "));
    doc.sections.forEach(function (s) {
      L.push("", s.title.toUpperCase(), new Array(s.title.length + 1).join("-"));
      var b = s.body;
      if (b.kind === "text") L.push(b.text);
      if (b.kind === "lines") b.lines.forEach(function (l) { L.push((l.label ? l.label + ": " : "") + l.items.join(", ")); });
      if (b.kind === "entries") b.entries.forEach(function (e, i) {
        if (i) L.push("");
        L.push([e.title, e.org].filter(Boolean).join(" | ") + (e.dates ? " | " + e.dates : ""));
        if (e.location) L.push(e.location);
        e.bullets.forEach(function (x) { L.push("- " + x); });
      });
    });
    // Plain punctuation keeps the text file readable when pasted into any application form.
    return L.join("\r\n").replace(/[–—•·]/g, "-").replace(/[‘’]/g, "'").replace(/[“”]/g, '"') + "\r\n";
  }

  // ---------- HTML preview (class-based styling only: the page CSP blocks inline styles) ----------
  function esc(s) { return String(s).replace(/[&<>"']/g, function (m) { return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[m]; }); }
  function toHTML(doc) {
    var h = '<article class="rdoc tpl-' + doc.template.id + '"><header class="rdoc-head"><h1 class="rdoc-name">' + esc(doc.name || "Your Name") + "</h1>";
    if (doc.headline) h += '<p class="rdoc-headline">' + esc(doc.headline) + "</p>";
    if (doc.contact.length) h += '<p class="rdoc-contact">' + doc.contact.map(esc).join('<span class="sep"> | </span>') + "</p>";
    h += "</header>";
    doc.sections.forEach(function (s) {
      h += '<section class="rdoc-sec"><h2>' + esc(s.title) + "</h2>";
      var b = s.body;
      if (b.kind === "text") h += "<p>" + esc(b.text) + "</p>";
      if (b.kind === "lines") b.lines.forEach(function (l) { h += '<p class="rdoc-line">' + (l.label ? "<b>" + esc(l.label) + ":</b> " : "") + esc(l.items.join(", ")) + "</p>"; });
      if (b.kind === "entries") b.entries.forEach(function (e) {
        h += '<div class="rdoc-entry"><p class="rdoc-row"><span class="rdoc-title">' + esc(e.title) + (e.org ? '<span class="rdoc-org"> | ' + esc(e.org) + "</span>" : "") + "</span>" +
          (e.dates ? '<span class="rdoc-dates">' + esc(e.dates) + "</span>" : "") + "</p>";
        if (e.location) h += '<p class="rdoc-loc">' + esc(e.location) + "</p>";
        if (e.bullets.length) h += "<ul>" + e.bullets.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>";
        h += "</div>";
      });
      h += "</section>";
    });
    return h + "</article>";
  }

  // ---------- PDF (jsPDF; real text, not an image) ----------
  // Standard PDF fonts cover Western characters; anything else is replaced and reported.
  var WIN = /[^\u0009\u000A\u000D -~ -ÿ–—‘’“”•…€]/g;
  function toPDF(doc, jsPDF) {
    var t = doc.template, serif = t.font === "serif", F = serif ? "times" : "helvetica", replaced = false;
    var pdf = new jsPDF({unit: "pt", format: "letter", compress: true});
    var W = pdf.internal.pageSize.getWidth(), H = pdf.internal.pageSize.getHeight(), M = 54, CW = W - 2 * M, y = M;
    var ink = [18, 24, 38], muted = [85, 96, 112], acc = t.accent;
    function s(x) { var r = String(x).replace(WIN, "?"); if (r !== String(x)) replaced = true; return r; }
    function font(style, size, color) { pdf.setFont(F, style); pdf.setFontSize(size); pdf.setTextColor.apply(pdf, color || ink); }
    function lh(size) { return size * 1.32; }
    function ensure(h) { if (y + h > H - M) { pdf.addPage(); y = M; } }
    function para(text, size, style, color, indent) {
      font(style, size, color); var lines = pdf.splitTextToSize(s(text), CW - (indent || 0));
      lines.forEach(function (ln) { ensure(lh(size)); pdf.text(ln, M + (indent || 0), y + size); y += lh(size); });
    }
    function bulletBlockHeight(text, size) { font("normal", size); return pdf.splitTextToSize(s(text), CW - 14).length * lh(size); }

    var center = t.nameAlign === "center";
    font("bold", serif ? 20 : 21, t.id === "classic" ? ink : (t.id === "modern" ? ink : acc));
    pdf.text(s(doc.name || "Your Name"), center ? W / 2 : M, y + 20, center ? {align: "center"} : undefined); y += 28;
    if (doc.headline) { font(serif ? "italic" : "normal", 11.5, muted); pdf.text(s(doc.headline), center ? W / 2 : M, y + 11, center ? {align: "center"} : undefined); y += 17; }
    if (doc.contact.length) {
      font("normal", 9.5, muted);
      pdf.splitTextToSize(s(doc.contact.join("  |  ")), CW).forEach(function (ln) { pdf.text(ln, center ? W / 2 : M, y + 9.5, center ? {align: "center"} : undefined); y += 13; });
    }
    y += 6;
    if (t.id === "classic" || t.id === "executive") { pdf.setDrawColor.apply(pdf, ink); pdf.setLineWidth(t.id === "executive" ? 1.2 : 0.8); pdf.line(M, y, W - M, y); y += 8; }

    doc.sections.forEach(function (sec) {
      var b = sec.body, first = 40;
      if (b.kind === "entries" && b.entries[0]) first = 30 + (b.entries[0].bullets[0] ? bulletBlockHeight(b.entries[0].bullets[0], 10) : 0);
      ensure(24 + first);
      y += 8;
      font("bold", 10.5, t.id === "classic" ? ink : acc);
      var title = s(sec.title.toUpperCase());
      pdf.text(title, M, y + 10.5, {charSpace: 0.6});
      y += 15;
      pdf.setDrawColor.apply(pdf, t.id === "classic" ? ink : acc); pdf.setLineWidth(0.6); pdf.line(M, y, W - M, y); y += 7;
      if (b.kind === "text") para(b.text, 10, "normal");
      if (b.kind === "lines") b.lines.forEach(function (l) {
        if (l.label) {
          font("bold", 10); var lab = s(l.label + ":"), lw = pdf.getTextWidth(lab);
          font("normal", 10); lw += pdf.getTextWidth(" ") + 1; var lines = pdf.splitTextToSize(s(l.items.join(", ")), CW - lw);
          ensure(lh(10)); font("bold", 10); pdf.text(lab, M, y + 10); font("normal", 10); pdf.text(lines[0], M + lw, y + 10); y += lh(10);
          lines.slice(1).forEach(function (ln) { ensure(lh(10)); pdf.text(ln, M + lw, y + 10); y += lh(10); });
        } else para(l.items.join("  •  "), 10, "normal");
      });
      if (b.kind === "entries") b.entries.forEach(function (e, i) {
        if (i) y += 5;
        ensure(lh(10.5) + (e.location ? lh(9.5) : 0) + (e.bullets[0] ? bulletBlockHeight(e.bullets[0], 10) : 0));
        font("normal", 9.5, muted); var dw = e.dates ? pdf.getTextWidth(s(e.dates)) : 0;
        if (e.dates) pdf.text(s(e.dates), W - M, y + 10.5, {align: "right"});
        font("bold", 10.5); var tl = pdf.splitTextToSize(s(e.title + (e.org ? " | " + e.org : "")), CW - dw - 12);
        tl.forEach(function (ln, k) { if (k) ensure(lh(10.5)); pdf.text(ln, M, y + 10.5); y += lh(10.5); });
        if (e.location) { font("italic", 9.5, muted); pdf.text(s(e.location), M, y + 9.5); y += lh(9.5); }
        e.bullets.forEach(function (x) {
          font("normal", 10); var bl = pdf.splitTextToSize(s(x), CW - 14);
          bl.forEach(function (ln, k) { ensure(lh(10)); if (!k) pdf.text("•", M + 3, y + 10); pdf.text(ln, M + 14, y + 10); y += lh(10); });
        });
      });
    });
    pdf.setProperties({title: (doc.name || "Resume") + " - Resume", subject: "Resume", creator: "Habesha Hub Free Resume Builder", author: doc.name || ""});
    return {blob: pdf.output("blob"), pages: pdf.getNumberOfPages(), replaced: replaced};
  }

  // ---------- Word .docx (docx library; editable headings, paragraphs and real bullet lists) ----------
  function toDOCX(doc, D) {
    var t = doc.template, serif = t.font === "serif", fontName = serif ? "Times New Roman" : "Calibri";
    var hex = function (c) { return c.map(function (n) { return ("0" + n.toString(16)).slice(-2); }).join(""); };
    var accent = t.id === "classic" ? "000000" : hex(t.accent), muted = "556070";
    var CONTENT = 12240 - 2 * 1080; // letter width minus 0.75in margins, in twips
    var center = t.nameAlign === "center" ? D.AlignmentType.CENTER : D.AlignmentType.LEFT;
    var kids = [];
    kids.push(new D.Paragraph({alignment: center, spacing: {after: 40}, children: [new D.TextRun({text: doc.name || "Your Name", bold: true, size: 40, color: t.id === "modern" || t.id === "classic" ? "121826" : accent})]}));
    if (doc.headline) kids.push(new D.Paragraph({alignment: center, spacing: {after: 40}, children: [new D.TextRun({text: doc.headline, italics: serif, size: 23, color: muted})]}));
    if (doc.contact.length) kids.push(new D.Paragraph({alignment: center, spacing: {after: 120}, children: [new D.TextRun({text: doc.contact.join("  |  "), size: 19, color: muted})]}));
    doc.sections.forEach(function (sec) {
      kids.push(new D.Paragraph({heading: D.HeadingLevel.HEADING_2, keepNext: true, spacing: {before: 200, after: 80},
        border: {bottom: {color: accent, space: 2, style: D.BorderStyle.SINGLE, size: 6}},
        children: [new D.TextRun({text: sec.title.toUpperCase(), bold: true, size: 21, color: accent, font: fontName})]}));
      var b = sec.body;
      if (b.kind === "text") kids.push(new D.Paragraph({spacing: {after: 60}, children: [new D.TextRun({text: b.text})]}));
      if (b.kind === "lines") b.lines.forEach(function (l) {
        kids.push(new D.Paragraph({spacing: {after: 40}, children: (l.label ? [new D.TextRun({text: l.label + ": ", bold: true})] : []).concat([new D.TextRun({text: l.items.join(l.label ? ", " : "  •  ")})])}));
      });
      if (b.kind === "entries") b.entries.forEach(function (e, i) {
        kids.push(new D.Paragraph({keepNext: true, spacing: {before: i ? 120 : 0, after: 20}, tabStops: [{type: D.TabStopType.RIGHT, position: CONTENT}],
          children: [new D.TextRun({text: e.title, bold: true}), new D.TextRun({text: e.org ? " | " + e.org : "", bold: true})].concat(e.dates ? [new D.TextRun({text: "\t" + e.dates, color: muted, size: 19})] : [])}));
        if (e.location) kids.push(new D.Paragraph({keepNext: !!e.bullets.length, spacing: {after: 20}, children: [new D.TextRun({text: e.location, italics: true, color: muted, size: 19})]}));
        e.bullets.forEach(function (x) { kids.push(new D.Paragraph({bullet: {level: 0}, spacing: {after: 20}, children: [new D.TextRun({text: x})]})); });
      });
    });
    var d = new D.Document({
      creator: "Habesha Hub Free Resume Builder", title: (doc.name || "Resume") + " - Resume",
      styles: {default: {document: {run: {font: fontName, size: 21, color: "121826"}}}},
      sections: [{properties: {page: {size: {width: 12240, height: 15840}, margin: {top: 1080, bottom: 1080, left: 1080, right: 1080}}}, children: kids}]
    });
    return D.Packer.toBlob(d);
  }

  // ---------- sample data (fictional people, used only for template previews) ----------
  var SAMPLES = {
    modern: {template: "modern", personal: {name: "Meron Alemu", email: "meron.alemu@email.com", phone: "(614) 555-0142", city: "Columbus", state: "OH", headline: "Operations Coordinator"},
      summary: "Operations coordinator with 5 years of experience in scheduling, vendor coordination and process improvement. Known for clear communication and dependable follow-through across busy teams.",
      experience: [{title: "Operations Coordinator", employer: "Midwest Logistics Group", location: "Columbus, OH", start: "2022-04", current: true, description: "Coordinate daily schedules for a 40-person warehouse team\nTrack vendor deliveries and resolve shipment issues\nUpdated onboarding checklists used by new staff"},
        {title: "Administrative Assistant", employer: "Franklin Family Clinic", location: "Columbus, OH", start: "2019-06", end: "2022-03", description: "Managed appointment calendars for four providers\nPrepared patient intake packets and records"}],
      education: [{institution: "Columbus State Community College", credential: "Associate of Applied Science", field: "Business Management", graduation: "2019-05"}],
      skills: {professional: ["Scheduling", "Vendor coordination", "Process improvement"], tools: ["Microsoft Excel", "Google Workspace"], languages: ["English", "Amharic"]}},
    executive: {template: "executive", personal: {name: "Daniel Haile", email: "d.haile@email.com", phone: "(202) 555-0177", city: "Washington", state: "DC", headline: "Director of Operations"},
      summary: "Operations executive with 15 years of experience leading multi-site teams. Builds accountable cultures, steady processes and strong partnerships with community stakeholders.",
      extras: [{type: "achievement", title: "Led consolidation of three regional offices into one service center", organization: "Capital Health Services", date: "2023-06"}, {type: "achievement", title: "Directed annual budget planning across five departments", organization: "Capital Health Services", date: "2021-01"}],
      skills: {leadership: ["Strategic planning", "Team development", "Budget oversight", "Stakeholder relations"]},
      experience: [{title: "Director of Operations", employer: "Capital Health Services", location: "Washington, DC", start: "2018-02", current: true, description: "Lead operations for four service locations and 120 staff\nOversee budgeting, staffing and quality reviews"}],
      education: [{institution: "Howard University", credential: "Master of Business Administration", graduation: "2012-05"}]},
    technology: {template: "technology", personal: {name: "Liya Bekele", email: "liya.bekele@email.com", phone: "(206) 555-0119", city: "Seattle", state: "WA", headline: "Security Operations Analyst", github: "github.com/liyabekele"},
      summary: "Security analyst focused on log analysis, alert triage and incident documentation, with hands-on lab experience in SIEM and endpoint tools.",
      skills: {technical: ["Log analysis", "Incident response", "Network fundamentals"], tools: ["Splunk", "Wireshark", "Microsoft Defender", "Linux"], professional: ["Documentation", "Teamwork"]},
      certifications: [{name: "CompTIA Security+", issuer: "CompTIA", issued: "2024-08"}],
      extras: [{type: "professional-project", title: "Home SOC lab", organization: "Personal project", date: "2024-10", description: "Built a lab with Splunk and Sysmon to practice alert triage\nWrote playbooks for common phishing alerts"}],
      experience: [{title: "IT Support Specialist", employer: "Rainier School District", location: "Seattle, WA", start: "2021-09", current: true, description: "Resolve hardware and account issues for staff and students\nDocument recurring problems in the ticketing knowledge base"}],
      education: [{institution: "Bellevue College", credential: "Certificate", field: "Cybersecurity", graduation: "2023-06"}]},
    graduate: {template: "graduate", personal: {name: "Hanna Tadesse", email: "hanna.tadesse@email.com", phone: "(612) 555-0163", city: "Minneapolis", state: "MN", headline: "Entry-Level Marketing Assistant"},
      summary: "Recent marketing graduate seeking an entry-level role. Brings campus project experience, social media content skills and strong teamwork.",
      education: [{institution: "University of Minnesota", credential: "Bachelor of Arts", field: "Marketing", graduation: "2026-05", gpa: "3.6", coursework: "Consumer Behavior, Digital Marketing, Statistics"}],
      extras: [{type: "academic-project", title: "Campus food pantry awareness campaign", organization: "Marketing capstone", date: "2026-03", description: "Planned a four-week social media campaign with a team of five\nPresented results to the student affairs office"},
        {type: "volunteer", title: "Youth program volunteer", organization: "Ethiopian Community Center", date: "2025-08", description: "Helped organize weekend reading activities for children"}],
      skills: {professional: ["Content writing", "Teamwork", "Presentation"], tools: ["Canva", "Google Analytics"], languages: ["English", "Amharic"]}},
    classic: {template: "classic", personal: {name: "Samuel Girma", email: "samuel.girma@email.com", phone: "(404) 555-0138", city: "Atlanta", state: "GA", headline: "Licensed Practical Nurse"},
      summary: "Licensed practical nurse with 7 years of experience in long-term care. Patient-centered, detail-oriented and dependable.",
      experience: [{title: "Licensed Practical Nurse", employer: "Peachtree Care Center", location: "Atlanta, GA", start: "2019-01", current: true, description: "Administer medications and treatments for 20 residents per shift\nDocument patient care accurately in electronic records"},
        {title: "Certified Nursing Assistant", employer: "Northside Senior Living", location: "Atlanta, GA", start: "2016-03", end: "2018-12", description: "Assisted residents with daily living activities"}],
      education: [{institution: "Atlanta Technical College", credential: "Diploma", field: "Practical Nursing", graduation: "2018-12"}],
      certifications: [{name: "Licensed Practical Nurse (LPN)", issuer: "Georgia Board of Nursing", issued: "2019-01"}],
      skills: {professional: ["Medication administration", "Patient care", "Documentation"], languages: ["English", "Amharic"]}}
  };

  root.ResumeEngine = {TEMPLATES: TEMPLATES, EXTRA_TYPES: EXTRA_TYPES, SKILL_GROUPS: SKILL_GROUPS, SAMPLES: SAMPLES,
    template: template, buildDocument: buildDocument, toText: toText, toHTML: toHTML, toPDF: toPDF, toDOCX: toDOCX, bullets: bullets, fmtMonth: fmtMonth};
})(typeof window !== "undefined" ? window : globalThis);
