(function () {
  'use strict';
  // Family Hub: membership gate, family introductions, family board, Church teaching in
  // ten parts, and lesson uploads for admins.
  // Membership and progress are kept in this browser. Posts are sent to Habesha Hub by
  // email for review, then published in family-hub-data.js. Uploaded lessons live in the
  // "Habesha Hub" Supabase project (see supabase/family-hub-setup.sql).
  const D = window.FAMILY_HUB || { parts: [], introductions: [], announcements: [], contactEmail: 'info@habeshahubusa.com' };
  const UP = D.uploads || {};
  const KEY = 'hh-family-member', PKEY = 'hh-family-parts', SKEY = 'hh-family-admin';
  const $ = id => document.getElementById(id);
  const store = {
    get(k, d, s) { try { const v = (s || localStorage).getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v, s) { try { (s || localStorage).setItem(k, JSON.stringify(v)); } catch (e) { /* storage blocked: session only */ } },
    del(k, s) { try { (s || localStorage).removeItem(k); } catch (e) { /* ignore */ } }
  };
  let member = store.get(KEY, null);
  let done = new Set(store.get(PKEY, []));
  let uploaded = [];
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
    dl.append(el('dt', '', 'Teaching'), el('dd', '', done.size + ' of ' + D.parts.length + ' parts complete'));
    $('memberSend').href = mail('Family Hub membership: ' + member.family, 'Please add me to the Habesha Hub Family Hub.\n\n' + who() + (member.email ? '\nEmail: ' + member.email : '') + '\nJoined: ' + member.joined);
  }
  $('leaveBtn').addEventListener('click', () => {
    if (!confirm('Leave the Family Hub on this device? Your teaching progress here will also be cleared.')) return;
    store.del(KEY); store.del(PKEY); member = null; done = new Set(); renderParts(); showHub(); $('jName').focus();
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

  // Church teaching, Part 1 to 10
  let current = 0;
  function renderParts() {
    const box = $('parts'); box.textContent = '';
    D.parts.forEach((p, i) => {
      const b = el('button', 'fh-part' + (done.has(p.part) ? ' done' : '') + (i === current ? ' on' : ''));
      b.type = 'button'; b.setAttribute('role', 'listitem');
      b.append(el('span', 'fh-part-k', 'Part'), el('span', 'fh-part-n', String(p.part)));
      b.setAttribute('aria-label', 'Part ' + p.part + ': ' + p.title + (done.has(p.part) ? ', complete' : ''));
      if (i === current) b.setAttribute('aria-current', 'true');
      b.addEventListener('click', () => { current = i; renderParts(); $('lesson').focus({ preventScroll: true }); });
      box.append(b);
    });
    const pct = D.parts.length ? Math.round(done.size / D.parts.length * 100) : 0;
    $('progressFill').style.width = pct + '%';
    $('progressText').textContent = done.size + ' of ' + D.parts.length + ' parts complete (' + pct + '%)' + (done.size === D.parts.length && done.size ? '. Congratulations, you finished all ten parts!' : '');
    renderPart();
    if (member) renderMember();
  }
  const KIND = { pdf: 'PDF', audio: 'Audio', video: 'Video', image: 'Picture', document: 'Document', link: 'Link' };
  function material(m) {
    const li = el('li', 'fh-mat');
    const a = el('a', '', m.title); a.href = m.url; a.target = '_blank'; a.rel = 'noopener';
    li.append(el('span', 'fh-kind', KIND[m.kind] || 'File'), a);
    if (m.kind === 'audio' || m.kind === 'video') {
      const media = el(m.kind); media.controls = true; media.preload = 'none'; media.src = m.url; media.className = 'fh-media';
      li.append(media);
    }
    if (admin.isAdmin && m.id) {
      const del = el('button', 'btn fh-quiet fh-del', 'Remove'); del.type = 'button';
      del.setAttribute('aria-label', 'Remove ' + m.title);
      del.addEventListener('click', () => removeUpload(m));
      li.append(del);
    }
    return li;
  }
  function renderPart() {
    const p = D.parts[current], a = $('lesson'); a.textContent = ''; a.tabIndex = -1;
    if (!p) return;
    const am = el('p', 'fh-am', p.am); am.lang = 'am';
    a.append(el('p', 'eyebrow', 'Part ' + p.part + ' of ' + D.parts.length), el('h3', '', p.title), am, el('p', 'fh-intro', p.intro));
    for (const s of p.sections) {
      const sec = el('section', 'fh-section'), sam = el('span', 'fh-sam', s.am); sam.lang = 'am';
      const h = el('h4', '', s.title + ' '); h.append(sam);
      sec.append(h, el('p', '', s.text)); a.append(sec);
    }
    const mats = (p.uploads || []).concat(uploaded.filter(u => u.part === p.part));
    const mh = el('h4', 'fh-mat-h', 'Lesson materials');
    a.append(mh);
    if (mats.length) { const ul = el('ul', 'fh-mats'); mats.forEach(m => ul.append(material(m))); a.append(ul); }
    else a.append(el('p', 'fh-empty', 'No uploaded materials for this part yet.'));
    const q = el('div', 'fh-reflect'); q.append(el('strong', '', 'Talk about it together'));
    const ol = el('ul'); p.reflect.forEach(r => ol.append(el('li', '', r))); q.append(ol); a.append(q);
    const complete = done.has(p.part);
    const mark = el('button', 'btn ' + (complete ? 'secondary' : 'primary'), complete ? 'Complete ✓ (undo)' : 'Mark part ' + p.part + ' complete');
    mark.type = 'button'; mark.setAttribute('aria-pressed', String(complete));
    mark.addEventListener('click', () => {
      complete ? done.delete(p.part) : done.add(p.part); store.set(PKEY, [...done]);
      if (!complete && current < D.parts.length - 1) current++;
      renderParts();
    });
    const nav = el('div', 'fh-lesson-nav');
    const prev = el('button', 'btn fh-quiet', '← Previous part'), next = el('button', 'btn fh-quiet', 'Next part →');
    prev.type = next.type = 'button'; prev.disabled = current === 0; next.disabled = current === D.parts.length - 1;
    prev.addEventListener('click', () => { current--; renderParts(); });
    next.addEventListener('click', () => { current++; renderParts(); });
    nav.append(prev, mark, next);
    a.append(nav);
  }

  // Lesson uploads (Supabase). All calls use the publishable key; uploads and deletes
  // also send the signed-in admin's access token, and the database rules check it.
  const admin = { session: store.get(SKEY, null, sessionStorage), isAdmin: false };
  const connected = !!(UP.url && UP.key);
  const api = (path, opt = {}) => fetch(UP.url + path, Object.assign({}, opt, {
    headers: Object.assign({ apikey: UP.key }, admin.session && opt.auth ? { Authorization: 'Bearer ' + admin.session.access_token } : {}, opt.headers || {})
  })).then(async r => {
    const body = r.status === 204 ? null : await r.json().catch(() => null);
    if (!r.ok) throw new Error((body && (body.msg || body.message || body.error_description || body.error)) || ('Request failed (' + r.status + ')'));
    return body;
  });
  const status = t => { $('adminStatus').textContent = t; };

  async function loadUploads() {
    if (!connected) return;
    try { uploaded = await api('/rest/v1/lesson_uploads?select=id,part,title,kind,file_path,url,created_at&order=created_at.asc'); renderPart(); }
    catch (e) { uploaded = []; }
  }
  async function checkAdmin() {
    admin.isAdmin = false;
    if (admin.session) {
      if (admin.session.expires_at && admin.session.expires_at * 1000 < Date.now()) { signOut(); status('Your admin session expired. Please sign in again.'); return; }
      try {
        // Same rule as the database: a profile with role admin and status active.
        const rows = await api('/rest/v1/profiles?select=role,status&id=eq.' + encodeURIComponent(admin.session.user.id), { auth: true });
        admin.isAdmin = rows.length === 1 && rows[0].role === 'admin' && rows[0].status === 'active';
      } catch (e) { admin.isAdmin = false; }
    }
    $('adminLogin').hidden = !!admin.isAdmin;
    $('uploadForm').hidden = !admin.isAdmin;
    if (admin.session && !admin.isAdmin) status('You are signed in as ' + admin.session.user.email + ', but this account is not an admin. Ask Habesha Hub to make you an admin.');
    else if (admin.isAdmin) status('Signed in as ' + admin.session.user.email + '. Uploads appear in the chosen part right away.');
    else status('Only admins can upload lessons.');
    renderPart();
  }
  function signOut() { admin.session = null; admin.isAdmin = false; store.del(SKEY, sessionStorage); }

  function setupAdmin() {
    const sel = $('uPart');
    D.parts.forEach(p => { const o = el('option', '', 'Part ' + p.part + ': ' + p.title); o.value = p.part; sel.append(o); });
    if (!connected) { status('Lesson uploads are being set up and will be available soon.'); return; }
    checkAdmin();
    $('adminLogin').addEventListener('submit', async e => {
      e.preventDefault(); status('Signing in…');
      try {
        const s = await api('/auth/v1/token?grant_type=password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: $('aEmail').value.trim(), password: $('aPass').value }) });
        admin.session = { access_token: s.access_token, expires_at: s.expires_at, user: { id: s.user.id, email: s.user.email } };
        store.set(SKEY, admin.session, sessionStorage); $('aPass').value = '';
        await checkAdmin();
      } catch (err) { status('Sign in failed: ' + err.message); }
    });
    $('adminOut').addEventListener('click', () => { signOut(); checkAdmin(); $('aEmail').focus(); });
    document.querySelectorAll('input[name="uWhat"]').forEach(r => r.addEventListener('change', () => {
      const link = document.querySelector('input[name="uWhat"]:checked').value === 'link';
      $('uLinkRow').hidden = !link; $('uFileRow').hidden = link;
    }));
    $('uploadForm').addEventListener('submit', async e => {
      e.preventDefault();
      const part = Number($('uPart').value), title = $('uTitle').value.trim();
      const isLink = document.querySelector('input[name="uWhat"]:checked').value === 'link';
      if (!title) { status('Please give the lesson a title.'); $('uTitle').focus(); return; }
      let row;
      try {
        if (isLink) {
          const url = $('uLink').value.trim();
          if (!/^https:\/\/\S+$/.test(url)) { status('Please enter a link that starts with https://'); $('uLink').focus(); return; }
          row = { part, title, kind: 'link', url };
        } else {
          const f = $('uFile').files[0];
          if (!f) { status('Please choose a file to upload.'); $('uFile').focus(); return; }
          if (f.size > 50 * 1024 * 1024) { status('That file is larger than 50 MB. Please upload a smaller file or share it as a link.'); return; }
          const t = f.type || '', kind = t === 'application/pdf' ? 'pdf' : t.startsWith('audio/') ? 'audio' : t.startsWith('video/') ? 'video' : t.startsWith('image/') ? 'image' : 'document';
          const safe = f.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '').slice(-80) || 'lesson';
          const path = 'part-' + part + '/' + Date.now() + '-' + safe;
          status('Uploading ' + f.name + '…');
          await api('/storage/v1/object/lessons/' + path, { method: 'POST', auth: true, headers: { 'Content-Type': t || 'application/octet-stream' }, body: f });
          row = { part, title, kind, file_path: path, url: UP.url + '/storage/v1/object/public/lessons/' + path };
        }
        await api('/rest/v1/lesson_uploads', { method: 'POST', auth: true, headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(row) });
        $('uTitle').value = ''; $('uFile').value = ''; $('uLink').value = '';
        status('Uploaded "' + title + '" to Part ' + part + '.');
        current = D.parts.findIndex(p => p.part === part);
        await loadUploads(); renderParts();
      } catch (err) { status('Upload failed: ' + err.message); }
    });
  }
  async function removeUpload(m) {
    if (!confirm('Remove "' + m.title + '" from Part ' + m.part + '?')) return;
    try {
      if (m.file_path) await api('/storage/v1/object/lessons/' + m.file_path, { method: 'DELETE', auth: true });
      await api('/rest/v1/lesson_uploads?id=eq.' + m.id, { method: 'DELETE', auth: true });
      status('Removed "' + m.title + '".'); await loadUploads();
    } catch (err) { status('Could not remove: ' + err.message); }
  }

  // Start on the first part not yet complete.
  const firstOpen = D.parts.findIndex(p => !done.has(p.part));
  current = firstOpen < 0 ? 0 : firstOpen;
  document.querySelectorAll('#hub h2').forEach(h => { h.tabIndex = -1; });
  renderIntros(); renderBoard(); renderParts(); setupAdmin(); loadUploads(); showHub();
  // A link such as family-hub.html#teaching opens that section once the hub is unlocked.
  if (member && location.hash) { const t = document.getElementById(location.hash.slice(1)); if (t && $('hub').contains(t)) t.scrollIntoView(); }
})();
