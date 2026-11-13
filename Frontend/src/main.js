import './style.css';

const CATS = ['Electronics', 'Study', 'Kitchen', 'Sports', 'Tools', 'Clothing', 'Other'];
const CATEGORY_IMAGES = {
  Electronics: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=900&q=82',
  Study: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=900&q=82',
  Kitchen: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=82',
  Sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=900&q=82',
  Tools: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=900&q=82',
  Clothing: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=82',
  Other: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=900&q=82',
};
const STAGE_VISUALS = ['box', 'calendar', 'check'];
const QUICK = [
  ['Scientific calculator', 'Study'],
  ['Extension board', 'Electronics'],
  ['Lab coat', 'Clothing'],
];
const KEY = 'borrowbox-v3';

let items = [], profile = { name: '', block: '' }, offset = 0;
let cat = 'All', q = '', tab = 'lent', tone = 'gentle', remind = '', stage = 0, modal = false;
let homeStep = 0, promiseOpen = -1, homeTone = 'gentle', faqOpen = 0;
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

/* Small, consistent SVG illustrations replace emoji glyphs throughout the interface. */
const ICON_PATHS = {
  box: '<path d="m3 7 9-4 9 4-9 4-9-4Z"/><path d="M3 7v10l9 4 9-4V7M12 11v10"/>',
  home: '<path d="m3 10 9-7 9 7v10H3V10Z"/><path d="M9 20v-6h6v6"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3"/>',
  moon: '<path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z"/>',
  shield: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
  ban: '<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/>',
  hand: '<path d="M8 12V5a1.7 1.7 0 0 1 3.4 0v6-7a1.7 1.7 0 0 1 3.4 0v7-5a1.7 1.7 0 0 1 3.4 0v7-2a1.7 1.7 0 0 1 3.4 0v5c0 4-2.7 7-6.6 7h-2.2c-2.4 0-3.9-1-5.3-2.8L4 15a1.8 1.8 0 0 1 2.6-2.5L8 14"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5v-17Z"/><path d="M4 17a2.5 2.5 0 0 1 2.5-2.5H20"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  spark: '<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 16 .9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9L19 16Z"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7h.01"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
};
const icon = (name, cls = '') => `<svg class="ui-icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ICON_PATHS.box}</svg>`;
const categoryImage = (category, cls = 'category-image') => `<img class="${cls}" src="${CATEGORY_IMAGES[category] || CATEGORY_IMAGES.Other}" alt="${esc(category)} item category" loading="lazy" onerror="this.style.display='none'">`;
const LBL = { available: ['a', 'Available'], borrowed: ['l', 'Borrowed'], returned: ['r', 'Returned'], unavailable: ['n', 'Unavailable'] };
const badge = (i, priv) => {
  if (priv && late(i)) return `<span class="b g">${icon('moon')} Gentle nudge · ${-days(i.due)}d past due</span>`;
  const [c, t] = LBL[i.status];
  return `<span class="b ${c}"><span class="status-dot"></span>${t}</span>`;
};
const empty = (iconName, title, text, extra = '') =>
  `<div class="empty"><div class="eic">${icon(iconName)}</div><h3>${title}</h3><p>${text}</p>${extra}</div>`;

const card = (i) => `
<article class="card item" onclick="location.hash='item-${i.id}'" tabindex="0" role="link" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();location.hash='item-${i.id}'}">
  <div class="item-image-wrap">${categoryImage(i.cat, 'item-image')}<span class="image-label">${esc(i.cat)}</span></div>
  <div class="item-card-body"><h3>${esc(i.name)}</h3>
  <p class="mu">${esc(i.cat)} · ${esc(i.owner)}${i.block ? ', ' + esc(i.block) : ''}</p>
  ${badge(i, false)}</div>
</article>`;

