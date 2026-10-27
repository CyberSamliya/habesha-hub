/* Habesha Hub Free Resume Builder: page logic (template gallery, 8-step questionnaire,
 * validation, drafts, live preview, writing helpers and downloads).
 * Everything stays in the visitor's browser. The PDF and Word libraries in vendor/ are
 * loaded only when a download is requested.
 */
(function () {
  "use strict";
  var E = window.ResumeEngine;
  if (!E) return;
  var KEY = "hh_resume_draft_v1";
  var LIBS = {pdf: "vendor/jspdf-4.2.1.umd.min.js", docx: "vendor/docx-9.8.1.iife.js"};
  // Optional AI writing help is off. A paid AI provider must never be called from this page with
  // a key in the browser; if one is added later it belongs behind a server endpoint with limits.
  var AI = {enabled: false};
  var $ = function (id) { return document.getElementById(id); };

  // ---------- data ----------
  function newJob() { return {title: "", employer: "", location: "", start: "", end: "", current: false, description: ""}; }
  function newEdu() { return {institution: "", credential: "", field: "", graduation: "", expected: false, gpa: "", honors: "", coursework: ""}; }
  function newCert() { return {name: "", issuer: "", issued: "", expires: "", url: ""}; }
  function newExtra() { return {type: "", title: "", organization: "", date: "", description: "", url: ""}; }
  function blank() {
    return {version: 1, template: "", personal: {name: "", email: "", phone: "", city: "", state: "", country: "United States", linkedin: "", portfolio: "", github: "", headline: ""},
      objective: {position: "", industry: "", years: "", strengths: "", why: ""}, summary: "", firstTime: false, skipEducation: false, customOrder: false,
      experience: [newJob()], education: [newEdu()], skills: {professional: [], technical: [], tools: [], languages: [], leadership: [], industry: []},
      certifications: [], extras: []};
  }
  // Accept only the known shape (used for saved drafts and restored backup files).
  function str(v, max) { return typeof v === "string" ? v.slice(0, max || 4000) : ""; }
  function shape(src, tpl) {
    var out = {};
    Object.keys(tpl).forEach(function (k) {
      var t = tpl[k], v = src ? src[k] : undefined;
      out[k] = typeof t === "boolean" ? v === true : typeof t === "number" ? t : str(v);
    });
    return out;
  }
  function normalize(raw) {
    var b = blank(), r = raw && typeof raw === "object" ? raw : {};
    var d = {version: 1, template: E.TEMPLATES.some(function (t) { return t.id === r.template; }) ? r.template : "",
      personal: shape(r.personal, b.personal), objective: shape(r.objective, b.objective), summary: str(r.summary),
      firstTime: r.firstTime === true, skipEducation: r.skipEducation === true, customOrder: r.customOrder === true};
    if (!d.personal.country) d.personal.country = "United States";
    function arr(a, maker, max) { return (Array.isArray(a) ? a : []).slice(0, max).map(function (x) { return shape(x, maker()); }); }
    d.experience = arr(r.experience, newJob, 30); if (!d.experience.length) d.experience = [newJob()];
    d.education = arr(r.education, newEdu, 15); if (!d.education.length) d.education = [newEdu()];
    d.certifications = arr(r.certifications, newCert, 30);
    d.extras = arr(r.extras, newExtra, 40).filter(function (x) { x.type = E.EXTRA_TYPES.some(function (t) { return t.id === x.type; }) ? x.type : ""; return true; });
    d.skills = {};
    E.SKILL_GROUPS.forEach(function (g) { d.skills[g.id] = (Array.isArray(r.skills && r.skills[g.id]) ? r.skills[g.id] : []).map(function (s) { return str(s, 80).trim(); }).filter(Boolean).slice(0, 40); });
    return d;
  }
  var data = blank(), step = 0, maxStep = 0, saveTimer = 0, renderTimer = 0;

  function load() {
    try { var s = localStorage.getItem(KEY); if (s) { data = normalize(JSON.parse(s)); return true; } } catch (e) {}
    return false;
  }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(data)); return true; } catch (e) { return false; } }
  function changed() {
    clearTimeout(saveTimer); saveTimer = setTimeout(persist, 400);
    clearTimeout(renderTimer); renderTimer = setTimeout(renderLive, 120);
  }
  function status(msg, bad) { var s = $("status"); s.textContent = msg; s.classList.toggle("bad", !!bad); }

  function getPath(p) { return p.split(".").reduce(function (o, k) { return o == null ? o : o[k]; }, data); }
  function setPath(p, v) { var ks = p.split("."), last = ks.pop(), o = ks.reduce(function (o, k) { return o[k]; }, data); o[last] = v; }

  // ---------- small DOM helper (no inline styles: the page CSP blocks them) ----------
  function h(tag, props) {
    var e = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      var v = props[k];
      if (v == null || v === false) return;
      if (k === "class") e.className = v;
      else if (k === "text") e.textContent = v;
      else if (k.indexOf("on") === 0) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? "" : v);
    });
    for (var i = 2; i < arguments.length; i++) add(e, arguments[i]);
    return e;
  }
  function add(e, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) c.forEach(function (x) { add(e, x); });
    else e.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  var monthSupported = (function () { var i = document.createElement("input"); i.setAttribute("type", "month"); return i.type === "month"; })();

  function field(o) {
    var id = "f-" + o.path.replace(/\./g, "-"), input, v = getPath(o.path);
    if (o.type === "textarea") input = h("textarea", {id: id, rows: o.rows || 4, maxlength: o.max || 2500});
    else if (o.type === "select") input = h("select", {id: id}, o.options.map(function (x) { return h("option", {value: x[0]}, x[1]); }));
    else input = h("input", {id: id, type: o.type === "month" && !monthSupported ? "text" : (o.type || "text"), maxlength: o.max || 160, autocomplete: o.auto || "off", inputmode: o.inputmode});
    if (o.type === "month" && !monthSupported) input.placeholder = "YYYY-MM";
    else if (o.placeholder) input.placeholder = o.placeholder;
    input.value = v == null ? "" : v;
    input.dataset.path = o.path;
    if (o.required) { input.required = true; input.setAttribute("aria-required", "true"); }
    var hint = o.hint ? h("p", {class: "hint", id: id + "-hint"}, o.hint) : null;
    input.setAttribute("aria-describedby", (hint ? id + "-hint " : "") + id + "-err");
    return h("div", {class: "field" + (o.full ? " full" : "")},
      h("label", {for: id}, h("span", {}, o.label), o.required ? h("span", {class: "req", "aria-hidden": "true"}, "*") : null),
      hint, input, h("p", {class: "err", id: id + "-err", hidden: true}));
  }
  function check(path, label, onchange) {
    var id = "f-" + path.replace(/\./g, "-");
    var input = h("input", {type: "checkbox", id: id});
    input.checked = !!getPath(path); input.dataset.path = path;
    if (onchange) input.addEventListener("change", onchange);
    return h("label", {class: "check", for: id}, input, h("span", {}, label));
  }

  // ---------- validation ----------
  var MSG = {
    required: "This field is required.",
    email: "Enter a valid email address, like name@example.com.",
    phone: "Enter a valid phone number with area code.",
    url: "Enter a valid web address, like linkedin.com/in/yourname.",
    month: "Use the format YYYY-MM, like 2024-03.",
    order: "The end date can't be before the start date.",
    end: "Add an end date or check “I currently work here”.",
    jobs: "Add at least one job, or check “I am a student or first-time job seeker”.",
    edu: "Add your education, or check “Skip education”.",
    skills: "Add at least one professional skill.",
    fix: "Please fix the highlighted fields before continuing."
  };
  function blankStr(v) { return !String(v || "").trim(); }
  var reEmail = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i, reUrl = /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(\/\S*)?$/i, reMonth = /^\d{4}-(0[1-9]|1[0-2])$/;
  function entryFilled(o, keys) { return keys.some(function (k) { return typeof o[k] === "string" && o[k].trim(); }); }
  function monthErr(errs, path) { var v = getPath(path); if (v && !reMonth.test(v)) errs.push({path: path, msg: MSG.month}); }

  function validate(i) {
    var e = [], p = data.personal;
    function req(path) { if (blankStr(getPath(path))) e.push({path: path, msg: MSG.required}); }
    if (i === 0) {
      ["personal.name", "personal.email", "personal.phone", "personal.city", "personal.state", "personal.headline"].forEach(req);
      if (p.email.trim() && !reEmail.test(p.email.trim())) e.push({path: "personal.email", msg: MSG.email});
      var digits = p.phone.replace(/\D/g, "");
      if (p.phone.trim() && (digits.length < 10 || digits.length > 15)) e.push({path: "personal.phone", msg: MSG.phone});
      ["linkedin", "portfolio", "github"].forEach(function (k) { if (p[k].trim() && !reUrl.test(p[k].trim())) e.push({path: "personal." + k, msg: MSG.url}); });
    }
    if (i === 1) ["objective.position", "objective.industry", "objective.strengths"].forEach(req);
    if (i === 2) {
      var any = false;
      data.experience.forEach(function (j, n) {
        if (!entryFilled(j, ["title", "employer", "location", "start", "end", "description"])) return;
        any = true; var b = "experience." + n + ".";
        ["title", "employer", "start"].forEach(function (k) { req(b + k); });
        monthErr(e, b + "start"); monthErr(e, b + "end");
        if (!j.current && blankStr(j.end)) e.push({path: b + "end", msg: MSG.end});
        if (!j.current && reMonth.test(j.start) && reMonth.test(j.end) && j.end < j.start) e.push({path: b + "end", msg: MSG.order});
      });
      if (!any && !data.firstTime) e.push({path: null, msg: MSG.jobs});
    }
    if (i === 3) {
      var anyEdu = false;
      data.education.forEach(function (d, n) {
        if (!entryFilled(d, ["institution", "credential", "field", "graduation", "gpa", "honors", "coursework"])) return;
        anyEdu = true; req("education." + n + ".institution"); req("education." + n + ".credential"); monthErr(e, "education." + n + ".graduation");
      });
      if (!anyEdu && !data.skipEducation) e.push({path: null, msg: MSG.edu});
    }
    if (i === 4 && !data.skills.professional.length) e.push({path: "skills.professional", msg: MSG.skills});
    if (i === 5) data.certifications.forEach(function (c, n) {
      if (!entryFilled(c, ["name", "issuer", "issued", "expires", "url"])) return;
      req("certifications." + n + ".name"); monthErr(e, "certifications." + n + ".issued"); monthErr(e, "certifications." + n + ".expires");
      if (c.url.trim() && !reUrl.test(c.url.trim())) e.push({path: "certifications." + n + ".url", msg: MSG.url});
    });
    if (i === 6) data.extras.forEach(function (x, n) {
      if (!entryFilled(x, ["type", "title", "organization", "date", "description", "url"])) return;
      req("extras." + n + ".type"); req("extras." + n + ".title"); monthErr(e, "extras." + n + ".date");
      if (x.url.trim() && !reUrl.test(x.url.trim())) e.push({path: "extras." + n + ".url", msg: MSG.url});
    });
    return e;
  }
  function fieldEl(path) { return document.querySelector('#stepBody [data-path="' + path + '"]'); }
  function clearErrors() {
    document.querySelectorAll("#stepBody [aria-invalid]").forEach(function (x) { x.removeAttribute("aria-invalid"); });
    document.querySelectorAll("#stepBody .err").forEach(function (x) { x.hidden = true; x.textContent = ""; });
    $("stepAlert").hidden = true; $("stepAlert").textContent = "";
  }
  function showErrors(errs) {
    clearErrors();
    var general = [], first = null;
    errs.forEach(function (er) {
      var el = er.path && fieldEl(er.path), msgEl = el && document.getElementById(el.id + "-err");
      if (!el && er.path) { el = document.getElementById("f-" + er.path.replace(/\./g, "-")); msgEl = el && document.getElementById(el.id + "-err"); }
      if (el) el.setAttribute("aria-invalid", "true");
      if (msgEl && msgEl.hidden) { msgEl.textContent = er.msg; msgEl.hidden = false; first = first || el || msgEl; }
      else if (!msgEl) general.push(er.msg);
    });
    var alert = $("stepAlert");
    alert.append(h("span", {}, MSG.fix));
    if (general.length) alert.append(h("ul", {}, general.map(function (m) { return h("li", {}, m); })));
    alert.hidden = false;
    if (first) first.focus(); else { alert.tabIndex = -1; alert.focus(); }
  }

  // ---------- steps ----------
  var STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];
  var STEPS = [
    {title: "Personal information", short: "Contact info", intro: "How employers will contact you. Only share what belongs on a resume.", render: stepPersonal},
    {title: "Career objective", short: "Objective", intro: "Tell us the job you want. We use your answers to help you write a short professional summary.", render: stepObjective},
    {title: "Work experience", short: "Experience", intro: "Add your jobs, newest first. Include paid work, internships and contract work.", render: stepExperience},
    {title: "Education", short: "Education", intro: "Add schools, degrees, diplomas, certificates or training programs.", render: stepEducation},
    {title: "Skills", short: "Skills", intro: "List skills you can show or explain in an interview. Type a skill and press Enter or Add.", render: stepSkills},
    {title: "Certifications and licenses", short: "Certifications", intro: "Optional. Add certifications or licenses you have earned.", render: stepCerts},
    {title: "Additional sections", short: "More", intro: "Optional. Add projects, volunteer work, awards, publications, leadership or memberships.", render: stepExtras},
    {title: "Review and download", short: "Review", intro: "Check your resume, fix anything missing, then generate your downloads.", render: stepReview}
  ];

  function stepPersonal(body) {
    body.append(h("div", {class: "grid2"},
      field({path: "personal.name", label: "Full name", required: true, auto: "name", full: true}),
      field({path: "personal.email", label: "Email address", required: true, type: "email", auto: "email", inputmode: "email"}),
      field({path: "personal.phone", label: "Phone number", required: true, type: "tel", auto: "tel", inputmode: "tel", placeholder: "(555) 555-0100"}),
      field({path: "personal.city", label: "City", required: true, auto: "address-level2"}),
      field({path: "personal.state", label: "State", required: true, type: "select", options: [["", "Select one"]].concat(STATES.map(function (s) { return [s, s]; })).concat([["Outside the U.S.", "Outside the U.S."]])}),
      field({path: "personal.country", label: "Country", auto: "country-name"}),
      field({path: "personal.headline", label: "Professional headline or target job title", required: true, placeholder: "e.g. Customer Service Representative", hint: "Appears under your name."}),
      field({path: "personal.linkedin", label: "LinkedIn profile", placeholder: "linkedin.com/in/yourname"}),
      field({path: "personal.portfolio", label: "Portfolio or website", placeholder: "yourname.com"}),
      field({path: "personal.github", label: "GitHub", placeholder: "github.com/yourname"})
    ), h("div", {class: "callout"}, h("h4", {}, "Keep your private information private"),
      h("p", {}, "U.S. resumes should not include your Social Security number, date of birth, photo, marital status, immigration status or full home address. City and state are enough.")));
  }

  function stepObjective(body) {
    body.append(h("div", {class: "grid2"},
      field({path: "objective.position", label: "Position you are applying for", required: true, placeholder: "e.g. Medical Assistant"}),
      field({path: "objective.industry", label: "Industry", required: true, placeholder: "e.g. Healthcare"}),
      field({path: "objective.years", label: "Years of experience", type: "number", inputmode: "numeric", max: 2, hint: "Leave blank if you are just starting out."}),
      field({path: "objective.strengths", label: "Your strongest skills", required: true, placeholder: "e.g. patient scheduling, bilingual communication, record keeping", full: true}),
      field({path: "objective.why", label: "Why are you a strong candidate?", type: "textarea", rows: 3, full: true, hint: "One or two sentences in your own words. Facts only."})
    ));
    var out = h("div", {});
    body.append(h("div", {class: "callout"},
      h("h4", {}, "Professional summary"),
      h("p", {}, "A short paragraph at the top of your resume. Write your own, or let the helper draft one using only your answers above."),
      field({path: "summary", label: "Professional summary", type: "textarea", rows: 5, max: 1200, full: true}),
      h("div", {class: "assist-row row"},
        h("button", {type: "button", class: "btn small", onclick: function () { suggestSummary(out); }}, "Help Me Write My Professional Summary"),
        h("button", {type: "button", class: "btn small", onclick: function () { checkWriting("summary", out, false); }}, "Check my writing")),
      out));
  }

  function entriesUI(kind, title, maker, render, label) {
    var list = h("div", {class: "entries", id: kind + "List"});
    data[kind].forEach(function (item, n) {
      var card = h("div", {class: "entry", "data-index": n},
        h("div", {class: "entry-head"},
          h("button", {type: "button", class: "handle", "aria-label": "Drag to reorder", title: "Drag to reorder"}, "⠿"),
          h("h4", {lang: "en"}, title(item) || label + " " + (n + 1)),
          h("button", {type: "button", class: "btn small", "aria-label": "Move up", disabled: n === 0, onclick: function () { move(kind, n, n - 1); }}, "↑"),
          h("button", {type: "button", class: "btn small", "aria-label": "Move down", disabled: n === data[kind].length - 1, onclick: function () { move(kind, n, n + 1); }}, "↓"),
          h("button", {type: "button", class: "btn small danger", onclick: function () { removeEntry(kind, n); }}, "Remove")),
        render(item, kind + "." + n + "."));
      dragify(card, kind);
      list.append(card);
    });
    return h("div", {}, list, h("p", {}, h("button", {type: "button", class: "btn", onclick: function () { data[kind].push(maker()); changed(); show(step, "#" + kind + "List .entry:last-child input"); }}, "+ " + "Add another")));
  }
  function move(kind, from, to) {
    if (to < 0 || to >= data[kind].length) return;
    var it = data[kind].splice(from, 1)[0]; data[kind].splice(to, 0, it);
    if (kind === "experience") data.customOrder = true;
    changed(); show(step, '#' + kind + 'List .entry[data-index="' + to + '"] .handle');
    status("Moved.");
  }
  function removeEntry(kind, n) {
    confirmBox("Remove this entry?", "This removes it from your resume. This can't be undone.", "Remove", function () {
      data[kind].splice(n, 1);
      if (!data[kind].length && (kind === "experience" || kind === "education")) data[kind].push(kind === "experience" ? newJob() : newEdu());
      changed(); show(step);
    });
  }
  // Drag-and-drop ordering with the handle (mouse and pen); the Move buttons cover keyboard and touch.
  var dragFrom = null;
  function dragify(card, kind) {
    var handle = card.querySelector(".handle");
    handle.addEventListener("mousedown", function () { card.draggable = true; });
    card.addEventListener("dragstart", function (ev) { dragFrom = +card.dataset.index; card.classList.add("dragging"); ev.dataTransfer.effectAllowed = "move"; ev.dataTransfer.setData("text/plain", String(dragFrom)); });
    card.addEventListener("dragend", function () { card.draggable = false; card.classList.remove("dragging"); document.querySelectorAll(".drop-target").forEach(function (x) { x.classList.remove("drop-target"); }); });
    card.addEventListener("dragover", function (ev) { if (dragFrom == null) return; ev.preventDefault(); card.classList.add("drop-target"); });
    card.addEventListener("dragleave", function () { card.classList.remove("drop-target"); });
    card.addEventListener("drop", function (ev) { ev.preventDefault(); var to = +card.dataset.index; if (dragFrom != null && dragFrom !== to) move(kind, dragFrom, to); dragFrom = null; });
  }

  function stepExperience(body) {
    body.append(check("firstTime", "I am a student or first-time job seeker (work experience is optional)", function () { data.firstTime = this.checked; changed(); }));
    var note = h("p", {class: "order-note"});
    if (data.customOrder) note.append(h("span", {}, "Your resume lists jobs in the order shown here."), h("button", {type: "button", class: "btn link", onclick: function () { data.customOrder = false; sortJobs(); changed(); show(step); }}, "Sort newest first"));
    else note.append(h("span", {}, "Jobs are listed newest first on your resume. Drag a job or use the arrows to choose your own order."));
    body.append(note);
    var out = {};
    body.append(entriesUI("experience", function (j) { return [j.title, j.employer].filter(Boolean).join(" · "); }, newJob, function (j, b) {
      var n = b.split(".")[1], box = h("div", {});
      out[n] = box;
      return h("div", {class: "grid2"},
        field({path: b + "title", label: "Job title", required: true}),
        field({path: b + "employer", label: "Employer", required: true}),
        field({path: b + "location", label: "City, State", placeholder: "e.g. Columbus, OH"}),
        h("div", {}),
        field({path: b + "start", label: "Start date", required: true, type: "month"}),
        field({path: b + "end", label: "End date", required: !j.current, type: "month"}),
        h("div", {class: "full"}, check(b + "current", "I currently work here", function () { getPath(b.slice(0, -1)).current = this.checked; if (this.checked) getPath(b.slice(0, -1)).end = ""; changed(); show(step, "#" + this.id); })),
        field({path: b + "description", label: "Responsibilities and achievements", type: "textarea", rows: 5, full: true, hint: "One per line. Start with an action verb, like “Trained 6 new cashiers”."}),
        h("div", {class: "full row assist-row"},
          h("button", {type: "button", class: "btn small", onclick: function () { checkWriting(b + "description", box, true); }}, "Improve My Experience Description")),
        h("div", {class: "full"}, box));
    }, "Job"));
  }
  function sortJobs() {
    function k(e) { return (e.current ? "9999-99" : (e.end || e.start || "")) + (e.start || ""); }
    data.experience.sort(function (a, b) { return k(b) < k(a) ? -1 : k(b) > k(a) ? 1 : 0; });
  }

  function stepEducation(body) {
    body.append(check("skipEducation", "Skip education (leave this section off my resume)", function () { data.skipEducation = this.checked; changed(); }));
    body.append(entriesUI("education", function (d) { return [d.credential, d.institution].filter(Boolean).join(" · "); }, newEdu, function (d, b) {
      return h("div", {class: "grid2"},
        field({path: b + "institution", label: "School or institution", required: true}),
        field({path: b + "credential", label: "Degree, diploma or certificate", required: true, placeholder: "e.g. High School Diploma, GED, Associate, Bachelor"}),
        field({path: b + "field", label: "Field of study", placeholder: "e.g. Nursing"}),
        field({path: b + "graduation", label: "Graduation date", type: "month"}),
        h("div", {class: "full"}, check(b + "expected", "Expected (I have not graduated yet)", function () { getPath(b.slice(0, -1)).expected = this.checked; changed(); })),
        field({path: b + "gpa", label: "GPA", placeholder: "Optional, e.g. 3.6", max: 10}),
        field({path: b + "honors", label: "Honors", placeholder: "e.g. Dean's List"}),
        field({path: b + "coursework", label: "Relevant coursework", full: true, placeholder: "e.g. Anatomy, Medical Terminology"}));
    }, "School"));
  }

  // Skill suggestions by job keywords. Prefix: t = Software & Tools, x = Technical, otherwise Professional.
  var SUGGEST = [
    [/cyber|security|soc\b|analyst.*security|infosec/i, ["x:Log analysis", "x:Incident response", "x:Vulnerability management", "x:Network security", "t:Splunk", "t:Wireshark", "t:Microsoft Defender", "Documentation"]],
    [/help ?desk|it support|technician|desktop|system admin|network/i, ["x:Troubleshooting", "x:Active Directory", "x:Windows administration", "t:Ticketing systems", "x:Hardware setup", "Customer service"]],
    [/software|developer|programmer|web|engineer/i, ["x:JavaScript", "x:Python", "x:SQL", "x:REST APIs", "t:Git", "x:Testing"]],
    [/data|analyst|report/i, ["t:Microsoft Excel", "x:SQL", "x:Data visualization", "t:Power BI", "Reporting", "Attention to detail"]],
    [/nurs|cna|medical|health|care ?giver|patient|clinic|pharm/i, ["Patient care", "x:Vital signs", "x:Medication administration", "t:Electronic health records", "x:CPR/BLS", "HIPAA compliance"]],
    [/warehouse|logistic|operation|supply|inventory|distribution/i, ["Inventory control", "Shipping and receiving", "Safety compliance", "x:Forklift operation", "t:Warehouse management systems", "Lean / 5S"]],
    [/driver|delivery|cdl|truck|uber|lyft/i, ["Safe driving", "Route planning", "Customer service", "x:Vehicle inspection", "DOT regulations", "Time management"]],
    [/customer|retail|cashier|sales|store|barista|server|host/i, ["Customer service", "x:Point of sale (POS)", "Cash handling", "Product knowledge", "Teamwork", "Problem solving"]],
    [/admin|office|assistant|reception|secretary|clerk/i, ["Scheduling", "t:Microsoft Office", "Data entry", "Filing and records", "Phone etiquette", "Organization"]],
    [/account|finance|bookkeep|bank|teller|tax/i, ["Accounts payable", "Reconciliation", "t:QuickBooks", "t:Microsoft Excel", "Financial reporting", "Accuracy"]],
    [/teach|education|tutor|school|childcare|daycare/i, ["Lesson planning", "Classroom management", "Child development", "Parent communication", "Patience", "First aid"]],
    [/manager|director|lead|supervisor|executive|head of/i, ["Team leadership", "Budget management", "Performance coaching", "Strategic planning", "Hiring and training", "Stakeholder communication"]],
    [/restaurant|food|cook|chef|kitchen|catering/i, ["Food safety", "Food preparation", "x:ServSafe", "Inventory", "Teamwork", "Working under pressure"]],
    [/market|social media|content|brand|communications/i, ["Social media", "Content writing", "t:Canva", "t:Google Analytics", "Email marketing", "Copywriting"]]
  ];
  var DEFAULT_SUGG = ["Communication", "Teamwork", "Problem solving", "Time management", "Customer service", "t:Microsoft Office"];
  var LANG_SUGG = ["English", "Amharic", "Tigrinya", "Afaan Oromo", "Arabic", "Spanish"];
  function suggestions() {
    var text = [data.personal.headline, data.objective.position, data.objective.industry].join(" "), out = [];
    SUGGEST.forEach(function (s) { if (s[0].test(text)) out = out.concat(s[1]); });
    if (!out.length) out = DEFAULT_SUGG;
    var have = {};
    E.SKILL_GROUPS.forEach(function (g) { data.skills[g.id].forEach(function (s) { have[s.toLowerCase()] = 1; }); });
    var seen = {};
    return out.map(function (s) { var m = /^(t|x):(.*)$/.exec(s); return m ? {group: m[1] === "t" ? "tools" : "technical", name: m[2]} : {group: "professional", name: s}; })
      .filter(function (s) { var k = s.name.toLowerCase(); if (have[k] || seen[k]) return false; seen[k] = 1; return true; }).slice(0, 14);
  }
  function addSkill(group, name) {
    name = String(name || "").replace(/\s+/g, " ").trim().slice(0, 80);
    if (!name) return false;
    var list = data.skills[group];
    if (list.some(function (s) { return s.toLowerCase() === name.toLowerCase(); }) || list.length >= 40) return false;
    list.push(name); return true;
  }
  function chipGroup(g, required) {
    var id = "f-skills-" + g.id, input = h("input", {id: id, type: "text", maxlength: 80, autocomplete: "off", "aria-describedby": id + "-err"});
    input.dataset.chip = g.id;
    var chips = h("ul", {class: "chips", lang: "en", "aria-label": g.label});
    data.skills[g.id].forEach(function (s, n) {
      chips.append(h("li", {class: "chip"}, s, h("button", {type: "button", "aria-label": "Remove " + s, onclick: function () { data.skills[g.id].splice(n, 1); changed(); show(step, "#" + id); }}, "×")));
    });
    function commit() {
      var parts = input.value.split(/[,;\n]/), added = false;
      parts.forEach(function (p) { added = addSkill(g.id, p) || added; });
      input.value = ""; if (added) { changed(); show(step, "#" + id); }
    }
    input.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === ",") { ev.preventDefault(); commit(); } });
    return h("div", {class: "field full"},
      h("label", {for: id}, h("span", {}, g.label), required ? h("span", {class: "req", "aria-hidden": "true"}, "*") : null),
      chips,
      h("div", {class: "chip-add"}, input, h("button", {type: "button", class: "btn small", onclick: commit}, "Add")),
      h("p", {class: "err", id: id + "-err", hidden: true}));
  }
  var SKILL_LABELS = {professional: "Professional skills", technical: "Technical skills", tools: "Software and tools", languages: "Languages", leadership: "Leadership skills", industry: "Industry knowledge"};
  function stepSkills(body) {
    var sugg = suggestions(), boxes = [];
    if (sugg.length) {
      var confirmBoxEl = h("input", {type: "checkbox", id: "skillConfirm"}), addBtn;
      var wrap = h("div", {class: "sugg", lang: "en"}, sugg.map(function (s, i) {
        var c = h("input", {type: "checkbox", id: "sg" + i}); boxes.push([c, s]);
        return h("label", {class: "check", for: "sg" + i}, c, h("span", {}, s.name));
      }));
      addBtn = h("button", {type: "button", class: "btn small", disabled: true, onclick: function () {
        var n = 0; boxes.forEach(function (b) { if (b[0].checked && addSkill(b[1].group, b[1].name)) n++; });
        if (n) { changed(); show(step); status("Skills added."); }
      }}, "Add the skills I checked");
      confirmBoxEl.addEventListener("change", function () { addBtn.disabled = !confirmBoxEl.checked; });
      body.append(h("div", {class: "callout"}, h("h4", {}, "Suggested skills for your target job"),
        h("p", {}, "Check only the skills you really have. Employers may ask you about any skill on your resume."), wrap,
        h("label", {class: "check", for: "skillConfirm"}, confirmBoxEl, h("span", {}, "I confirm I have the skills I checked and can give an example of each.")), addBtn));
    }
    var langWrap = h("div", {class: "sugg"}, LANG_SUGG.filter(function (l) { return !data.skills.languages.some(function (s) { return s.toLowerCase() === l.toLowerCase(); }); }).map(function (l) {
      return h("button", {type: "button", class: "btn small", onclick: function () { if (addSkill("languages", l)) { changed(); show(step); } }}, "+ " + l);
    }));
    body.append(h("div", {class: "grid2"}, E.SKILL_GROUPS.map(function (g) {
      var el = chipGroup({id: g.id, label: SKILL_LABELS[g.id]}, g.id === "professional");
      if (g.id === "languages") el.append(h("p", {class: "hint"}, "Quick add a language you speak:"), langWrap);
      return el;
    })));
  }

  function stepCerts(body) {
    if (!data.certifications.length) body.append(h("p", {class: "hint"}, "No certifications added. This section is optional; press Next to skip it."));
    body.append(entriesUI("certifications", function (c) { return c.name; }, newCert, function (c, b) {
      return h("div", {class: "grid2"},
        field({path: b + "name", label: "Certification or license name", required: true, full: true, placeholder: "e.g. CompTIA Security+, CNA, Food Handler"}),
        field({path: b + "issuer", label: "Issuing organization"}),
        field({path: b + "url", label: "Credential link", placeholder: "Optional verification link"}),
        field({path: b + "issued", label: "Issue date", type: "month"}),
        field({path: b + "expires", label: "Expiration date", type: "month"}));
    }, "Certification"));
  }

  function stepExtras(body) {
    if (!data.extras.length) body.append(h("p", {class: "hint"}, "Nothing added yet. This section is optional; press Next to skip it."));
    var outs = {};
    body.append(entriesUI("extras", function (x) { return x.title; }, newExtra, function (x, b) {
      var box = h("div", {});
      return h("div", {class: "grid2"},
        field({path: b + "type", label: "Section", required: true, type: "select", options: [["", "Select one"]].concat(E.EXTRA_TYPES.map(function (t) { return [t.id, t.label]; }))}),
        field({path: b + "title", label: "Title", required: true, placeholder: "e.g. Volunteer tutor, Dean's List, Home lab project"}),
        field({path: b + "organization", label: "Organization", placeholder: "e.g. Ethiopian Community Center"}),
        field({path: b + "date", label: "Date", type: "month"}),
        field({path: b + "description", label: "Details", type: "textarea", rows: 3, full: true, hint: "Optional. One point per line."}),
        field({path: b + "url", label: "Link", full: true, placeholder: "Optional"}),
        h("div", {class: "full row assist-row"}, h("button", {type: "button", class: "btn small", onclick: function () { checkWriting(b + "description", box, true); }}, "Check my writing")),
        h("div", {class: "full"}, box));
    }, "Item"));
  }

  // ---------- review ----------
  function checklist() {
    var p = data.personal, items = [];
    function it(ok, text, stepIdx, level) { items.push({ok: ok, text: text, step: stepIdx, level: level || "required"}); }
    it(!!p.name.trim(), "Full name", 0); it(reEmail.test(p.email.trim()), "Email address", 0); it(p.phone.replace(/\D/g, "").length >= 10, "Phone number", 0);
    it(!!(p.city.trim() && p.state.trim()), "City and state", 0); it(!!p.headline.trim(), "Professional headline", 0);
    it(!!(data.objective.position.trim() && data.objective.industry.trim() && data.objective.strengths.trim()), "Career objective", 1);
    it(data.summary.trim().length >= 40, "Professional summary (recommended)", 1, "tip");
    var jobs = data.experience.filter(function (j) { return j.title.trim() && j.employer.trim(); });
    it(jobs.length > 0 || data.firstTime, "Work experience", 2);
    if (jobs.length) it(jobs.every(function (j) { return E.bullets(j.description).length; }), "Responsibilities for every job (recommended)", 2, "tip");
    it(data.skipEducation || data.education.some(function (d) { return d.institution.trim() && d.credential.trim(); }), "Education", 3);
    it(data.skills.professional.length > 0, "Professional skills", 4);
    it(E.SKILL_GROUPS.reduce(function (n, g) { return n + data.skills[g.id].length; }, 0) >= 5, "At least 5 skills in total (recommended)", 4, "tip");
    return items;
  }
  function firstInvalidStep() { for (var i = 0; i < 7; i++) if (validate(i).length) return i; return -1; }

  function stepReview(body) {
    var items = checklist(), done = items.filter(function (x) { return x.ok; }).length, pct = Math.round(100 * done / items.length);
    var bar = h("span", {}); bar.style.width = pct + "%";
    body.append(h("div", {class: "meter"}, h("strong", {}, pct + "%"), h("div", {class: "bar", role: "progressbar", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": pct, "aria-label": "Resume completion"}, bar)));
    body.append(h("ul", {class: "checklist"}, items.map(function (x) {
      return h("li", {class: x.ok ? "ok" : x.level === "tip" ? "tip" : "missing"},
        h("span", {class: "mark", "aria-hidden": "true"}, x.ok ? "✓" : x.level === "tip" ? "•" : "!"),
        h("span", {class: "txt"}, h("span", {}, x.text), h("span", {class: "sr-only"}, x.ok ? " — complete" : x.level === "tip" ? " — suggestion" : " — missing")),
        x.ok ? null : h("button", {type: "button", class: "btn small", onclick: function () { show(x.step); }}, "Fix this"));
    })));
    body.append(h("div", {class: "review-actions"},
      h("button", {type: "button", class: "btn", onclick: function () { show(0); }}, "Edit my answers"),
      h("button", {type: "button", class: "btn", onclick: function () { document.getElementById("templates").scrollIntoView(); var s = document.querySelector(".tcard.selected .use") || document.querySelector(".tcard .use"); if (s) s.focus({preventScroll: true}); }}, "Change template"),
      h("button", {type: "button", class: "btn", onclick: openUserPreview}, "Preview full size")));
    var bad = firstInvalidStep();
    var dl = h("div", {class: "downloads", id: "downloads"});
    if (bad >= 0) {
      dl.append(h("h4", {}, "Almost there"), h("p", {}, "Some required information is missing. Fix the items marked above, then come back to generate your resume."),
        h("button", {type: "button", class: "btn primary", onclick: function () { show(bad); setTimeout(function () { showErrors(validate(bad)); }, 0); }}, "Go to the first missing item"));
    } else {
      var note = h("p", {class: "dl-note", id: "dlNote", role: "status"});
      dl.append(h("h4", {}, "Generate my resume"), h("p", {}, "All three files contain the same information. Use the PDF to apply online, the Word file to make your own edits, and the plain-text version for application forms that ask you to paste your resume."),
        h("div", {class: "dl-grid"},
          h("button", {type: "button", class: "btn primary", id: "dlPdf", onclick: function () { generate("pdf", note); }}, h("span", {}, "Download PDF"), h("small", {}, "Best for applying online")),
          h("button", {type: "button", class: "btn", id: "dlDocx", onclick: function () { generate("docx", note); }}, h("span", {}, "Download Word (.docx)"), h("small", {}, "Editable in Word or Google Docs")),
          h("button", {type: "button", class: "btn", id: "dlTxt", onclick: function () { generate("txt", note); }}, h("span", {}, "Download plain text (.txt)"), h("small", {}, "For copy-and-paste forms"))),
        note);
    }
    body.append(dl);
    body.append(tailorPanel());
  }

  // ---------- writing helpers (on-device; they never add facts) ----------
  var VAGUE = [
    [/\bresponsible for\b/i, "“Responsible for” describes a duty, not what you did. Start with an action verb that is accurate, like Managed, Handled or Coordinated."],
    [/\b(helped|assisted) with\b/i, "“Helped with” is vague. Say what you actually did."],
    [/\bduties included\b/i, "“Duties included” is vague. List what you did, one action per line."],
    [/\bworked on\b/i, "“Worked on” is vague. Name the task or result."],
    [/\b(various|many|several|a lot of|lots of|etc\.?)\b/i, "Words like “various”, “many” or “etc.” are vague. If you know the real number or names, use them. Don't guess."],
    [/\b(hard[- ]working|team player|go[- ]getter|detail[- ]oriented|self[- ]starter|results[- ]driven)\b/i, "Common buzzwords say little on their own. Show the quality with something you did."],
    [/\b(I|me|my)\b/, "Resumes usually leave out “I”, “me” and “my”."]
  ];
  var VERBS = ["Managed", "Coordinated", "Organized", "Trained", "Assisted", "Prepared", "Resolved", "Served", "Tracked", "Maintained", "Scheduled", "Supported", "Improved", "Created", "Led"];
  function tidyLine(l) {
    l = l.replace(/^\s*[-–—•*●▪]+\s*/, "").replace(/\s+/g, " ").trim()
      .replace(/^(I was|I am|I)\s+/i, "").replace(/^(my (job|role|duties) (was|were|included) (to )?)/i, "")
      .replace(/\b(\w+) \1\b/gi, "$1").replace(/\s+([,.;:])/g, "$1").replace(/\bi\b/g, "I").replace(/[.;]+$/, "");
    return l ? l.charAt(0).toUpperCase() + l.slice(1) : l;
  }
  function tidy(text, asBullets) {
    var lines = String(text || "").split(/\r?\n/).filter(function (l) { return l.trim(); });
    if (asBullets && lines.length === 1 && /[.;]\s+\S/.test(lines[0])) lines = lines[0].replace(/([.;])\s+(?=[A-Z])/g, "$1\n").split("\n");
    if (!asBullets) { var t = lines.join(" ").replace(/\s+/g, " ").trim().replace(/\bi\b/g, "I").replace(/\b(\w+) \1\b/gi, "$1"); return t && !/[.!?]$/.test(t) ? t + "." : t; }
    return lines.map(tidyLine).filter(Boolean).join("\n");
  }
  function checkWriting(path, box, asBullets) {
    var text = getPath(path) || "";
    box.textContent = "";
    if (!text.trim()) { box.append(h("div", {class: "assist"}, h("p", {}, "Write something first, then press the button again."))); return; }
    var flags = [];
    VAGUE.forEach(function (v) { if (v[0].test(text)) flags.push(v[1]); });
    if (asBullets && !/\d/.test(text)) flags.push("Numbers make results clear (team size, customers per day, items per shift). Add them only if you know them.");
    var cleaned = tidy(text, asBullets), panel = h("div", {class: "assist"});
    panel.append(h("h5", {}, "Suggestions"));
    if (flags.length) panel.append(h("ul", {class: "flags"}, flags.map(function (f) { return h("li", {}, f); })));
    else panel.append(h("p", {}, "No vague phrases found."));
    if (asBullets) panel.append(h("p", {}, h("span", {}, "Action verbs to consider, only if they are accurate:"), " ", h("span", {lang: "en"}, VERBS.join(", "))));
    if (cleaned !== text.trim()) {
      panel.append(h("h5", {}, "Cleaned-up version"), h("p", {class: "hint"}, "Same facts, tidier formatting: one point per line, capital letters, no trailing periods and no “I”."), h("pre", {lang: "en"}, cleaned),
        h("div", {class: "row"},
          h("button", {type: "button", class: "btn small primary", onclick: function () { setPath(path, cleaned); changed(); var f = fieldEl(path); if (f) f.value = cleaned; box.textContent = ""; status("Updated. Review it and make sure it is accurate."); if (f) f.focus(); }}, "Use this version"),
          h("button", {type: "button", class: "btn small", onclick: function () { box.textContent = ""; }}, "Keep mine")));
    }
    panel.append(h("p", {class: "hint"}, "The helper never adds jobs, skills, numbers or results you did not write."));
    box.append(panel);
  }
  function suggestSummary(box) {
    var o = data.objective, p = data.personal, role = (p.headline || o.position).trim(), yrs = parseInt(o.years, 10);
    box.textContent = "";
    if (!role || !o.strengths.trim()) { box.append(h("div", {class: "assist"}, h("p", {}, "Fill in the position and your strongest skills first."))); return; }
    var s = role.charAt(0).toUpperCase() + role.slice(1);
    if (yrs > 0) s += " with " + yrs + " year" + (yrs === 1 ? "" : "s") + " of experience";
    if (o.industry.trim()) s += (yrs > 0 ? " in " : " in the ") + o.industry.trim().replace(/\.$/, "") + (yrs > 0 ? "" : " field");
    s += ". Strengths include " + o.strengths.trim().replace(/\.$/, "") + ".";
    if (o.why.trim()) s += " " + tidy(o.why, false);
    var target = o.position.trim() || role;
    s += " Seeking " + (/^[aeiou]/i.test(target) ? "an " : "a ") + target + " position.";
    box.append(h("div", {class: "assist"}, h("h5", {}, "Suggested summary"), h("p", {class: "hint"}, "Built only from your answers above. Edit it so it sounds like you."), h("pre", {lang: "en"}, s),
      h("div", {class: "row"},
        h("button", {type: "button", class: "btn small primary", onclick: function () { data.summary = s; changed(); var f = fieldEl("summary"); if (f) { f.value = s; f.focus(); } box.textContent = ""; status("Summary added. Review and edit it."); }}, data.summary.trim() ? "Replace my summary" : "Use this summary"),
        h("button", {type: "button", class: "btn small", onclick: function () { box.textContent = ""; }}, "No thanks"))));
  }

  // Job-description keyword comparison. Not an ATS score: it lists words, it does not rate the resume.
  var STOP = ("a about above across after again all also am an and any are as at be because been before being below between both but by can could did do does doing down during each either etc every few for from further had has have having he her here hers him his how i if in into is it its itself just less may me might more most must my no nor not now of off on once only or other our out over own per please same she should so some such than that the their them then there these they this those through to too under until up upon us very via was we were what when where which while who whom why will with within without would you your yours " +
    "ability able applicant applicants apply candidate candidates company duties employee employees employer equal etc including job jobs looking opportunity position preferred required requirement requirements responsibilities role skills strong team work working year years experience plus degree new one two three day days week weeks month months time full part benefits pay salary hour hours hourly status related related include includes based well good great excellent ensure provide support perform performs").split(" ");
  var STOPSET = {}; STOP.forEach(function (w) { STOPSET[w] = 1; });
  var PHRASES = []; SUGGEST.forEach(function (s) { s[1].forEach(function (x) { PHRASES.push(x.replace(/^[tx]:/, "")); }); });
  PHRASES = PHRASES.concat(["customer service", "project management", "time management", "data entry", "microsoft office", "microsoft excel", "attention to detail", "problem solving", "written communication", "verbal communication", "bilingual", "valid driver's license", "forklift", "inventory management", "quality control", "conflict resolution"]);
  function keywords(jd) {
    var low = jd.toLowerCase(), found = {}, out = [];
    PHRASES.forEach(function (p) { if (low.indexOf(p.toLowerCase()) >= 0 && !found[p.toLowerCase()]) { found[p.toLowerCase()] = 1; out.push(p); } });
    var counts = {};
    (low.match(/[a-z][a-z0-9+#./-]{2,}/g) || []).forEach(function (w) { w = w.replace(/[./-]+$/, ""); if (w.length < 3 || STOPSET[w]) return; counts[w] = (counts[w] || 0) + 1; });
    Object.keys(counts).filter(function (w) { return counts[w] >= 2 && !out.some(function (p) { return p.toLowerCase().indexOf(w) >= 0; }); })
      .sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, 20).forEach(function (w) { out.push(w); });
    return out.slice(0, 30);
  }
  function tailorPanel() {
    var ta = h("textarea", {id: "jdText", rows: 6, maxlength: 20000, "aria-describedby": "jdHint"}), out = h("div", {});
    var run = function () {
      out.textContent = "";
      var jd = ta.value.trim();
      if (jd.length < 80) { out.append(h("p", {class: "err"}, "Paste the full job description first.")); return; }
      var mine = E.toText(E.buildDocument(data)).toLowerCase(), kw = keywords(jd);
      var has = kw.filter(function (k) { return mine.indexOf(k.toLowerCase()) >= 0; }), miss = kw.filter(function (k) { return mine.indexOf(k.toLowerCase()) < 0; });
      var boxes = [], confirmEl = h("input", {type: "checkbox", id: "kwConfirm"}), addBtn = h("button", {type: "button", class: "btn small", disabled: true, onclick: function () {
        var n = 0; boxes.forEach(function (b) { if (b[0].checked && addSkill("professional", b[1])) n++; });
        if (n) { changed(); show(step); status("Skills added. Make sure your experience supports them."); }
      }}, "Add checked words to my skills");
      confirmEl.addEventListener("change", function () { addBtn.disabled = !confirmEl.checked; });
      out.append(h("div", {class: "assist"},
        h("h5", {}, "Already on your resume"),
        has.length ? h("ul", {class: "chips", lang: "en"}, has.map(function (k) { return h("li", {class: "chip"}, k); })) : h("p", {}, "None of the main keywords were found yet."),
        h("h5", {}, "In the job description but not on your resume"),
        h("p", {class: "hint"}, "Add a word only if it is true for you. You can also mention it in your job descriptions."),
        miss.length ? h("div", {class: "sugg", lang: "en"}, miss.map(function (k, i) { var c = h("input", {type: "checkbox", id: "kw" + i}); boxes.push([c, k]); return h("label", {class: "check", for: "kw" + i}, c, h("span", {}, k)); })) : h("p", {}, "Nothing obvious is missing."),
        miss.length ? h("label", {class: "check", for: "kwConfirm"}, confirmEl, h("span", {}, "I confirm I have the skills I checked.")) : null,
        miss.length ? addBtn : null,
        h("p", {class: "hint"}, "This is a keyword check, not a score. No tool can promise how an employer's system will rank a resume.")));
    };
    return h("div", {class: "callout", id: "tailor"},
      h("h4", {}, "Tailor My Resume to a Job Description"),
      h("p", {id: "jdHint"}, "Paste a job posting to see which of its keywords your resume already covers. The text stays on your device and is not saved."),
      h("label", {class: "sr-only", for: "jdText"}, "Job description"), ta,
      h("p", {}, h("button", {type: "button", class: "btn small primary", onclick: run}, "Compare with my resume")), out);
  }

  // ---------- rendering ----------
  function show(i, focusSel) {
    step = Math.max(0, Math.min(STEPS.length - 1, i)); maxStep = Math.max(maxStep, step);
    var s = STEPS[step], body = $("stepBody");
    $("stepCount").textContent = "";
    $("stepCount").append(h("span", {}, "Step"), " " + (step + 1) + " / " + STEPS.length);
    $("stepTitle").textContent = s.title; $("stepIntro").textContent = s.intro;
    body.textContent = ""; clearErrors();
    s.render(body);
    $("backBtn").hidden = step === 0;
    $("nextBtn").hidden = step === STEPS.length - 1;
    document.querySelector(".req-note").hidden = step === STEPS.length - 1;
    renderStepper();
    $("progressBar").style.width = Math.round(100 * step / (STEPS.length - 1)) + "%";
    renderLive();
    if (focusSel) { var f = document.querySelector(focusSel); if (f) { f.focus(); return; } }
  }
  function renderStepper() {
    var ol = $("stepper"); ol.textContent = "";
    STEPS.forEach(function (s, i) {
      var b = h("button", {type: "button", class: i < step || (i <= maxStep && !validate(i).length && i !== step) ? "done" : "", "aria-current": i === step ? "step" : null, disabled: i > maxStep, "aria-label": (i + 1) + ". " + s.title},
        h("b", {"aria-hidden": "true"}, i + 1), h("span", {}, s.short));
      b.addEventListener("click", function () { go(i); });
      ol.append(h("li", {}, b));
    });
  }
  // Skills typed but not yet added with Enter or Add are kept when the visitor moves on.
  function flushChips() {
    var added = false;
    document.querySelectorAll("#stepBody [data-chip]").forEach(function (inp) {
      inp.value.split(/[,;\n]/).forEach(function (p) { added = addSkill(inp.dataset.chip, p) || added; });
      inp.value = "";
    });
    if (added) changed();
  }
  function go(i) {
    flushChips();
    // Moving forward checks each step on the way; moving back is always allowed.
    for (var k = step; k < i; k++) { var errs = validate(k); if (errs.length) { if (k !== step) show(k); showErrors(errs); return; } }
    persist(); show(i); $("stepTitle").focus();
  }

  function scaleInto(container, docEl, width) {
    var s = width / 816; docEl.style.transform = "scale(" + s + ")";
    container.style.width = width + "px";
    container.style.height = Math.ceil(Math.max(1056, docEl.scrollHeight) * s) + "px";
  }
  function docNode(d) { var t = document.createElement("template"); t.innerHTML = E.toHTML(E.buildDocument(d)); return t.content.firstChild; }
  function renderLive() {
    var frame = $("liveFrame"), page = $("livePage");
    if (!frame || !frame.offsetParent) return;
    page.textContent = ""; var el = docNode(data); page.append(el);
    scaleInto(page, el, frame.clientWidth - 28);
  }
  function openUserPreview() { openDialog(data, "Your resume preview", false); }
  function openDialog(d, title, offerUse) {
    var dlg = $("previewDialog"); $("previewDialogTitle").textContent = title;
    var page = $("dialogPage"); page.textContent = ""; var el = docNode(d); page.append(el);
    var foot = $("dialogFoot"); foot.textContent = "";
    if (offerUse) {
      foot.append(h("p", {class: "note"}, "Sample content. Your own information replaces it."),
        h("button", {type: "button", class: "btn primary", onclick: function () { dlg.close(); useTemplate(d.template); }}, "Use This Template"));
    }
    dlg.showModal();
    scaleInto(page, el, Math.min(816, $("dialogFrame").clientWidth - 28));
  }

  // ---------- gallery ----------
  function renderGallery() {
    var g = $("gallery"); g.textContent = "";
    E.TEMPLATES.forEach(function (t) {
      var thumb = h("div", {class: "thumb", lang: "en"}), el = docNode(E.SAMPLES[t.id]); thumb.append(el);
      var card = h("article", {class: "tcard" + (data.template === t.id ? " selected" : ""), "data-template": t.id, "aria-labelledby": "tn-" + t.id},
        h("div", {class: "tthumb"}, h("span", {class: "badge"}, "✓ Selected"), thumb),
        h("div", {class: "tbody"}, h("h3", {id: "tn-" + t.id}, t.name), h("p", {class: "tag"}, t.tagline), h("p", {class: "best"}, h("b", {}, "Best for:"), " ", h("span", {}, t.bestFor)),
          h("div", {class: "tactions"},
            h("button", {type: "button", class: "btn", onclick: function () { openDialog(E.SAMPLES[t.id], t.name, true); }}, "Preview Template"),
            h("button", {type: "button", class: "btn primary use", "aria-pressed": data.template === t.id ? "true" : "false", onclick: function () { useTemplate(t.id); }}, data.template === t.id ? "Selected" : "Use This Template"))));
      g.append(card);
    });
    sizeThumbs();
  }
  function sizeThumbs() {
    document.querySelectorAll("#gallery .thumb").forEach(function (th) {
      var el = th.firstChild, w = th.parentNode.clientWidth - 36, s = w / 816;
      el.style.transform = "scale(" + s + ")"; th.style.height = Math.round(1056 * s * 0.62) + "px";
    });
    document.querySelectorAll("#heroFan .thumb").forEach(function (th) { var el = th.firstChild, s = 250 / 816; el.style.transform = "scale(" + s + ")"; th.style.height = Math.round(1056 * s) + "px"; });
  }
  function renderHero() {
    var fan = $("heroFan"); if (!fan) return;
    ["executive", "modern", "technology"].forEach(function (id) { var th = h("div", {class: "thumb"}); th.append(docNode(E.SAMPLES[id])); fan.append(th); });
  }
  function useTemplate(id) {
    var first = !data.template;
    data.template = id; persist(); renderGallery(); fillTplSelect();
    var b = $("builder"); b.hidden = false;
    show(first ? 0 : step);
    b.scrollIntoView({behavior: "smooth"});
    $("builderTitle").focus({preventScroll: true});
    status(first ? "Template selected. Start with your contact information." : "Template changed. Your answers were kept.");
  }
  function fillTplSelect() {
    var s = $("tplSelect"); s.textContent = "";
    E.TEMPLATES.forEach(function (t) { s.append(h("option", {value: t.id}, t.name)); });
    s.value = data.template || "modern";
  }

  // ---------- downloads ----------
  var loading = {};
  function loadLib(src) {
    if (!loading[src]) loading[src] = new Promise(function (ok, fail) {
      var s = document.createElement("script"); s.src = src; s.async = true;
      s.onload = ok; s.onerror = function () { delete loading[src]; fail(new Error("load")); };
      document.head.append(s);
    });
    return loading[src];
  }
  function fileBase() { return (data.personal.name.normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") || "My") + "-Resume"; }
  function save(blob, name) {
    var a = document.createElement("a"), url = URL.createObjectURL(blob);
    a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
  }
  function generate(kind, note) {
    var errs = firstInvalidStep(); if (errs >= 0) { show(errs); return; }
    var doc = E.buildDocument(data), btn = $(kind === "pdf" ? "dlPdf" : kind === "docx" ? "dlDocx" : "dlTxt");
    note.classList.remove("warn"); note.textContent = "Preparing your file…"; btn.disabled = true;
    var done = function (msg, warn) { btn.disabled = false; note.textContent = msg; note.classList.toggle("warn", !!warn); };
    if (kind === "txt") { save(new Blob([E.toText(doc)], {type: "text/plain;charset=utf-8"}), fileBase() + ".txt"); done("Plain-text resume downloaded."); return; }
    if (kind === "pdf") loadLib(LIBS.pdf).then(function () {
      var r = E.toPDF(doc, window.jspdf.jsPDF); save(r.blob, fileBase() + ".pdf");
      if (r.replaced) done("PDF downloaded. Some characters, such as Amharic letters, can't be shown in this PDF and were replaced with “?”. Use the Word download for those, or write those words in English letters.", true);
      else done(r.pages === 1 ? "PDF downloaded (1 page)." : "PDF downloaded (" + r.pages + " pages).");
    }).catch(function () { done("The PDF tool could not load. Check your connection and try again.", true); });
    if (kind === "docx") loadLib(LIBS.docx).then(function () { return E.toDOCX(doc, window.docx); }).then(function (blob) {
      save(blob, fileBase() + ".docx"); done("Word document downloaded.");
    }).catch(function () { done("The Word tool could not load. Check your connection and try again.", true); });
  }

  // ---------- confirm dialog ----------
  function confirmBox(title, text, yes, onYes) {
    var d = $("confirmDialog"); $("confirmTitle").textContent = title; $("confirmText").textContent = text; $("confirmYes").textContent = yes;
    $("confirmYes").onclick = function () { d.close(); onYes(); };
    $("confirmNo").onclick = function () { d.close(); };
    d.showModal(); $("confirmNo").focus();
  }

  // ---------- events ----------
  function init() {
    var had = load();
    renderHero(); renderGallery(); fillTplSelect();
    if (had && data.template) { $("continueDraft").hidden = false; $("builder").hidden = false; show(0); }
    $("continueDraft").addEventListener("click", function () { $("builder").scrollIntoView({behavior: "smooth"}); $("builderTitle").focus({preventScroll: true}); });
    $("stepBody").addEventListener("input", function (ev) {
      var t = ev.target, p = t.dataset && t.dataset.path;
      if (!p || t.type === "checkbox") return;
      setPath(p, t.value);
      if (t.getAttribute("aria-invalid") === "true") { var still = validate(step).some(function (e) { return e.path === p; }); if (!still) { t.removeAttribute("aria-invalid"); var m = document.getElementById(t.id + "-err"); if (m) { m.hidden = true; m.textContent = ""; } } }
      changed();
    });
    $("stepForm").addEventListener("submit", function (ev) { ev.preventDefault(); go(step + 1); });
    $("backBtn").addEventListener("click", function () { persist(); show(step - 1); $("stepTitle").focus(); });
    $("previewBtn").addEventListener("click", openUserPreview);
    $("closePreview").addEventListener("click", function () { $("previewDialog").close(); });
    $("tplSelect").addEventListener("change", function () { data.template = this.value; persist(); renderGallery(); renderLive(); status("Template changed. Your answers were kept."); });
    $("saveDraft").addEventListener("click", function () { var ok = persist(); status(ok ? "Draft saved on this device." : "This browser is not allowing saving. Use “Download draft backup” instead.", !ok); });
    $("exportDraft").addEventListener("click", function () { save(new Blob([JSON.stringify(data, null, 2)], {type: "application/json"}), fileBase() + "-draft.json"); status("Draft backup downloaded. Keep it somewhere private."); });
    $("importDraft").addEventListener("click", function () { $("importFile").click(); });
    $("importFile").addEventListener("change", function () {
      var f = this.files[0]; this.value = "";
      if (!f) return;
      if (f.size > 1000000) { status("That file is too large to be a resume draft.", true); return; }
      f.text().then(function (txt) {
        var parsed; try { parsed = JSON.parse(txt); } catch (e) { status("That file isn't a resume draft backup.", true); return; }
        if (!parsed || parsed.version !== 1 || !parsed.personal) { status("That file isn't a resume draft backup.", true); return; }
        confirmBox("Replace your current draft?", "The backup will replace what is in the builder now.", "Replace my draft", function () {
          data = normalize(parsed); if (!data.template) data.template = "modern"; persist(); maxStep = 7; renderGallery(); fillTplSelect(); $("builder").hidden = false; show(0); status("Draft restored.");
        });
      });
    });
    $("deleteDraft").addEventListener("click", function () {
      confirmBox("Delete your resume draft?", "This removes everything you entered from this browser. Download a backup first if you need one.", "Yes, delete my draft", function () {
        try { localStorage.removeItem(KEY); } catch (e) {}
        data = blank(); step = 0; maxStep = 0; $("builder").hidden = true; $("continueDraft").hidden = true; renderGallery();
        document.getElementById("templates").scrollIntoView(); status("Draft deleted.");
      });
    });
    var rt = 0;
    window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { sizeThumbs(); renderLive(); }, 150); });
    if (window.ResizeObserver) new ResizeObserver(function () { sizeThumbs(); }).observe($("gallery"));
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
  window.HHResume = {get data() { return data; }, validate: validate, AI: AI};
})();
