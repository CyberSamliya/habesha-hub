(function () {
  'use strict';
  // Family Hub: membership gate, family introductions, family board and A to Z lessons.
  // Membership and lesson progress are kept in this browser. Posts are sent to
  // Habesha Hub by email for review, then published in family-hub-data.js.
  const D = window.FAMILY_HUB || { lessons: [], introductions: [], announcements: [], contactEmail: 'info@habeshahubusa.com' };
  const KEY = 'hh-family-member', PKEY = 'hh-family-lessons';
  const $ = id => document.getElementById(id);
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage blocked: session only */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };
  let member = store.get(KEY, null);
  let done = new Set(store.get(PKEY, []));
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const mail = (subject, body) => 'mailto:' + D.contactEmail + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  const who = () => member.name + ' (' + member.family + '), ' + member.city + ', ' + member.state + (member.parish ? '\nParish: ' + member.parish : '');

  function showHub() {
    const joined = !!member;
    $('join').hidden = joined;
    $('hub').hidden = !joined;
    $('fhWelcome').hidden = !joined;
    if (!joined) return;
    $('fhWelcome').textContent = 'Welcome, ' + member.name + '. Selam to the ' + member.family + '!';
    renderMember();
  }

  $('joinForm').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target, v = n => f.elements[n].value.trim();
    const missing = [['name', 'Full name'], ['family', 'Family name'], ['city', 'City'], ['state', 'State']].filter(([n]) => !v(n));
    const err = $('joinError');
    if (missing.length) { err.textContent = 'Please fill in: ' + missing.map(([, l]) => l).join(', ') + '.'; f.elements[missing[0][0]].focus(); return; }
    if (v('email') && !f.elements.email.checkValidity()) { err.textContent = 'Please check your email address.'; f.elements.email.focus(); return; }
    if (!f.elements.agree.checked) { err.textContent = 'Please agree to the family guidelines to join.'; f.elements.agree.focus(); return; }
    err.textContent = '';
    member = { name: v('name'), family: v('family'), city: v('city'), state: v('state'), parish: v('parish'), email: v('email'), joined: new Date().toISOString().slice(0, 10) };
    store.set(KEY, member);
    showHub();
    $('hub').querySelector('h2').focus({ preventScroll: true });
    $('intro').scrollIntoView();
  });

  function renderMember() {
    const dl = $('memberInfo'); dl.textContent = '';
    for (const [k, label] of [['name', 'Name'], ['family', 'Family'], ['city', 'City'], ['state', 'State'], ['parish', 'Parish'], ['email', 'Email'], ['joined', 'Joined']]) {
      if (!member[k]) continue; dl.append(el('dt', '', label), el('dd', '', member[k]));
    }
    dl.append(el('dt', '', 'Lessons learned'), el('dd', '', done.size + ' of ' + D.lessons.length));
    $('memberSend').href = mail('Family Hub membership: ' + member.family, 'Please add me to the Habesha Hub Family Hub.\n\n' + who() + (member.email ? '\nEmail: ' + member.email : '') + '\nJoined: ' + member.joined);
  }
  $('leaveBtn').addEventListener('click', () => {
    if (!confirm('Leave the Family Hub on this device? Your lesson progress here will also be cleared.')) return;
    store.del(KEY); store.del(PKEY); member = null; done = new Set(); renderLessons(); showHub(); $('jName').focus();
  });

  // Our families
  function renderIntros() {
    const box = $('introList'); box.textContent = '';
    if (!D.introductions.length) { box.append(el('p', 'fh-empty', 'No introductions are published yet. Be the first family to introduce yourselves below.')); return; }
    for (const x of D.introductions) {
      const c = el('article', 'fh-card fh-family');
      c.append(el('h3', '', x.family), el('p', 'fh-meta', [x.city, x.state].filter(Boolean).join(', ') + (x.parish ? ' · ' + x.parish : '')), el('p', '', x.text));
      box.append(c);
    }
  }
  function prepare(formId, textId, errId, readyId, sendId, subject) {
    $(formId).addEventListener('submit', e => {
      e.preventDefault();
      const text = $(textId).value.trim();
      if (text.length < 10) { $(errId).textContent = 'Please write a little more (at least 10 characters).'; $(textId).focus(); return; }
      $(errId).textContent = '';
      const kind = formId === 'postForm' ? $('pType').value : 'Family introduction';
      $(sendId).href = mail(subject(kind), kind + '\n\n' + text + '\n\nFrom: ' + who());
      $(readyId).hidden = false; $(sendId).focus();
    });
  }
  prepare('introForm', 'iText', 'introError', 'introReady', 'introSend', () => 'Family Hub introduction: ' + member.family);
  prepare('postForm', 'pText', 'postError', 'postReady', 'postSend', kind => 'Family Hub board: ' + kind);

  // Family board
  function renderBoard() {
    const box = $('boardList'); box.textContent = '';
    const posts = D.announcements.slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
    if (!posts.length) { box.append(el('p', 'fh-empty', 'No posts yet.')); return; }
    for (const p of posts) {
      const c = el('article', 'fh-card fh-post');
      c.append(el('h3', '', p.title), el('p', 'fh-meta', (p.from || 'Habesha Hub') + (p.date ? ' · ' + p.date : '')), el('p', '', p.text));
      box.append(c);
    }
  }

  // Lessons A to Z
  let current = 0;
  function renderLessons() {
    const box = $('letters'); box.textContent = '';
    D.lessons.forEach((l, i) => {
      const b = el('button', 'fh-letter' + (done.has(l.letter) ? ' done' : '') + (i === current ? ' on' : ''), l.letter);
      b.type = 'button'; b.setAttribute('role', 'listitem');
      b.setAttribute('aria-label', l.letter + ': ' + l.title + (done.has(l.letter) ? ', learned' : ''));
      if (i === current) b.setAttribute('aria-current', 'true');
      b.addEventListener('click', () => { current = i; renderLessons(); $('lesson').focus({ preventScroll: true }); });
      box.append(b);
    });
    const pct = D.lessons.length ? Math.round(done.size / D.lessons.length * 100) : 0;
    $('progressFill').style.width = pct + '%';
    $('progressText').textContent = done.size + ' of ' + D.lessons.length + ' lessons learned (' + pct + '%)' + (done.size === D.lessons.length && done.size ? '. Congratulations, you finished A to Z!' : '');
    renderLesson();
    if (member) renderMember();
  }
  function renderLesson() {
    const l = D.lessons[current], a = $('lesson'); a.textContent = ''; a.tabIndex = -1;
    if (!l) return;
    const h = el('h3', '', l.letter + '. ' + l.title);
    const am = el('p', 'fh-am', l.am); am.lang = 'am';
    const q = el('p', 'fh-reflect'); q.append(el('strong', '', 'Talk about it together: '), document.createTextNode(l.reflect));
    const learned = done.has(l.letter);
    const mark = el('button', 'btn ' + (learned ? 'secondary' : 'primary'), learned ? 'Learned ✓ (undo)' : 'Mark as learned');
    mark.type = 'button'; mark.setAttribute('aria-pressed', String(learned));
    mark.addEventListener('click', () => { learned ? done.delete(l.letter) : done.add(l.letter); store.set(PKEY, [...done]); renderLessons(); });
    const nav = el('div', 'fh-lesson-nav');
    const prev = el('button', 'btn fh-quiet', '← Previous'), next = el('button', 'btn fh-quiet', 'Next →');
    prev.type = next.type = 'button'; prev.disabled = current === 0; next.disabled = current === D.lessons.length - 1;
    prev.addEventListener('click', () => { current--; renderLessons(); });
    next.addEventListener('click', () => { current++; renderLessons(); });
    nav.append(prev, mark, next);
    a.append(h, am, el('p', '', l.text), q, nav);
  }

  // Start on the first lesson not yet learned.
  const firstOpen = D.lessons.findIndex(l => !done.has(l.letter));
  current = firstOpen < 0 ? 0 : firstOpen;
  document.querySelectorAll('#hub h2').forEach(h => { h.tabIndex = -1; });
  renderIntros(); renderBoard(); renderLessons(); showHub();
  // A link such as family-hub.html#teaching opens that section once the hub is unlocked.
  if (member && location.hash) { const t = document.getElementById(location.hash.slice(1)); if (t && $('hub').contains(t)) t.scrollIntoView(); }
})();