const stepper = (s) => {
  const order = ['available', 'borrowed', 'returned'];
  const at = s === 'unavailable' ? -1 : order.indexOf(s);
  return `<ol class="cycle">${order.map((o, k) => `<li class="${k < at ? 'done' : k === at ? 'now' : ''}"><span>${k < at ? icon('check') : k + 1}</span>${o[0].toUpperCase() + o.slice(1)}</li>`).join('')}</ol>`;
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
  const steps = [
    ['Share something useful', 'Choose an item you no longer need every day. Add a category and a short note so neighbours know what they are borrowing.', 'list'],
    ['Make a clear plan', 'A borrower requests the item and chooses a return date. The owner and borrower can see the private loan details.', 'calendar'],
    ['Close the loop', 'The owner confirms the return. The item can go straight back into circulation for the next hostel-mate.', 'check'],
  ];
  const promises = [
    ['Private gentle nudges', 'Overdue flags are visible only to the owner and borrower. Public browse cards never expose late status.', 'moon'],
    ['No public call-outs', 'There is no leaderboard, public late list or hall of shame. BorrowBox keeps the experience respectful.', 'shield'],
    ['No contact details', 'The prototype does not collect phone numbers, email addresses or room contact information.', 'lock'],
  ];
  const faqs = [
    ['Does BorrowBox need an account?', 'No. This prototype uses a simple “view as” name to demonstrate private owner and borrower views. It is not real authentication.'],
    ['Who can see an overdue item?', 'Only the item owner and the current borrower see the gentle overdue flag, due date and private loan history.'],
    ['Where is my data stored?', 'This frontend prototype saves data in this browser using localStorage. Clearing browser storage or using another browser will not sync the data.'],
    ['Can I lend an item again after it is returned?', 'Yes. The owner can choose “Make available again” from the item details page.'],
  ];
  const sampleReminder = {
    gentle: 'Hi there, just a gentle note about the item you borrowed. No rush — whenever you get a chance, could you let me know when it might be returned? Thanks so much.',
    friendly: 'Hey! Quick check-in about the item you borrowed. Could we coordinate a return sometime today or tomorrow? Happy to work around your schedule.',
    brief: 'Hi, a friendly reminder about the borrowed item. Please return it when you can. Thanks!',
  }[homeTone];
  return `
<div class="home-root" id="homeRoot">
  <section class="hero hero-premium">
    <div class="hero-copy reveal">
      <span class="eyebrow"><span class="eyebrow-mark"></span> A better way to share campus essentials</span>
      <h1>Good neighbours<br>make <span class="hl hero-highlight">great hostels.</span></h1>
      <p class="lead">Borrow what you need. Lend what you can. Keep the little things moving — with a lending space that puts people first.</p>
      <div class="cta hero-actions">
        <a class="btn magnetic" href="#list">List an item ${icon('arrow')}</a>
        <a class="btn g magnetic" href="#browse">Explore the board</a>
      </div>
      <div class="hero-proof"><div class="proof-avatars"><span>ME</span><span>RK</span><span>SA</span></div><p><strong>Made for hostel communities</strong><br><span>Useful things, shared thoughtfully.</span></p></div>
    </div>
    <div class="hero-art reveal" data-tilt>
      <div class="art-orbit orbit-one"></div><div class="art-orbit orbit-two"></div>
      <div class="hero-photo-main">${categoryImage('Study', 'hero-photo')}</div>
      <div class="hero-photo-small">${categoryImage('Electronics', 'hero-photo')}</div>
      <div class="floating-note note-top"><span class="note-icon note-green">${icon('check')}</span><span><b>Ready to share</b><small>One less thing to buy</small></span></div>
      <div class="floating-note note-bottom"><span class="note-icon note-violet">${icon('hand')}</span><span><b>BorrowBox promise</b><small>Respectful by design</small></span></div>
      <div class="art-caption"><span>COMMUNITY, IN CIRCULATION</span><span>01 / 04</span></div>
    </div>
  </section>

  <section class="stats stats-premium reveal" aria-label="BorrowBox live stats">
    <div class="stat"><b data-count="${items.length}">${items.length}</b><span>Items on the board</span></div>
    <div class="stat"><b data-count="${n('available')}">${n('available')}</b><span>Available to borrow</span></div>
    <div class="stat"><b data-count="${n('borrowed')}">${n('borrowed')}</b><span>Out in the community</span></div>
    <div class="stat stat-note"><span class="stat-live-dot"></span><span>Live totals from this browser</span></div>
  </section>

  <section class="sec category-section reveal">
    <div class="section-heading"><div><span class="eyebrow">THE COMMUNITY SHELF</span><h2>Find a little of what you need.</h2></div><a class="text-link" href="#browse">Browse everything ${icon('arrow')}</a></div>
    <div class="category-grid">
      ${CATS.map((c, k) => `<button class="category-tile" onclick="goCategory('${c}')" data-tilt><span class="category-image-frame">${categoryImage(c, 'category-tile-image')}</span><span class="category-tile-meta"><b>${c}</b><small>${items.filter((i) => i.cat === c).length} listed</small></span><span class="tile-arrow">${icon('arrow')}</span></button>`).join('')}
    </div>
  </section>

  <section class="sec cycle-section reveal">
    <div class="section-heading"><div><span class="eyebrow">SIMPLE BY DESIGN</span><h2>A small loop that helps everyone.</h2><p class="mu">Explore how one borrowed item moves through the community.</p></div></div>
    <div class="cycle-explorer card" data-tilt>
      <div class="cycle-visual">
        <div class="cycle-visual-glow"></div>
        <div class="cycle-icon">${icon(STAGE_VISUALS[stage])}</div>
        <div class="cycle-track"><span class="cycle-track-fill" style="width:${(stage + 1) * 33.333}%"></span></div>
        <div class="cycle-visual-label">STEP 0${stage + 1} <span> / 03</span></div>
      </div>
      <div class="cycle-content">
        <div class="tabs stage-tabs">${STAGES.map((s, k) => `<button class="tabb ${k === stage ? 'on' : ''}" aria-pressed="${k === stage}" onclick="setStage(${k})"><span>0${k + 1}</span>${s[0]}</button>`).join('')}</div>
        <p class="cycle-stage-copy">${STAGES[stage][1]}</p>
        <div class="privacy-note">${icon('lock')}<span>${TIPS[stage]}</span></div>
      </div>
    </div>
  </section>

  <section class="sec how-section reveal">
    <div class="section-heading"><div><span class="eyebrow">THREE EASY MOVES</span><h2>Sharing should feel effortless.</h2></div></div>
    <div class="how-layout">
      <div class="how-steps">
        ${steps.map((s, k) => `<button class="how-step ${homeStep === k ? 'active' : ''}" onclick="setHomeStep(${k})" aria-pressed="${homeStep === k}"><span class="how-step-number">0${k + 1}</span><span class="how-step-text"><b>${s[0]}</b><small>${homeStep === k ? s[1] : 'Select to see how this part works.'}</small></span><span class="how-step-icon">${icon(s[2])}</span></button>`).join('')}
      </div>
      <div class="how-photo-panel" data-tilt><img src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=85" alt="A bright shared study space with books and desks" loading="lazy"><div class="how-photo-overlay"><span>BETTER TOGETHER</span><b>Pass it on.<br>Keep it going.</b></div></div>
    </div>
  </section>

  <section class="sec privacy-section reveal">
    <div class="section-heading"><div><span class="eyebrow">BUILT AROUND TRUST</span><h2>Good sharing needs good boundaries.</h2><p class="mu">Tap a card to see the promise behind the feature.</p></div></div>
    <div class="promise-grid">
      ${promises.map((p, k) => `<button class="promise-card ${promiseOpen === k ? 'flipped' : ''}" onclick="flipPromise(${k})" aria-pressed="${promiseOpen === k}"><span class="promise-front"><span class="promise-symbol">${icon(p[2])}</span><b>${p[0]}</b><span class="promise-hint">Tap to learn more</span></span><span class="promise-back"><span class="promise-back-label">THE PROMISE</span><b>${p[0]}</b><span>${p[1]}</span></span></button>`).join('')}
    </div>
  </section>

  <section class="sec reminder-section reveal">
    <div class="reminder-copy"><span class="eyebrow">A KINDER KIND OF REMINDER</span><h2>Life happens.<br><span class="hl">Keep it friendly.</span></h2><p class="mu">When a return runs late, start with a thoughtful nudge. Pick a tone to preview how BorrowBox keeps the conversation human.</p></div>
    <div class="reminder-card card" data-tilt>
      <div class="reminder-card-head"><span class="reminder-avatar">B</span><span><b>Reminder preview</b><small>Private · ready to share in person</small></span><span class="reminder-lock">${icon('lock')}</span></div>
      <div class="reminder-tones">${[['gentle','Gentle'],['friendly','Friendly'],['brief','Brief']].map(([k,l])=>`<button class="chip ${homeTone===k?'on':''}" onclick="setHomeTone('${k}')" aria-pressed="${homeTone===k}">${l}</button>`).join('')}</div>
      <blockquote class="reminder-message">${esc(sampleReminder)}</blockquote>
      <button class="btn g full copy-preview" onclick="copyHomeReminder()">${icon('copy')} Copy preview</button>
    </div>
  </section>

  <section class="sec faq-section reveal">
    <div class="section-heading"><div><span class="eyebrow">GOOD TO KNOW</span><h2>Questions, answered.</h2></div><p class="mu">A few details before you get started.</p></div>
    <div class="faq-list">${faqs.map((f,k)=>`<div class="faq-item ${faqOpen===k?'open':''}"><button class="faq-question" onclick="setFaq(${k})" aria-expanded="${faqOpen===k}"><span>${f[0]}</span><span class="faq-plus">${faqOpen===k?'−':'+'}</span></button>${faqOpen===k?`<div class="faq-answer">${f[1]}</div>`:''}</div>`).join('')}</div>
  </section>

  <section class="final-cta reveal"><div class="final-cta-orb"></div><div class="final-cta-copy"><span class="eyebrow eyebrow-light">YOUR HOSTEL, A LITTLE MORE CONNECTED</span><h2>Have something useful<br>to pass around?</h2><p>Give it another life. Someone nearby might need it today.</p><div class="cta"><a class="btn btn-light magnetic" href="#list">List your first item ${icon('arrow')}</a><a class="final-text-link" href="#browse">See what’s available</a></div></div><div class="final-cta-mark">BB<span>®</span></div></section>
</div>`;
}
function browse() {
  const list = items.filter((i) => (cat === 'All' || i.cat === cat) && i.name.toLowerCase().includes(q.toLowerCase()));
  let body;
  if (!items.length)
    body = empty('box', 'Nothing listed yet', 'Add an item, or load a few sample hostel essentials to explore.',
      '<div class="cta c"><a class="btn" href="#list">Lend an item</a><button class="btn g" onclick="loadSamples()">Load sample essentials</button></div>');
  else if (!list.length) body = empty('search', 'No matches', 'Try a different search or category.');
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
      empty('user', 'Who’s this?', 'Tell BorrowBox your name to see the items you’ve lent and borrowed. Only you can see your loans.',
        '<div class="cta c"><button class="btn" onclick="openWho()">Set my name</button></div>');
  const lent = items.filter((i) => isOwner(i) && i.status === 'borrowed');
  const bor = items.filter((i) => isBorrower(i));
  const list = (tab === 'lent' ? lent : bor).sort((a, b) => (a.due < b.due ? -1 : 1));
  const nudges = lent.filter(late).length;
  let body;
  if (!list.length)
    body = empty(tab === 'lent' ? 'hand' : 'box', tab === 'lent' ? 'Nothing lent out right now' : 'You’re not borrowing anything',
      tab === 'lent' ? 'Items you lend will appear here once someone borrows them.' : 'Browse items to borrow something.',
      '<div class="cta c"><a class="btn" href="#browse">Browse items</a></div>');
  else
    body = `<div class="grid">${list.map((i) => `
<article class="card item" onclick="location.hash='item-${i.id}'">
  <div class="item-image-wrap loan-image">${categoryImage(i.cat, 'item-image')}</div><h3>${esc(i.name)}</h3>
  <p class="mu">${tab === 'lent' ? 'With ' + esc(i.borrower) : 'From ' + esc(i.owner)} · due ${fd(i.due)}</p>${badge(i, true)}</article>`).join('')}</div>`;
  return `
<div class="ph"><div><h2>My loans</h2><p class="mu">Private to you, signed in as <b>${esc(profile.name)}</b></p></div></div>
${nudges && tab === 'lent' ? `<div class="soft">${icon('moon')} ${nudges} item${nudges > 1 ? 's are' : ' is'} a little overdue. Open it to send a gentle reminder.</div>` : ''}
<div class="chips"><button class="chip ${tab === 'lent' ? 'on' : ''}" onclick="setTab('lent')">Lent by me (${lent.length})</button><button class="chip ${tab === 'borrowed' ? 'on' : ''}" onclick="setTab('borrowed')">Borrowed by me (${bor.length})</button></div>
${body}`;
}

