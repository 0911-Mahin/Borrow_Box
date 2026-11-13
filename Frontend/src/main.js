import './style.css';

const CATS = ['Electronics', 'Study', 'Kitchen', 'Sports', 'Tools', 'Clothing', 'Other'];
const EM = { Electronics: '🔌', Study: '📚', Kitchen: '🍳', Sports: '🏏', Tools: '🔧', Clothing: '🥼', Other: '📦' };
const QUICK = [
  ['Scientific calculator', 'Study'],
  ['Extension board', 'Electronics'],
  ['Lab coat', 'Clothing'],
];
const KEY = 'borrowbox-v3';

let items = [], profile = { name: '', block: '' }, offset = 0;
let cat = 'All', q = '', tab = 'lent', tone = 'gentle', remind = '', stage = 0, modal = false;
try {
  const a = JSON.parse(localStorage.getItem(KEY));
  if (a) { if (Array.isArray(a.items)) items = a.items; if (a.profile) profile = a.profile; offset = a.offset || 0; }
} catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ items, profile, offset })); } catch (e) {} };

/* ---------- helpers ---------- */
const $ = (id) => document.getElementById(id);
const val = (id) => ($(id) ? $(id).value.trim() : '');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const iso = (n = 0) => {
  const x = new Date();
  x.setDate(x.getDate() + n + offset);
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
};
const days = (d) => Math.round((new Date(d + 'T00:00') - new Date(iso(0) + 'T00:00')) / 864e5);
const fd = (d) => new Date(d + 'T00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const find = (id) => items.find((x) => String(x.id) === String(id));
const same = (a, b) => a && b && String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
const isOwner = (i) => same(i.owner, profile.name);
const isBorrower = (i) => i.status === 'borrowed' && same(i.borrower, profile.name);
const involved = (i) => isOwner(i) || isBorrower(i);
const late = (i) => i.status === 'borrowed' && days(i.due) < 0;
const CONTACT = /(\+?\d[\d\s().-]{7,}\d)|[\w.+-]+@[\w-]+\.[a-z]{2,}|(^|\s)@\w{3,}/i;
const clean = (...t) => {
  if (t.some((s) => CONTACT.test(s || ''))) { toast('Please don’t share phone numbers or contact details'); return false; }
  return true;
};
function toast(m) {
  const t = $('toast');
  t.textContent = m; t.className = 's';
  clearTimeout(toast.t); toast.t = setTimeout(() => (t.className = ''), 2600);
}

/* Public badges never reveal overdue; private ones (owner/borrower) add a gentle flag */
const LBL = { available: ['a', 'Available'], borrowed: ['l', 'Borrowed'], returned: ['r', 'Returned'], unavailable: ['n', 'Unavailable'] };
const badge = (i, priv) => {
  if (priv && late(i)) return `<span class="b g">🌙 Gentle nudge · ${-days(i.due)}d past due</span>`;
  const [c, t] = LBL[i.status];
  return `<span class="b ${c}">● ${t}</span>`;
};
const empty = (icon, title, text, extra = '') =>
  `<div class="empty"><div class="eic">${icon}</div><h3>${title}</h3><p>${text}</p>${extra}</div>`;

const card = (i) => `
<article class="card item" onclick="location.hash='item-${i.id}'">
  <div class="em">${EM[i.cat] || '📦'}</div>
  <h3>${esc(i.name)}</h3>
  <p class="mu">${esc(i.cat)} · ${esc(i.owner)}${i.block ? ', ' + esc(i.block) : ''}</p>
  ${badge(i, false)}
</article>`;

const stepper = (s) => {
  const order = ['available', 'borrowed', 'returned'];
  const at = s === 'unavailable' ? -1 : order.indexOf(s);
  return `<ol class="cycle">${order.map((o, k) => `<li class="${k < at ? 'done' : k === at ? 'now' : ''}"><span>${k < at ? '✓' : k + 1}</span>${o[0].toUpperCase() + o.slice(1)}</li>`).join('')}</ol>`;
};

/* ---------- views ---------- */
const STAGES = [
  ['Available', 'Someone lists an item, like a calculator or extension board, and it shows as Available to the whole hostel.'],
  ['Borrowed', 'A hostel-mate requests it and picks a due date. Publicly it only says Borrowed, with no names and no dates. Only the owner and borrower see the details.'],
  ['Returned', 'The owner confirms the return. The item shows as Returned and can be made Available again in one tap.'],
];
const TIPS = [
  'If something runs late, only the owner and borrower see a soft flag, never a public list.',
  'Reminders are generated for you to send in person. No phone numbers or emails are ever stored.',
  'Item pages show status only. Names and due dates stay private.',
];

function home() {
  const n = (s) => items.filter((i) => i.status === s).length;
  return `
<section class="hero">
  <div>
    <span class="tag">🏠 Built for hostel life</span>
    <h1>Borrow from your floormates. <span class="hl">Kindly.</span></h1>
    <p class="lead">BorrowBox is a simple lending board for your hostel. List what you can spare, borrow what you need, and keep late returns private and polite.</p>
    <div class="cta"><a class="btn" href="#list">Lend an item</a><a class="btn g" href="#browse">Browse items</a></div>
  </div>
  <div class="card xp">
    <h3>Try the lending cycle</h3>
    <div class="tabs">${STAGES.map((s, k) => `<button class="tabb ${k === stage ? 'on' : ''}" onclick="setStage(${k})">${k + 1}. ${s[0]}</button>`).join('')}</div>
    <p class="xpt">${STAGES[stage][1]}</p>
    <div class="privacy">🔒 ${TIPS[stage]}</div>
  </div>
</section>

<section class="stats">
  <div class="card stat"><b>${items.length}</b><span>Items listed</span></div>
  <div class="card stat"><b>${n('available')}</b><span>Available now</span></div>
  <div class="card stat"><b>${n('borrowed')}</b><span>Borrowed</span></div>
</section>

<section class="sec"><h2>How it works</h2>
  <div class="grid g3">
    <div class="card"><span class="num">1</span><h3>List an item</h3><p class="mu">Add anything you’re happy to lend, with a category.</p></div>
    <div class="card"><span class="num">2</span><h3>Borrow &amp; set a due date</h3><p class="mu">Request an available item and choose when you’ll return it.</p></div>
    <div class="card"><span class="num">3</span><h3>Return &amp; repeat</h3><p class="mu">The owner confirms the return and the cycle starts again.</p></div>
  </div>
</section>

<section class="sec"><h2>Our privacy promise</h2>
  <div class="grid g3">
    <div class="card"><div class="ico">🌙</div><h3>Gentle overdue mode</h3><p class="mu">Late items are flagged privately, only for the owner and borrower.</p></div>
    <div class="card"><div class="ico">🚫</div><h3>No hall of shame</h3><p class="mu">There is no public list of late borrowers. Ever.</p></div>
    <div class="card"><div class="ico">🔒</div><h3>No contact details</h3><p class="mu">We never ask for or show phone numbers or emails.</p></div>
  </div>
</section>`;
}

function browse() {
  const list = items.filter((i) => (cat === 'All' || i.cat === cat) && i.name.toLowerCase().includes(q.toLowerCase()));
  let body;
  if (!items.length)
    body = empty('📭', 'Nothing listed yet', 'Add an item, or load a few sample hostel essentials to explore.',
      '<div class="cta c"><a class="btn" href="#list">Lend an item</a><button class="btn g" onclick="loadSamples()">Load sample essentials</button></div>');
  else if (!list.length) body = empty('🔎', 'No matches', 'Try a different search or category.');
  else body = `<div class="grid">${list.map(card).join('')}</div>`;
  return `
<div class="ph"><div><h2>Browse items</h2><p class="mu">${items.length} item${items.length === 1 ? '' : 's'} in your hostel</p></div><a class="btn" href="#list">+ Lend an item</a></div>
<input id="s" class="search" placeholder="Search items…" value="${esc(q)}" oninput="setQ(this.value)" aria-label="Search items">
<div class="chips">${['All', ...CATS].map((c) => `<button class="chip ${c === cat ? 'on' : ''}" onclick="setCat('${c}')">${c}</button>`).join('')}</div>
${body}`;
}

function loans() {
  if (!profile.name)
    return `<div class="ph"><div><h2>My loans</h2><p class="mu">Private to you</p></div></div>` +
      empty('👋', 'Who’s this?', 'Tell BorrowBox your name to see the items you’ve lent and borrowed. Only you can see your loans.',
        '<div class="cta c"><button class="btn" onclick="openWho()">Set my name</button></div>');
  const lent = items.filter((i) => isOwner(i) && i.status === 'borrowed');
  const bor = items.filter((i) => isBorrower(i));
  const list = (tab === 'lent' ? lent : bor).sort((a, b) => (a.due < b.due ? -1 : 1));
  const nudges = lent.filter(late).length;
  let body;
  if (!list.length)
    body = empty(tab === 'lent' ? '📤' : '📥', tab === 'lent' ? 'Nothing lent out right now' : 'You’re not borrowing anything',
      tab === 'lent' ? 'Items you lend will appear here once someone borrows them.' : 'Browse items to borrow something.',
      '<div class="cta c"><a class="btn" href="#browse">Browse items</a></div>');
  else
    body = `<div class="grid">${list.map((i) => `
<article class="card item" onclick="location.hash='item-${i.id}'">
  <div class="em">${EM[i.cat] || '📦'}</div><h3>${esc(i.name)}</h3>
  <p class="mu">${tab === 'lent' ? 'With ' + esc(i.borrower) : 'From ' + esc(i.owner)} · due ${fd(i.due)}</p>${badge(i, true)}</article>`).join('')}</div>`;
  return `
<div class="ph"><div><h2>My loans</h2><p class="mu">Private to you, signed in as <b>${esc(profile.name)}</b></p></div></div>
${nudges && tab === 'lent' ? `<div class="soft">🌙 ${nudges} item${nudges > 1 ? 's are' : ' is'} a little overdue. Open it to send a gentle reminder.</div>` : ''}
<div class="chips"><button class="chip ${tab === 'lent' ? 'on' : ''}" onclick="setTab('lent')">Lent by me (${lent.length})</button><button class="chip ${tab === 'borrowed' ? 'on' : ''}" onclick="setTab('borrowed')">Borrowed by me (${bor.length})</button></div>
${body}`;
}

function item(id) {
  const i = find(id);
  if (!i) return empty('🤷', 'Item not found', 'It may have been removed.', '<div class="cta c"><a class="btn" href="#browse">Back to browse</a></div>');
  const own = isOwner(i), bor = isBorrower(i), inv = own || bor;
  let side = '';
  if (i.status === 'available' && !own)
    side = `<h3>Request to borrow</h3><p class="mu">Choose a return date. Only first names are needed.</p>
<label for="bn">Your name</label><input id="bn" placeholder="e.g. Aarav" value="${esc(profile.name)}">
<label for="due">Return by</label><input type="date" id="due" min="${iso(1)}" value="${iso(7)}">
<button class="btn full" style="margin-top:16px" onclick="borrow('${i.id}')">Request item</button>`;
  else if (i.status === 'available')
    side = `<h3>Your item</h3><p class="mu">It’s available for others to borrow.</p>
<button class="btn g full" onclick="setStatus('${i.id}','unavailable')">Pause lending</button>`;
  else if (i.status === 'unavailable')
    side = own ? `<h3>Lending paused</h3><p class="mu">Others can’t request this right now.</p><button class="btn full" onclick="setStatus('${i.id}','available')">Make available</button>`
      : `<h3>Not available</h3><p class="mu">The owner has paused lending this item.</p>`;
  else if (i.status === 'returned')
    side = own ? `<h3>Returned ✓</h3><p class="mu">Ready for the next person?</p><button class="btn full" onclick="setStatus('${i.id}','available')">Make available again</button>`
      : `<h3>Recently returned</h3><p class="mu">It will be available again soon.</p>`;
  else if (own)
    side = `<h3>Loan details</h3>
<dl class="dl"><dt>Borrowed by</dt><dd>${esc(i.borrower)}</dd><dt>Due date</dt><dd>${fd(i.due)}</dd></dl>
<button class="btn ok full" onclick="ret('${i.id}')">✓ Mark as returned</button>
<h3 style="margin-top:24px">Gentle reminder</h3>
<p class="mu">A private message you can send in person. It contains no contact details.</p>
<div class="chips">${[['gentle', 'Gentle'], ['friendly', 'Friendly'], ['brief', 'Brief']].map(([k, l]) => `<button class="chip ${tone === k ? 'on' : ''}" onclick="setTone('${k}','${i.id}')">${l}</button>`).join('')}</div>
<button class="btn g full" onclick="gen('${i.id}')">💬 Generate reminder</button>
${remind ? `<textarea id="rm" rows="8">${esc(remind)}</textarea><button class="btn sm full" style="margin-top:8px" onclick="copyMsg()">Copy message</button>` : ''}`;
  else if (bor)
    side = `<h3>You’re borrowing this</h3>
<dl class="dl"><dt>From</dt><dd>${esc(i.owner)}</dd><dt>Due date</dt><dd>${fd(i.due)}</dd></dl>
<p class="mu">Need more time? Extend the due date so ${esc(i.owner)} knows.</p>
<div class="cta"><button class="btn g" onclick="extend('${i.id}',3)">+3 days</button><button class="btn g" onclick="extend('${i.id}',7)">+7 days</button></div>
<p class="hint">When you hand it back, ${esc(i.owner)} will mark it returned.</p>`;
  else side = `<h3>Currently borrowed</h3><p class="mu">This item is out right now. Check back soon, or browse similar items.</p><a class="btn g full" href="#browse">Browse items</a>`;

  return `
<a href="#browse" class="back">← Back to items</a>
<div class="two">
  <div class="card">
    ${inv && late(i) ? `<div class="soft">🌙 <b>Gentle nudge:</b> this was due on ${fd(i.due)}. ${own ? 'A friendly reminder might help.' : 'A quick return would be appreciated, or extend the date.'}<br><small>🔒 Only you and the ${own ? 'borrower' : 'owner'} can see this.</small></div>` : ''}
    <div class="em">${EM[i.cat] || '📦'}</div>
    <h2>${esc(i.name)}</h2>
    <p>${badge(i, inv)} <span class="b p">${esc(i.cat)}</span></p>
    <p class="mu">Listed by ${esc(i.owner)}${i.block ? ' · ' + esc(i.block) : ''}</p>
    ${i.note ? `<p>${esc(i.note)}</p>` : ''}
    <h3 style="margin-top:20px">Lending cycle</h3>${stepper(i.status)}
    ${inv ? `<h3 style="margin-top:20px">History <span class="lock">🔒 private</span></h3><ul class="tl">${i.log.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>` : ''}
    ${own && i.status !== 'borrowed' ? `<button class="link" onclick="del('${i.id}')">Remove this item</button>` : ''}
  </div>
  <div class="card side">${side}</div>
</div>`;
}

function add() {
  return `
<div class="ph"><div><h2>Lend an item</h2><p class="mu">Add something your hostel-mates can borrow</p></div></div>
<div class="card form">
  <p class="mu" style="margin-bottom:6px">Quick picks</p>
  <div class="chips" style="margin:0 0 6px">${QUICK.map(([n, c], k) => `<button class="chip" onclick="quick(${k})">${EM[c]} ${n}</button>`).join('')}</div>
  <label for="n">Item name *</label><input id="n" placeholder="e.g. Scientific calculator">
  <div class="fg"><div><label for="c">Category</label><select id="c">${CATS.map((c) => `<option>${c}</option>`).join('')}</select></div>
  <div><label for="a">Availability</label><select id="a"><option value="available">Available now</option><option value="unavailable">Not available right now</option></select></div></div>
  <div class="fg"><div><label for="on">Your first name *</label><input id="on" placeholder="e.g. Meera" value="${esc(profile.name)}"></div>
  <div><label for="ob">Block / floor (optional)</label><input id="ob" placeholder="e.g. Block A, 2nd floor" value="${esc(profile.block)}"></div></div>
  <label for="nt">Note (optional)</label><textarea id="nt" rows="3" placeholder="Condition, handover time…"></textarea>
  <p class="hint">🔒 Please don’t add phone numbers or emails. BorrowBox never needs them.</p>
  <button class="btn full" onclick="addItem()">List item</button>
</div>`;
}

function whoModal() {
  const names = [...new Set(items.flatMap((i) => [i.owner, i.borrower]).filter(Boolean))];
  return `<div class="ov" onclick="closeWho()"><div class="card md" onclick="event.stopPropagation()">
<h3>Who are you?</h3><p class="mu">No login needed. Your name decides what private details you can see.</p>
<label for="wn">First name</label><input id="wn" placeholder="e.g. Rohan" value="${esc(profile.name)}">
<label for="wb">Block / floor (optional)</label><input id="wb" placeholder="e.g. Block B" value="${esc(profile.block)}">
${names.length ? `<p class="mu" style="margin:14px 0 6px">Or view as</p><div class="chips" style="margin:0">${names.map((n) => `<button class="chip" onclick="pickWho('${esc(n).replace(/'/g, '')}')">${esc(n)}</button>`).join('')}</div>` : ''}
<div class="cta" style="margin-top:18px"><button class="btn" onclick="saveWho()">Save</button><button class="btn g" onclick="closeWho()">Cancel</button></div>
</div></div>`;
}

/* ---------- actions ---------- */
function addItem() {
  const name = val('n'), owner = val('on'), block = val('ob'), note = val('nt');
  if (!name || !owner) return toast('Please add the item name and your first name');
  if (!clean(name, owner, block, note)) return;
  profile = { name: owner, block };
  items.unshift({ id: Date.now(), name, cat: $('c').value, owner, block, note, status: $('a').value, borrower: null, due: null, log: [`Listed by ${owner} on ${fd(iso(0))}`] });
  save(); toast('Item listed!'); location.hash = 'browse';
}
function quick(k) { $('n').value = QUICK[k][0]; $('c').value = QUICK[k][1]; }
function borrow(id) {
  const i = find(id), name = val('bn'), due = $('due').value;
  if (!name) return toast('Please enter your first name');
  if (!due || due <= iso(0)) return toast('Choose a due date after today');
  if (!clean(name)) return;
  if (same(name, i.owner)) return toast('That’s your own item!');
  profile.name = name;
  Object.assign(i, { status: 'borrowed', borrower: name, due });
  i.log.push(`Borrowed by ${name}, due ${fd(due)}`);
  remind = ''; save(); toast('Requested! Due ' + fd(due)); ren();
}
function ret(id) {
  const i = find(id);
  i.log.push(`Returned by ${i.borrower} on ${fd(iso(0))}`);
  Object.assign(i, { status: 'returned', borrower: null, due: null });
  remind = ''; save(); toast('Marked as returned ✓'); ren();
}
function setStatus(id, s) {
  const i = find(id); i.status = s;
  i.log.push(s === 'available' ? 'Made available' : 'Lending paused');
  save(); ren();
}
function extend(id, n) {
  const i = find(id), d = new Date(i.due + 'T00:00'); d.setDate(d.getDate() + n);
  i.due = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  i.log.push(`${i.borrower} extended the due date to ${fd(i.due)}`);
  save(); toast('Due date extended'); ren();
}
function gen(id) {
  const i = find(id), isLate = late(i), n = -days(i.due);
  const when = isLate ? `was due on ${fd(i.due)}` : `is due on ${fd(i.due)}`;
  const T = {
    gentle: `Hi ${i.borrower},\n\nHope you’re doing well! Just a gentle note about my “${i.name}”, which ${when}. No stress at all. Whenever you get a chance, could you return it? And if you need a bit more time, just let me know.\n\nThanks so much!\n– ${i.owner}`,
    friendly: `Hey ${i.borrower}! 👋\n\nQuick check-in about the “${i.name}”: it ${when}${isLate ? ` (${n} day${n > 1 ? 's' : ''} ago)` : ''}. Could we catch up sometime today or tomorrow so I can get it back? Happy to wait a little if you still need it 😊\n\n– ${i.owner}`,
    brief: `Hi ${i.borrower}, a friendly reminder that the “${i.name}” ${when}. Please return it when you can. Thanks! – ${i.owner}`,
  };
  remind = T[tone]; ren();
}
function copyMsg() {
  const t = $('rm').value;
  if (navigator.clipboard) navigator.clipboard.writeText(t).then(() => toast('Copied!'), () => toast('Select the text and copy'));
  else toast('Select the text and copy');
}
function del(id) {
  if (!confirm('Remove this item?')) return;
  items = items.filter((x) => String(x.id) !== String(id)); save(); location.hash = 'browse';
}
function loadSamples() {
  const mk = (n, c, o, b, st, bw, due, log) => ({ id: Date.now() + Math.random(), name: n, cat: c, owner: o, block: b, note: '', status: st, borrower: bw, due, log });
  items = [
    mk('Scientific calculator (fx-991)', 'Study', 'Meera', 'Block A', 'available', null, null, ['Listed by Meera']),
    mk('Extension board (4-socket)', 'Electronics', 'Rohan', 'Block B', 'borrowed', 'Karthik', iso(-3), ['Listed by Rohan', 'Borrowed by Karthik']),
    mk('Lab coat (M)', 'Clothing', 'Sneha', 'Block A', 'borrowed', 'Aarav', iso(4), ['Listed by Sneha', 'Borrowed by Aarav']),
    mk('Lab coat (L)', 'Clothing', 'Imran', 'Block C', 'available', null, null, ['Listed by Imran']),
    mk('Drafter set', 'Study', 'Karthik', 'Block C', 'returned', null, null, ['Listed by Karthik', 'Returned by Meera']),
    mk('Electric kettle', 'Kitchen', 'Meera', 'Block A', 'available', null, null, ['Listed by Meera']),
    ...items,
  ];
  save(); toast('Sample essentials loaded. Use “view as” in the top bar to see private views.'); ren();
}
function clearAll() {
  if (!confirm('Delete all items and reset?')) return;
  items = []; offset = 0; save(); ren();
}
const setCat = (c) => { cat = c; ren(); };
const setTab = (t) => { tab = t; ren(); };
const setQ = (v) => { q = v; ren(true); };
const setStage = (k) => { stage = k; ren(); };
const setTone = (k, id) => { tone = k; if (remind) gen(id); else ren(); };
const skip = (n) => { offset = n ? offset + n : 0; save(); remind = ''; ren(); toast(n ? `Demo date moved ahead ${n} day${n > 1 ? 's' : ''}` : 'Demo date reset'); };
const openWho = () => { modal = true; ren(); };
const closeWho = () => { modal = false; ren(); };
const pickWho = (n) => { profile.name = n; modal = false; save(); remind = ''; ren(); toast('Viewing as ' + n); };
function saveWho() {
  const n = val('wn'), b = val('wb');
  if (!n) return toast('Please enter a first name');
  if (!clean(n, b)) return;
  profile = { name: n, block: b }; modal = false; save(); remind = ''; ren(); toast('Hi ' + n + '!');
}
Object.assign(window, { addItem, quick, borrow, ret, setStatus, extend, gen, copyMsg, del, loadSamples, clearAll, setCat, setTab, setQ, setStage, setTone, skip, openWho, closeWho, pickWho, saveWho });

/* ---------- router ---------- */
function ren(keepFocus) {
  const r = (location.hash || '#home').slice(1);
  $('app').innerHTML = r.startsWith('item-') ? item(r.slice(5)) : ({ home, browse, loans, list: add }[r] || home)();
  const key = r.startsWith('item-') ? 'browse' : r;
  document.querySelectorAll('nav a.l').forEach((a) => a.classList.toggle('on', a.dataset.r === key));
  $('who').innerHTML = profile.name ? `👤 ${esc(profile.name)}` : '👤 Set your name';
  $('clk').innerHTML = `Demo date <b>${fd(iso(0))}</b> · <button onclick="skip(1)">+1 day</button><button onclick="skip(3)">+3 days</button>${offset ? '<button onclick="skip(0)">Reset</button>' : ''}${items.length ? '<button onclick="clearAll()">Clear all data</button>' : ''}`;
  $('modal').innerHTML = modal ? whoModal() : '';
  if (keepFocus) { const s = $('s'); if (s) { s.focus(); s.setSelectionRange(q.length, q.length); } }
  else if (!modal) window.scrollTo(0, 0);
}
window.addEventListener('hashchange', () => { remind = ''; modal = false; ren(); });
ren();