function item(id) {
  const i = find(id);
  if (!i) return empty('info', 'Item not found', 'It may have been removed.', '<div class="cta c"><a class="btn" href="#browse">Back to browse</a></div>');
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
    side = own ? `<h3>Returned</h3><p class="mu">Ready for the next person?</p><button class="btn full" onclick="setStatus('${i.id}','available')">Make available again</button>`
      : `<h3>Recently returned</h3><p class="mu">It will be available again soon.</p>`;
  else if (own)
    side = `<h3>Loan details</h3>
<dl class="dl"><dt>Borrowed by</dt><dd>${esc(i.borrower)}</dd><dt>Due date</dt><dd>${fd(i.due)}</dd></dl>
<button class="btn ok full" onclick="ret('${i.id}')">${icon('check')} Mark as returned</button>
<h3 style="margin-top:24px">Gentle reminder</h3>
<p class="mu">A private message you can send in person. It contains no contact details.</p>
<div class="chips">${[['gentle', 'Gentle'], ['friendly', 'Friendly'], ['brief', 'Brief']].map(([k, l]) => `<button class="chip ${tone === k ? 'on' : ''}" onclick="setTone('${k}','${i.id}')">${l}</button>`).join('')}</div>
<button class="btn g full" onclick="gen('${i.id}')">${icon('mail')} Generate reminder</button>
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
    ${inv && late(i) ? `<div class="soft">${icon('moon')} <b>Gentle nudge:</b> this was due on ${fd(i.due)}. ${own ? 'A friendly reminder might help.' : 'A quick return would be appreciated, or extend the date.'}<br><small>${icon('lock')} Only you and the ${own ? 'borrower' : 'owner'} can see this.</small></div>` : ''}
    <div class="item-image-wrap detail-image">${categoryImage(i.cat, 'item-image')}</div>
    <h2>${esc(i.name)}</h2>
    <p>${badge(i, inv)} <span class="b p">${esc(i.cat)}</span></p>
    <p class="mu">Listed by ${esc(i.owner)}${i.block ? ' · ' + esc(i.block) : ''}</p>
    ${i.note ? `<p>${esc(i.note)}</p>` : ''}
    <h3 style="margin-top:20px">Lending cycle</h3>${stepper(i.status)}
    ${inv ? `<h3 style="margin-top:20px">History <span class="lock">${icon('lock')} private</span></h3><ul class="tl">${i.log.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>` : ''}
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
  <div class="chips" style="margin:0 0 6px">${QUICK.map(([n, c], k) => `<button class="chip" onclick="quick(${k})">${categoryImage(c, 'quick-pick-image')} ${n}</button>`).join('')}</div>
  <label for="n">Item name *</label><input id="n" placeholder="e.g. Scientific calculator">
  <div class="fg"><div><label for="c">Category</label><select id="c">${CATS.map((c) => `<option>${c}</option>`).join('')}</select></div>
  <div><label for="a">Availability</label><select id="a"><option value="available">Available now</option><option value="unavailable">Not available right now</option></select></div></div>
  <div class="fg"><div><label for="on">Your first name *</label><input id="on" placeholder="e.g. Meera" value="${esc(profile.name)}"></div>
  <div><label for="ob">Block / floor (optional)</label><input id="ob" placeholder="e.g. Block A, 2nd floor" value="${esc(profile.block)}"></div></div>
  <label for="nt">Note (optional)</label><textarea id="nt" rows="3" placeholder="Condition, handover time…"></textarea>
  <p class="hint">${icon('lock')} Please don’t add phone numbers or emails. BorrowBox never needs them.</p>
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
  remind = ''; save(); toast('Marked as returned'); ren();
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
    friendly: `Hey ${i.borrower}!\n\nQuick check-in about the “${i.name}”: it ${when}${isLate ? ` (${n} day${n > 1 ? 's' : ''} ago)` : ''}. Could we catch up sometime today or tomorrow so I can get it back? Happy to wait a little if you still need it.\n\n– ${i.owner}`,
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
const setStage = (k) => { stage = k; ren(false, true); };
const setHomeStep = (k) => { homeStep = k; ren(false, true); };
const flipPromise = (k) => { promiseOpen = promiseOpen === k ? -1 : k; ren(false, true); };
const setHomeTone = (k) => { homeTone = k; ren(false, true); };
const setFaq = (k) => { faqOpen = faqOpen === k ? -1 : k; ren(false, true); };
const goCategory = (c) => { cat = c; q = ''; if (location.hash === '#browse') ren(); else location.hash = 'browse'; };
async function copyHomeReminder() {
  const messages = {
    gentle: 'Hi there, just a gentle note about the item you borrowed. No rush — whenever you get a chance, could you let me know when it might be returned? Thanks so much.',
    friendly: 'Hey! Quick check-in about the item you borrowed. Could we coordinate a return sometime today or tomorrow? Happy to work around your schedule.',
    brief: 'Hi, a friendly reminder about the borrowed item. Please return it when you can. Thanks!',
  };
  const message = messages[homeTone];
  if (!navigator.clipboard) return toast('Clipboard access is not available in this browser');
  try { await navigator.clipboard.writeText(message); toast('Preview copied'); }
  catch { toast('Clipboard access is not available in this browser'); }
}
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
Object.assign(window, { addItem, quick, borrow, ret, setStatus, extend, gen, copyMsg, del, loadSamples, clearAll, setCat, setTab, setQ, setStage, setHomeStep, flipPromise, setHomeTone, setFaq, goCategory, copyHomeReminder, setTone, skip, openWho, closeWho, pickWho, saveWho });

/* ---------- router ---------- */
function ren(keepFocus, keepScroll = false) {
  const r = (location.hash || '#home').slice(1);
  $('app').innerHTML = r.startsWith('item-') ? item(r.slice(5)) : ({ home, browse, loans, list: add }[r] || home)();
  const key = r.startsWith('item-') ? 'browse' : r;
  document.querySelectorAll('nav a.l').forEach((a) => a.classList.toggle('on', a.dataset.r === key));
  $('who').innerHTML = profile.name ? `<span class="who-icon">${icon('user')}</span>${esc(profile.name)}` : `<span class="who-icon">${icon('user')}</span>Set your name`;
  $('clk').innerHTML = `Demo date <b>${fd(iso(0))}</b> · <button onclick="skip(1)">+1 day</button><button onclick="skip(3)">+3 days</button>${offset ? '<button onclick="skip(0)">Reset</button>' : ''}${items.length ? '<button onclick="clearAll()">Clear all data</button>' : ''}`;
  $('modal').innerHTML = modal ? whoModal() : '';
  if (keepFocus) { const s = $('s'); if (s) { s.focus(); s.setSelectionRange(q.length, q.length); } }
  else if (!modal && !keepScroll) window.scrollTo(0, 0);
  if (r === 'home' || !location.hash || location.hash === '#home') bindHomeInteractions();
}
function bindHomeInteractions() {
  const root = $('homeRoot');
  if (!root) return;
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealNodes = root.querySelectorAll('.reveal');
  if (reduced || !('IntersectionObserver' in window)) revealNodes.forEach((el) => el.classList.add('is-visible'));
  else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } });
    }, { threshold: 0.12 });
    revealNodes.forEach((el) => revealObserver.observe(el));
  }
  const counters = root.querySelectorAll('[data-count]');
  const animateCounters = () => counters.forEach((el) => {
    const target = Number(el.dataset.count) || 0;
    if (reduced || target === 0) { el.textContent = String(target); return; }
    const start = performance.now(), duration = 850;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      el.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  if ('IntersectionObserver' in window) {
    const statsObserver = new IntersectionObserver((entries, observer) => {
      if (entries.some((entry) => entry.isIntersecting)) { animateCounters(); observer.disconnect(); }
    }, { threshold: 0.2 });
    const stats = root.querySelector('.stats-premium');
    if (stats) statsObserver.observe(stats);
  } else animateCounters();
  if (!reduced && window.matchMedia('(pointer:fine)').matches) {
    let frame = 0;
    root.addEventListener('pointermove', (event) => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = root.getBoundingClientRect();
        root.style.setProperty('--mx', `${event.clientX - rect.left}px`);
        root.style.setProperty('--my', `${event.clientY - rect.top}px`);
        frame = 0;
      });
    }, { passive: true });
    root.querySelectorAll('[data-tilt]').forEach((el) => {
      el.addEventListener('pointermove', (event) => {
        const rect = el.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        el.style.transform = `perspective(900px) rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 4).toFixed(2)}deg) translateY(-2px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
    root.querySelectorAll('.magnetic').forEach((el) => {
      el.addEventListener('pointermove', (event) => {
        const rect = el.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        el.style.transform = `translate(${(x * .07).toFixed(1)}px,${(y * .12).toFixed(1)}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }
}
window.addEventListener('hashchange', () => { remind = ''; modal = false; ren(); });
ren();
