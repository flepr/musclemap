/* MuscleMap — interface */
import { FAMILIES, GROUPS, MUSCLES, SHORT, GROUP_OF, ALL_MUSCLES, STUDIES, DEFAULTS } from './data.js';
import { t, L, setLang, lang, locale } from './i18n.js';
import { state, load, save, upsertSession, deleteSession, restoreSession, updateSettings, uid, parseData, mergeInto, serialize } from './store.js';
import { allStates, targets, priority, nextTarget, isTracked, trackedMuscles, sessionGroups, knownMuscles } from './logic.js';
import { bodyPair, groupFigure, PALETTES, heatColor } from './body.js';
import { initSync, syncNow, login, logout, reconnect, connected, available, lastStatus, provider, providers, lastProvider } from './sync.js';
import { isStandalone, guideHTML, installCard, startReminders, stopReminders, markSeen, promptInstall, onInstallChange, appUrl, tx } from './install.js';

const VERSION = '2.4';
const $ = s => document.querySelector(s);
const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cap = s => s ? s.charAt(0).toLocaleUpperCase(locale()) + s.slice(1) : s;
const low = s => s ? s.charAt(0).toLocaleLowerCase(locale()) + s.slice(1) : s;
const gName = g => GROUPS[g][lang()];
const gSci = g => lang() === 'fr' ? GROUPS[g].sciFr : GROUPS[g].sciEn;
const mName = m => MUSCLES[m] ? L(MUSCLES[m], 'name') : m;
const mShort = m => SHORT[lang()][m] || mName(m);
const fName = f => FAMILIES.find(x => x.id === f)[lang()];

/* ---------- icônes ---------- */
const I = {
  cloud: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.5 19H8a5 5 0 1 1 1.6-9.7A6 6 0 0 1 21 11.5 3.75 3.75 0 0 1 17.5 19z"/><path d="m9.5 13.5 2 2 3.5-3.5"/></svg>',
  cloudOff: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.5 19H8a5 5 0 1 1 1.6-9.7A6 6 0 0 1 21 11.5 3.75 3.75 0 0 1 17.5 19z"/><path d="M12 10v3.5M12 16.5v.01"/></svg>',
  sync: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 0 0-14.3-4.9L4 8"/><path d="M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.3 4.9L20 16"/><path d="M20 20v-4h-4"/></svg>',
  chev: '<svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
  down: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
  up: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg>',
  x: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  back: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
  check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>',
  cal: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  plus: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  map: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="4.5" r="2.5"/><path d="M6 9.5c2 .8 4 1.2 6 1.2s4-.4 6-1.2"/><path d="M12 10.7V15m0 0-3 6m3-6 3 6"/></svg>',
  hist: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/></svg>',
  musc: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.5 6.5h11M6.5 17.5h11"/><rect x="2" y="4" width="4.5" height="5" rx="1"/><rect x="17.5" y="4" width="4.5" height="5" rx="1"/><rect x="2" y="15" width="4.5" height="5" rx="1"/><rect x="17.5" y="15" width="4.5" height="5" rx="1"/><path d="M12 6.5v11"/></svg>',
  set: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></svg>',
  search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  sun: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>',
  dl: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m0 0-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>',
  ul: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3m0 0-4 4m4-4 4 4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>',
  out: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3"/></svg>',
  flask: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3"/><path d="M7 15h10"/></svg>',
  google: '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8.1z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7.1H2.1a11 11 0 0 0 0 9.9z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z"/></svg>',
  microsoft: '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="#F25022" d="M2 2h9.5v9.5H2z"/><path fill="#7FBA00" d="M12.5 2H22v9.5h-9.5z"/><path fill="#00A4EF" d="M2 12.5h9.5V22H2z"/><path fill="#FFB900" d="M12.5 12.5H22V22h-9.5z"/></svg>',
  target: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',
};

/* ---------- dates ---------- */
const DAY = 864e5;
const startOfDay = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const dayDiff = (ts, now = Date.now()) => Math.round((startOfDay(now) - startOfDay(ts)) / DAY);
const startOfWeek = d => { const x = startOfDay(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
function isoWeek(d) { const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const n = x.getUTCDay() || 7; x.setUTCDate(x.getUTCDate() + 4 - n); const y0 = new Date(Date.UTC(x.getUTCFullYear(), 0, 1)); return Math.ceil(((x - y0) / DAY + 1) / 7); }
const fmtLong = d => cap(new Date(d).toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' }));
const fmtTime = d => new Date(d).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
const fmtShort = d => new Date(d).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });
function toInput(d) { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 16); }
/* « aujourd'hui », « hier », « 8 j », « jamais » */
function rel(st, ts) {
  if (st.never) return t('neverShort');
  const dd = dayDiff(ts);
  if (dd <= 0) return st.hours < 1 ? t('minutesAgo', { n: Math.max(1, Math.round(st.hours * 60)) }) : t('hoursAgo', { n: Math.floor(st.hours) });
  if (dd === 1) return t('yesterday');
  return t('daysAgo', { n: dd });
}

/* ---------- thème ---------- */
const mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
function themeName() {
  const p = state.settings.theme;
  return p === 'dark' || (p !== 'light' && mq && mq.matches) ? 'dark' : 'light';
}
function applyTheme() {
  const th = themeName();
  document.documentElement.dataset.theme = th;
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.content = th === 'dark' ? '#0e0f11' : '#f3f1ed';
}
const pal = () => PALETTES[themeName()];

/* ---------- état de l'interface ---------- */
const ui = { tab: 'map', overlay: null, sheet: null, search: '', showAll: false, unlocked: false };
let draft = null;   // séance en cours de saisie

/* ---------- rendu général ---------- */
function render() {
  if (!ui.unlocked) return;
  renderTabs();
  const y = window.scrollY;
  const v = $('#view');
  v.innerHTML = ui.tab === 'map' ? viewMap() : ui.tab === 'history' ? viewHistory() : ui.tab === 'muscles' ? viewMuscles() : viewSettings();
  window.scrollTo(0, y);
  if (ui.sheet) renderSheet();
}
function renderTabs() {
  const tab = (id, icon, label) => `<button class="tab" data-act="tab" data-tab="${id}" ${ui.tab === id ? 'aria-current="page"' : ''}>${icon}${esc(label)}<span class="bar"></span></button>`;
  $('#tabs').setAttribute('aria-label', t('navMain'));
  $('#tabs').innerHTML = `<div class="in">${tab('map', I.map, t('tabMap'))}${tab('history', I.hist, t('tabHistory'))}`
    + `<button class="tab fab" data-act="workout" aria-label="${esc(t('newWorkout'))}"><span class="plus">${I.plus}</span>${esc(t('tabWorkout'))}</button>`
    + `${tab('muscles', I.musc, t('tabMuscles'))}${tab('settings', I.set, t('tabSettings'))}</div>`;
}

/* ---------- pastille de synchro ---------- */
function syncPill() {
  if (!available()) return '';
  const s = lastStatus;
  let cls = '', icon = I.cloud, txt;
  if (!connected()) { icon = I.cloudOff; cls = 'warn'; txt = t('syncLocal'); }
  else if (s.state === 'ok') { cls = 'ok'; txt = t('syncOk', { t: fmtTime(s.at) }); }
  else if (s.state === 'syncing') { icon = I.sync; txt = t('syncing'); }
  else if (s.state === 'offline') { icon = I.cloudOff; cls = 'warn'; txt = t('syncOffline'); }
  else if (s.state === 'error') { icon = I.cloudOff; cls = 'warn'; txt = t('syncError', { p: provider().name }); }
  else if (s.state === 'reauth') { icon = I.sync; cls = 'warn'; txt = t('syncReauth'); }
  else { icon = I.cloudOff; cls = 'warn'; txt = t('syncLocal'); }
  const long = s.state === 'reauth' || s.state === 'ok' || s.state === 'offline' || s.state === 'error' ? syncLine() : txt;
  return `<button class="pill ${cls}" id="syncpill" data-act="${s.state === 'reauth' ? 'reconnect' : 'syncnow'}" aria-label="${esc(long)}" title="${esc(long)}">${icon}<span>${esc(txt)}</span></button>`;
}
function updateSyncUI() {
  const p = $('#syncpill'); if (p) p.outerHTML = syncPill();
  const r = $('#syncstatus'); if (r) r.textContent = syncLine();
  const b = $('#syncbtn'); if (b) b.outerHTML = syncBtn();
}
function syncBtn() {
  return lastStatus.state === 'reauth'
    ? `<button class="btn small acc" id="syncbtn" data-act="reconnect">${esc(t('reconnect'))}</button>`
    : `<button class="btn small" id="syncbtn" data-act="syncnow">${esc(t('syncNow'))}</button>`;
}
function syncLine() {
  const s = lastStatus;
  if (!connected()) return t('notConnected');
  const p = provider().name;
  if (s.state === 'ok') return t('syncOkLong', { t: fmtTime(s.at), p });
  if (s.state === 'offline') return t('syncOfflineLong');
  if (s.state === 'error') return t('syncErrorLong', { p });
  if (s.state === 'reauth') return t('syncReauthLong', { a: provider().account });
  return t('syncing');
}

/* ---------- carte ---------- */
function mapFill(states, p) {
  const none = !state.sessions.length;            // premier lancement : corps neutre, pas tout « à cibler »
  return m => {
    if (none) return isTracked(m) ? p.steel : p.off;
    const s = states[m];
    if (!s || s.state === 'off') return p.off;
    if (s.state === 'target') return p.target;
    if (s.state === 'recover') return heatColor(p, s.intensity);
    return p.steel;
  };
}
function legend(withOff) {
  return `<div class="legend"><span><i class="sw rec"></i>${esc(t('stRecover'))}</span><span><i class="sw ready"></i>${esc(t('stReady'))}</span><span><i class="sw tgt"></i>${esc(t('stTarget'))}</span>${withOff ? `<span><i class="sw off"></i>${esc(t('stOff'))}</span>` : ''}</div>`;
}
/* « a », « a et b », « a, b et c », « a, b, c et 2 autres » */
function listText(labels, more) {
  const xs = more ? [...labels, t(more > 1 ? 'listMorePl' : 'listMore', { n: more })] : labels;
  return xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(', ') + t('listAnd') + xs[xs.length - 1];
}
function targetLabel(it) {
  return it.whole ? gName(it.group) : it.muscles.map(mName).join(', ');
}
function viewMap() {
  const states = allStates();
  const list = targets(states);
  const pr = priority(list, (g, m) => low(g ? gName(g) : mName(m)));
  const lastTs = Math.max(0, ...state.sessions.map(s => new Date(s.datetime).getTime()));
  const dd = lastTs ? dayDiff(lastTs) : null;
  const lastTxt = !lastTs ? t('lastNone') : dd <= 0 ? t('lastToday') : dd === 1 ? t('lastYesterday') : t('lastDays', { n: dd });

  let title, sub = '';
  if (pr.kind === 'first') { title = t('firstTitle'); sub = t('firstSub'); }
  else if (pr.kind === 'clear') {
    title = t('allGood');
    const nx = nextTarget(states);
    sub = nx ? t('allGoodSub', { x: low(gName(GROUP_OF[nx.m])), n: Math.max(1, Math.ceil(nx.left)) }) : t('allGoodSubNone');
  } else title = t('priority', { x: listText(pr.labels, pr.more) });

  const nMusclesTarget = list.reduce((a, it) => a + it.muscles.length, 0);
  const hasOff = state.settings.excluded.length > 0;
  const shown = ui.showAll ? list : list.slice(0, 3);

  const rows = shown.map(it => {
    const d = it.never ? `<b>—</b><small>${esc(t('never'))}</small>` : `<b>${Math.floor(it.days)}</b><small>${esc(Math.floor(it.days) === 1 ? t('day') : t('days'))}</small>`;
    const subTxt = it.whole ? trackedMuscles(it.group).map(mName).join(' · ') : t('partialDone', { g: gName(it.group) });
    return `<button class="trow" data-act="sheet" data-g="${it.group}"><span class="tdays">${d}</span><span class="tmain"><b>${esc(cap(targetLabel(it)))}</b><span>${esc(subTxt)}</span></span>${I.chev}</button>`;
  }).join('');
  const rest = list.slice(3);
  const more = !rest.length ? '' : ui.showAll
    ? `<button class="linkbtn" data-act="showall">${esc(t('showLess'))}</button>`
    : `<button class="linkbtn" data-act="showall">${esc(t('moreTargets', { x: rest.map(it => targetLabel(it)).join(', ') }))}</button>`;

  return `<div class="screen">
    <header class="hdr"><div class="wordmark">MUSCLE<span>MAP</span></div>${syncPill()}</header>
    <div style="padding:0 4px">
      <div class="eyebrow">${esc(fmtLong(Date.now()))} · ${esc(lastTxt)}</div>
      <h1 class="h1" style="margin-top:4px">${esc(title)}</h1>
      ${sub ? `<p class="note" style="padding:6px 0 0">${esc(sub)}</p>` : ''}
    </div>
    ${installCard()}
    <section class="card mapcard" aria-label="${esc(t('mapLabel'))}">
      <div data-bodyact="sheet">${bodyPair(mapFill(states, pal()), pal(), { interactive: true, label: t('mapLabel') })}</div>
      <div class="views"><span>${esc(t('viewFront'))}</span><span>${esc(t('viewBack'))}</span></div>
      ${legend(hasOff)}
      <p class="hint">${esc(t('mapHint'))}</p>
    </section>
    ${pr.kind === 'first' ? `<button class="btn" data-act="workout">${esc(t('startWorkout'))}</button>` : `
    <section aria-labelledby="h-tgt" style="display:flex;flex-direction:column;gap:8px">
      <div class="sect-row"><h2 class="h2" id="h-tgt">${esc(t('toTarget'))}</h2><span class="note" style="padding:0">${esc(nMusclesTarget === 1 ? t('toTargetMeta1', { d: state.settings.targetDays }) : t('toTargetMeta', { n: nMusclesTarget, d: state.settings.targetDays }))}</span></div>
      ${list.length ? `<div class="tlist">${rows}</div>${more}` : `<div class="empty">${esc(t('nothingToTarget', { d: state.settings.targetDays }))}</div>`}
    </section>`}
  </div>`;
}

/* ---------- historique ---------- */
function viewHistory() {
  const now = Date.now();
  const states = allStates(now);
  const recent = state.sessions.filter(s => { const ts = new Date(s.datetime).getTime(); return ts >= now - 7 * DAY && ts <= now + DAY; });
  const groupsTracked = Object.keys(GROUPS).filter(g => trackedMuscles(g).length);
  const groups7 = new Set(); recent.forEach(s => s.muscles.forEach(m => { const g = GROUP_OF[m]; if (g && groupsTracked.includes(g)) groups7.add(g); }));
  const nTarget = ALL_MUSCLES.filter(m => states[m].state === 'target').length;

  const ws = startOfWeek(now);
  const days = [...Array(7)].map((_, i) => { const d = new Date(ws); d.setDate(d.getDate() + i); return d; });
  const sessDays = new Set(state.sessions.map(s => startOfDay(s.datetime).getTime()));
  const wk = t('weekdaysShort').map(n => `<span class="dn">${esc(n)}</span>`).join('')
    + days.map(d => { const k = d.getTime(), today = k === startOfDay(now).getTime(); return `<span class="d${sessDays.has(k) ? ' on' : ''}${today ? ' today' : ''}${k > now ? ' future' : ''}">${d.getDate()}</span>`; }).join('');

  const sorted = [...state.sessions].sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
  let html = '', lastWeek = null;
  for (const s of sorted) {
    const w = startOfWeek(s.datetime).getTime();
    if (w !== lastWeek) {
      lastWeek = w;
      const lab = w === ws.getTime() ? t('thisWeek') : w === ws.getTime() - 7 * DAY ? t('lastWeek') : t('weekOf', { d: fmtShort(w).toLocaleUpperCase(locale()) });
      html += `<div class="sect" style="padding-top:8px">${esc(lab)}</div>`;
    }
    const ms = knownMuscles(s.muscles);
    const sg = sessionGroups(ms);
    const tags = sg.map(x => x.whole ? `<span class="stag">${esc(gName(x.group))}</span>` : `<span class="stag part">${esc(gName(x.group))}<i> · ${esc(x.muscles.map(mShort).join(', '))}</i></span>`).join('');
    html += `<button class="scard" data-act="edit" data-id="${esc(s.id)}" aria-label="${esc(t('options', { d: fmtLong(s.datetime) }))}"><h3>${esc(fmtLong(s.datetime))}</h3><div class="meta">${esc(t('sessionMeta', { t: fmtTime(s.datetime), m: ms.length, g: sg.length }))}</div><div class="stags">${tags}</div></button>`;
  }

  return `<div class="screen">
    <header class="hdr" style="align-items:flex-end"><h1 class="h1 big">${esc(t('history'))}</h1><span class="note" style="padding:0">${esc(state.sessions.length === 1 ? t('sessionsSince1') : t('sessionsSince', { n: state.sessions.length }))}</span></header>
    <div class="tiles">
      <div class="tile"><b>${recent.length}</b><span>${esc(t('tileSessions'))}</span></div>
      <div class="tile"><b>${groups7.size}<small>/${groupsTracked.length}</small></b><span>${esc(t('tileGroups'))}</span></div>
      <div class="tile tgt"><b>${nTarget}</b><span>${esc(t('tileTarget'))}</span></div>
    </div>
    <div class="card weekcard"><div class="wkhead"><span>${esc(new Date(now).toLocaleDateString(locale(), { month: 'long', year: 'numeric' }).toLocaleUpperCase(locale()))}</span><span>${esc(t('week', { n: isoWeek(new Date(now)) }))}</span></div><div class="wk">${wk}</div></div>
    <div style="display:flex;flex-direction:column;gap:8px">${html || `<div class="empty">${esc(t('noSessions'))}</div>`}</div>
  </div>`;
}

/* ---------- onglet Muscles ---------- */
const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
function groupDot(g, states) {
  const tm = trackedMuscles(g);
  if (tm.some(m => states[m].state === 'target')) return '<i class="dot tgt"></i>';
  if (tm.some(m => states[m].state === 'recover')) return '<i class="dot rec"></i>';
  return '';
}
function groupThumb(g) {
  const p = pal(), ms = GROUPS[g].muscles;
  return groupFigure(ms, m => { const i = ms.indexOf(m); return i < 0 ? p.dim : p.tones[i]; }, p, gName(g));
}
function viewMuscles() {
  const states = allStates();
  let body;
  if (ui.search.trim()) {
    const q = norm(ui.search.trim());
    const hits = ALL_MUSCLES.filter(m => {
      const g = GROUP_OF[m];
      const hay = [MUSCLES[m].fr.name, MUSCLES[m].fr.sci, MUSCLES[m].en.name, MUSCLES[m].en.sci, GROUPS[g].fr, GROUPS[g].en, GROUPS[g].sciFr, GROUPS[g].sciEn].join(' ');
      return norm(hay).includes(q);
    });
    body = hits.length ? `<div style="display:flex;flex-direction:column;gap:6px">${hits.map(m => `<button class="lrow" style="min-height:62px;padding-left:14px" data-act="sheet" data-g="${GROUP_OF[m]}"><span class="tmain"><b>${esc(mName(m))}</b><span>${esc(gName(GROUP_OF[m]))} · ${esc(L(MUSCLES[m], 'sci'))}</span></span>${I.chev}</button>`).join('')}</div>`
      : `<div class="empty">${esc(t('noResult'))}</div>`;
  } else {
    const cards = [1, 2, 3].map(n => `<button class="bcard${n === 1 ? ' dark' : ''}" data-act="article" data-a="${n}"><small>${esc(t('art' + n + 'Eyebrow'))}</small><b>${esc(t('art' + n + 'Title'))}</b><span>${esc(t('art' + n + 'Sub'))}</span></button>`).join('');
    const fams = FAMILIES.map(f => `<section style="display:flex;flex-direction:column;gap:6px"><h2 class="sect">${esc(fName(f.id))}</h2>${f.groups.map(g => `<button class="lrow" data-act="sheet" data-g="${g}"><span class="thumb">${groupThumb(g)}</span><span class="tmain"><b>${esc(gName(g))}</b><span>${esc(gSci(g))}</span></span><span class="n">${groupDot(g, states)}${GROUPS[g].muscles.length}</span>${I.chev}</button>`).join('')}</section>`).join('');
    body = `<section style="display:flex;flex-direction:column;gap:8px"><h2 class="sect">${esc(t('basics'))}</h2><div class="basics">${cards}</div></section>${fams}`;
  }
  return `<div class="screen">
    <header class="hdr" style="align-items:flex-end"><h1 class="h1 big">${esc(t('muscles'))}</h1><span class="note" style="padding:0">${esc(t('musclesMeta'))}</span></header>
    <label class="search">${I.search}<span class="sr">${esc(t('searchLabel'))}</span><input type="search" id="q" value="${esc(ui.search)}" placeholder="${esc(t('search'))}" autocomplete="off"></label>
    ${body}
  </div>`;
}

/* ---------- fiche d'un groupe (panneau du bas) ---------- */
function openSheet(g) { ui.sheet = { g }; document.body.classList.add('locked'); renderSheet(); }
function closeSheet() { ui.sheet = null; $('#sheet').innerHTML = ''; if (!ui.overlay) document.body.classList.remove('locked'); }
function renderSheet() {
  const g = ui.sheet.g, p = pal(), states = allStates(), last = {};
  for (const s of state.sessions) { const ts = new Date(s.datetime).getTime(); for (const m of s.muscles) if (!last[m] || ts > last[m]) last[m] = ts; }
  const ms = GROUPS[g].muscles;
  const fig = groupFigure(ms, m => { const i = ms.indexOf(m); return i < 0 ? p.dim : p.tones[i]; }, p, gName(g));
  const rows = ms.map((m, i) => {
    const st = states[m], tr = isTracked(m);
    const lab = { recover: t('stRecover'), ready: t('stReady'), target: t('stTarget'), off: t('stOff') }[st.state];
    const cls = { recover: 'rec', ready: 'ready', target: 'tgt', off: 'off' }[st.state];
    const mm = L(MUSCLES[m]);
    return `<li><span class="tone" style="background:${p.tones[i]}"></span>
      <div class="info"><b>${esc(mm.name)}</b><span class="sci">${esc(mm.sci)}</span><span class="role">${esc(mm.role)}</span><span class="ex">${esc(mm.ex)}</span></div>
      <div class="side"><span class="lab ${cls}">${esc(lab)}</span><span class="when2">${esc(rel(st, last[m]))}</span>
        <span class="trackline"><span class="sr">${esc(t('track'))}</span><button class="switch sm" role="switch" aria-checked="${tr}" aria-label="${esc(t('track'))} : ${esc(mm.name)}" data-act="track" data-m="${m}"><i></i></button></span></div></li>`;
  }).join('');
  const late = ms.filter(m => isTracked(m) && states[m].state === 'target');
  const foot = late.length
    ? `<button class="btn" data-act="workout-with" data-ms="${late.join(',')}">${I.target}${esc(t('targetThese', { x: late.length === ms.filter(isTracked).length ? low(gName(g)) : late.map(m => low(mName(m))).join(' + ') }))}</button>`
    : `<button class="btn ghost" data-act="workout-with" data-ms="${(trackedMuscles(g).length ? trackedMuscles(g) : ms).join(',')}">${esc(t('recordGroup'))}</button>`;
  const prev = $('#sheet .scroll');
  const y = prev ? prev.scrollTop : 0;
  $('#sheet').innerHTML = `<div class="sheet-wrap"><div class="sheet-bg" data-act="closesheet"></div>
    <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="sh-t"><div class="grab"></div>
      <div class="scroll">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-top:6px">
          <div><h2 id="sh-t">${esc(gName(g))}</h2><div class="note" style="padding:4px 0 0;font-size:14px">${esc(gSci(g))}</div></div>
          <button class="iconbtn" data-act="closesheet" aria-label="${esc(t('close'))}" style="margin:-6px -8px 0 0">${I.x}</button>
        </div>
        <div class="figbox">${fig}</div>
        <ul class="mlist">${rows}</ul>
      </div>
      <div class="foot">${foot}</div>
    </section></div>`;
  const nx = $('#sheet .scroll'); if (nx) nx.scrollTop = y;
}

/* ---------- réglages ---------- */
function seg(name, cur, opts, cls = 'c3') {
  return `<div class="seg ${cls}" role="radiogroup">${opts.map(o => `<button role="radio" aria-checked="${o.v === cur}" data-act="${name}" data-v="${o.v}">${o.html}</button>`).join('')}</div>`;
}
const LIMITS = { recSmall: [12, 96, 12], recBig: [24, 144, 12], targetDays: [2, 14, 1] };
function canStep(k, d) {
  const s = state.settings, [lo, hi, st] = LIMITS[k], v = s[k] + d * st;
  if (v < lo || v > hi) return false;
  if (k === 'targetDays' && v * 24 <= Math.max(s.recSmall, s.recBig)) return false;
  if (k !== 'targetDays' && d > 0 && v >= 14 * 24) return false;
  return true;
}
function stepper(k, label, sub, unitKey) {
  const v = state.settings[k];
  return `<div class="srow"><i class="sw ${k === 'targetDays' ? 'tgt' : 'rec'}"></i><span class="tmain"><b>${esc(label)}</b><span>${esc(sub)}</span></span>
    <span class="stepper"><button data-act="step" data-k="${k}" data-d="-1" aria-label="${esc(t('decrease'))} : ${esc(label)}" ${canStep(k, -1) ? '' : 'disabled'}>−</button><output>${esc(t(unitKey, { n: v }))}</output><button data-act="step" data-k="${k}" data-d="1" aria-label="${esc(t('increase'))} : ${esc(label)}" ${canStep(k, 1) ? '' : 'disabled'}>+</button></span></div>`;
}
function viewSettings() {
  const s = state.settings, auto = (s.lang === 'auto');
  const isDef = s.recSmall === DEFAULTS.recSmall && s.recBig === DEFAULTS.recBig && s.targetDays === DEFAULTS.targetDays;
  const recMax = Math.max(s.recSmall, s.recBig), recDays = recMax / 24;
  const fr = [recDays, Math.max(.5, s.targetDays - recDays), 2];
  const nTracked = ALL_MUSCLES.filter(isTracked).length;
  const autoLangName = (navigator.languages && /^fr\b/i.test(navigator.languages[0] || navigator.language)) ? 'Français' : 'English';
  const autoThemeName = mq && mq.matches ? t('themeDark') : t('themeLight');
  const studies = STUDIES.map(x => `<li><a href="${x.url}" target="_blank" rel="noopener">${esc(x.ref)}</a> — ${esc(x[lang()])}</li>`).join('');
  const pv = provider();
  const cloud = !available() ? '' : connected()
    ? `<div class="srow"><span class="plogo">${I[pv.id === 'google' ? 'google' : 'microsoft']}</span><span class="tmain"><b>${esc(pv.name)}</b>${pv.email() ? `<span class="acct">${esc(pv.email())}</span>` : ''}<span id="syncstatus">${esc(syncLine())}</span></span>${syncBtn()}</div>`
    : `<div class="srow"><span style="color:var(--amber)">${I.cloudOff.replace('width="16" height="16"', 'width="24" height="24"')}</span><span class="tmain"><b>${esc(t('cloudSave'))}</b><span>${esc(t('notConnected'))}</span></span><button class="btn small" data-act="login">${esc(t('connect'))}</button></div>`;
  return `<div class="screen">
    <header class="hdr"><h1 class="h1 big">${esc(t('settings'))}</h1></header>

    <section style="display:flex;flex-direction:column;gap:8px"><h2 class="sect">${esc(t('language'))}</h2>
      ${seg('lang', s.lang, [{ v: 'auto', html: `${esc(t('langAuto'))}<small>${autoLangName}</small>` }, { v: 'fr', html: 'Français' }, { v: 'en', html: 'English' }])}
      <p class="note">${esc(t('langNote'))}</p></section>

    <section style="display:flex;flex-direction:column;gap:8px"><h2 class="sect">${esc(t('theme'))}</h2>
      ${seg('theme', s.theme, [{ v: 'auto', html: `${esc(t('themeAuto'))}<small>${esc(autoThemeName)}</small>` }, { v: 'light', html: `<span class="ico">${I.sun}${esc(t('themeLight'))}</span>` }, { v: 'dark', html: `<span class="ico">${I.moon}${esc(t('themeDark'))}</span>` }])}
      <p class="note">${esc(t('themeNote'))}</p></section>

    <section style="display:flex;flex-direction:column;gap:8px"><h2 class="sect">${esc(t('recovery'))}</h2>
      <div class="group">
        ${stepper('recSmall', t('recSmall'), t('recSmallSub'), 'hUnit')}
        ${stepper('recBig', t('recBig'), t('recBigSub'), 'hUnit')}
        ${stepper('targetDays', t('targetAfter'), t('targetAfterSub'), 'dUnit')}
        <div class="scale" aria-hidden="true"><div class="bar"><span style="flex:${fr[0]}"></span><span style="flex:${fr[1]}"></span><span style="flex:${fr[2]}"></span></div>
          <div class="lab" style="grid-template-columns:${fr[0]}fr ${fr[1]}fr ${fr[2]}fr"><span>${esc(t('scaleRec', { a: s.recSmall, b: s.recBig }))}</span><span>${esc(t('scaleReady'))}</span><span>${esc(t('scaleTarget', { d: s.targetDays }))}</span></div></div>
      </div>
      <div class="resetrow">${isDef ? `<span class="okline">${I.check}${esc(t('recommended'))}</span>` : '<span></span>'}<button class="btn small" data-act="reset" ${isDef ? 'disabled' : ''}>${esc(t('reset'))}</button></div>
      <details class="why"><summary><span style="color:var(--amber-ink)">${I.flask}</span>${esc(t('why'))}</summary>
        <div class="txt"><p>${t('why1')}</p><p>${t('why2')}</p><p style="font-weight:600;color:var(--ink)">${esc(t('studies'))}</p><ul class="studies">${studies}</ul></div></details>
    </section>

    <section style="display:flex;flex-direction:column;gap:8px"><h2 class="sect">${esc(t('workoutSec'))}</h2>
      <div class="group">
        <div class="srow" style="min-height:64px"><span class="tmain"><b>${esc(t('entryDefault'))}</b><span>${esc(t('entrySub'))}</span></span><button class="switch" role="switch" aria-checked="${s.entry === 'muscles'}" aria-label="${esc(t('entryDefault'))}" data-act="entry" data-v="${s.entry === 'muscles' ? 'groups' : 'muscles'}"><i></i></button></div>
        <button class="srow" data-act="tracked"><span class="tmain"><b>${esc(t('tracked'))}</b><span>${esc(t('trackedSub'))}</span></span><span class="note" style="padding:0">${nTracked} / ${ALL_MUSCLES.length}</span>${I.chev}</button>
      </div></section>

    <section style="display:flex;flex-direction:column;gap:8px"><h2 class="sect">${esc(t('syncSec'))}</h2>
      <div class="group">
        ${cloud}
        <button class="srow" data-act="export" style="min-height:54px"><span style="color:var(--ink-2)">${I.dl}</span><span class="tmain"><b style="font-weight:500">${esc(t('export'))}</b></span><span class="note" style="padding:0">JSON</span></button>
        <button class="srow" data-act="import" style="min-height:54px"><span style="color:var(--ink-2)">${I.ul}</span><span class="tmain"><b style="font-weight:500">${esc(t('import'))}</b></span></button>
        ${connected() ? `<button class="srow danger-txt" data-act="logout" style="min-height:54px">${I.out}<span class="tmain"><b>${esc(t('logout'))}</b></span></button>` : ''}
      </div>
      ${available() && providers().length > 1 ? `<p class="note">${esc(t('cloudNote'))}</p>` : ''}</section>

    <section style="display:flex;flex-direction:column;gap:8px"><h2 class="sect">${esc(t('instShort'))}</h2>
      <div class="group">${isStandalone()
        ? `<div class="srow" style="min-height:54px"><span class="okline" style="font-size:15px">${I.check}${esc(t('instInstalled'))}</span></div>`
        : `<button class="srow" data-act="instopen"><img src="icon-192.png" alt="" width="36" height="36" style="border-radius:9px;flex:none"><span class="tmain"><b>${esc(t('instRow'))}</b><span>${esc(t('instRowSub'))}</span></span>${I.chev}</button>`}
      </div></section>

    <section style="display:flex;flex-direction:column;gap:8px"><h2 class="sect">${esc(t('about'))}</h2>
      <div class="group">
        <button class="srow" data-act="article" data-a="all"><span class="tmain"><b>${esc(t('method'))}</b><span>${esc(t('methodSub'))}</span></span>${I.chev}</button>
        <a class="srow" href="privacy.html" style="text-decoration:none;color:inherit"><span class="tmain"><b>${esc(t('privacy'))}</b><span>${esc(t('privacySub'))}</span></span>${I.chev}</a>
        <div class="srow" style="min-height:48px;justify-content:space-between"><span class="note" style="padding:0">${esc(t('version'))}</span><span class="note" style="padding:0">${VERSION}</span></div>
      </div></section>
  </div>`;
}

/* ---------- plein écran : séance ---------- */
/* Groupes dépliés : tous en mode « muscles » ; sinon ceux qui ne sont que partiellement cochés */
function expandedFor(sel) {
  const expanded = new Set();
  if (state.settings.entry === 'muscles') Object.keys(GROUPS).forEach(g => expanded.add(g));
  for (const m of sel) { const g = GROUP_OF[m]; if (g && GROUPS[g].muscles.some(x => !sel.has(x) && isTracked(x))) expanded.add(g); }
  return expanded;
}
/* Coche ou décoche un groupe entier (muscles suivis seulement, sauf si aucun ne l'est) */
function toggleGroup(g) {
  const ms = GROUPS[g].muscles, pool = trackedMuscles(g).length ? trackedMuscles(g) : ms;
  if (groupBox(g) === 'on') ms.forEach(m => draft.sel.delete(m)); else pool.forEach(m => draft.sel.add(m));
}
function openWorkout(session, preselect) {
  const sel = new Set(session ? knownMuscles(session.muscles) : (preselect || []));
  draft = { id: session ? session.id : null, original: session || null, datetime: toInput(session ? session.datetime : Date.now()), sel, expanded: expandedFor(sel), filter: 'all' };
  ui.overlay = 'workout';
  closeSheet();
  document.body.classList.add('locked');
  renderOverlay();
}
function groupBox(g) {
  const tm = trackedMuscles(g), all = GROUPS[g].muscles;
  const pool = tm.length ? tm : all;
  const k = pool.filter(m => draft.sel.has(m)).length, any = all.some(m => draft.sel.has(m));
  if (k === pool.length && k > 0) return 'on';
  return any ? 'mid' : '';
}
function wGroup(g, states) {
  const ms = GROUPS[g].muscles, tm = trackedMuscles(g);
  const box = groupBox(g), open = draft.expanded.has(g);
  const selMs = ms.filter(m => draft.sel.has(m));
  let meta;
  if (box === 'on' && selMs.length === ms.length) meta = esc(ms.length === 1 ? t('groupAll1') : t('groupAll', { n: ms.length }));
  else if (selMs.length) meta = esc(t('groupSome', { k: selMs.length, n: ms.length, list: selMs.map(mShort).join(', ') }));
  else {
    const late = tm.filter(m => states[m].state === 'target');
    if (late.length) {
      const d = late.some(m => states[m].never) ? t('neverShort') : t('daysAgo', { n: Math.floor(Math.max(...late.map(m => states[m].days))) });
      const what = late.length === tm.length ? low(t('toTarget')) : late.map(m => low(mName(m))).join(', ') + ' ' + low(t('toTarget'));
      meta = `${esc(t('groupNone', { n: ms.length }))} · <span class="amb">${esc(what)} · ${esc(d)}</span>`;
    } else meta = esc(t('groupNone', { n: ms.length }));
  }
  const ordered = [...ms.filter(isTracked), ...ms.filter(m => !isTracked(m))];
  const last = {};
  for (const s of state.sessions) { const ts = new Date(s.datetime).getTime(); for (const m of s.muscles) if (!last[m] || ts > last[m]) last[m] = ts; }
  const rows = !open ? '' : ordered.map(m => {
    const st = states[m], on = draft.sel.has(m), tr = isTracked(m);
    const cls = !tr ? '' : st.state === 'recover' ? 'rec' : st.state === 'target' ? 'tgt' : '';
    const stTxt = !tr ? t('notTracked') : rel(st, last[m]);
    return `<button class="mrow${tr ? '' : ' off'}" data-act="tm" data-m="${m}" aria-pressed="${on}"><span class="box sm${on ? ' on' : ''}">${on ? I.check : ''}</span><span class="mtxt"><b>${esc(mName(m))}</b><span>${esc(L(MUSCLES[m], 'sci'))}</span></span><span class="mst ${cls}">${esc(stTxt)}</span></button>`;
  }).join('');
  const boxHtml = `<span class="box${box === 'on' ? ' on' : box === 'mid' ? ' mid' : ''}">${box === 'on' ? I.check.replace('width="14" height="14"', 'width="16" height="16"') : ''}</span>`;
  return `<div class="gcard"><div class="grow">
    <button class="gbox" data-act="tg" data-g="${g}" aria-pressed="${box === 'on' ? 'true' : box === 'mid' ? 'mixed' : 'false'}" aria-label="${esc(t('wholeGroup', { g: gName(g) }))}">${boxHtml}</button>
    <button class="gtxt" data-act="exp" data-g="${g}" aria-expanded="${open}"><b>${esc(gName(g))}</b><span>${meta}</span></button>
    <button class="iconbtn" data-act="exp" data-g="${g}" aria-expanded="${open}" aria-label="${esc(t(open ? 'collapse' : 'expand', { g: gName(g) }))}" style="color:var(--chev)">${open ? I.up : I.down}</button>
  </div>${rows}</div>`;
}
function workoutHTML() {
  const states = allStates(), p = pal();
  const nm = draft.sel.size, ng = new Set([...draft.sel].map(m => GROUP_OF[m])).size;
  const byGroup = state.settings.entry !== 'muscles';
  const count = nm ? `<b>${esc(nm === 1 ? t('counter1m') : t('counterM', { n: nm }))}</b> · ${esc(ng === 1 ? t('counter1g') : t('counterG', { n: ng }))}` : esc(t(byGroup ? 'counterNoneG' : 'counterNone'));
  const nTargetGroups = Object.keys(GROUPS).filter(g => trackedMuscles(g).some(m => states[m].state === 'target')).length;
  const chip = (v, label, extra = '') => `<button class="chip${extra}" data-act="filter" data-v="${v}" aria-pressed="${draft.filter === v}">${esc(label)}</button>`;
  const chips = chip('all', t('filterAll')) + (nTargetGroups ? chip('target', t('filterTarget', { n: nTargetGroups }), ' tgt') : '') + FAMILIES.map(f => chip(f.id, fName(f.id))).join('');
  let groupsHtml = '';
  for (const f of FAMILIES) {
    let gs = f.groups;
    if (draft.filter === 'target') gs = gs.filter(g => trackedMuscles(g).some(m => states[m].state === 'target'));
    else if (draft.filter !== 'all' && draft.filter !== f.id) gs = [];
    if (!gs.length) continue;
    groupsHtml += `<div class="sect" style="padding:6px 4px 0">${esc(fName(f.id))}</div>` + gs.map(g => wGroup(g, states)).join('');
  }
  const fill = m => draft.sel.has(m) ? p.sel : isTracked(m) ? p.dim : p.off;
  return `<div class="ohdr"><button class="iconbtn" data-act="closeov" aria-label="${esc(t('close'))}">${I.x}</button><h1>${esc(draft.id ? t('editWorkout') : t('newWorkout'))}</h1><span></span></div>
    <div class="scroll"><div class="olist">
      <div class="when"><label>${I.cal}<span class="sr">${esc(t('when'))}</span><input type="datetime-local" id="dt" value="${esc(draft.datetime)}"></label></div>
      <div class="selbody"><div data-bodyact="toggle">${bodyPair(fill, p, { interactive: true, label: t(byGroup ? 'counterNoneG' : 'counterNone') })}</div>
        <button class="detailtgl" role="switch" aria-checked="${!byGroup}" data-act="tapmode" data-v="${byGroup ? 'muscles' : 'groups'}"><span>${esc(t('tapDetail'))}</span><span class="switch" aria-hidden="true" aria-checked="${!byGroup}"><i></i></span></button>
        <div class="count">${count}</div></div>
      <div class="chips" role="group">${chips}</div>
      <div class="glist">${groupsHtml}</div>
      ${draft.id ? `<div style="padding:18px 16px 0"><button class="btn danger" data-act="delete">${esc(t('delete'))}</button></div>` : ''}
    </div></div>
    <div class="ofoot"><div class="in"><button class="btn" data-act="saveworkout">${I.check.replace('width="14" height="14"', 'width="20" height="20"')}${esc(draft.id ? t('saveEdit') : t('save'))}</button></div></div>`;
}

/* ---------- plein écran : muscles suivis, accueil, article ---------- */
function trackList() {
  return FAMILIES.map(f => `<div class="sect" style="padding:14px 4px 6px">${esc(fName(f.id))}</div>` + f.groups.map(g => {
    const ms = GROUPS[g].muscles, allOn = ms.every(isTracked);
    return `<div class="gcard" style="margin-bottom:8px"><div class="srow" style="min-height:56px"><span class="tmain"><b style="font-size:17px">${esc(gName(g))}</b><span>${ms.filter(isTracked).length} / ${ms.length}</span></span><button class="switch" role="switch" aria-checked="${allOn}" aria-label="${esc(t('trackGroup', { g: gName(g) }))}" data-act="trackg" data-g="${g}"><i></i></button></div>`
      + (ms.length > 1 ? ms.map(m => `<div class="srow" style="min-height:52px;padding-left:28px;background:var(--sunken)"><span class="tmain"><b style="font-size:15px;font-weight:600">${esc(mName(m))}</b><span>${esc(L(MUSCLES[m], 'sci'))}</span></span><button class="switch sm" role="switch" aria-checked="${isTracked(m)}" aria-label="${esc(t('track'))} : ${esc(mName(m))}" data-act="track" data-m="${m}"><i></i></button></div>`).join('') : '')
      + '</div>';
  }).join('')).join('');
}
function trackedHTML() {
  return `<div class="ohdr"><button class="iconbtn" data-act="closeov" aria-label="${esc(t('back'))}">${I.back}</button><h1>${esc(t('trackedTitle'))}</h1><span></span></div>
    <div class="scroll"><div class="olist" style="padding:8px 16px 30px"><p class="note" style="font-size:14px">${esc(t('trackedIntro'))}</p>${trackList()}</div></div>`;
}
function onbHTML() {
  const step = ui.onbStep || 1, p = pal(), total = ui.onbTotal || 3;
  const head = `<div class="ohdr"><span></span><h1>MUSCLE<span style="color:var(--accent)">MAP</span></h1>${step < 3 ? `<button class="iconbtn" style="width:auto;padding:0 6px;font-size:14px;font-weight:600;color:var(--muted)" data-act="onbdone">${esc(t('skip'))}</button>` : '<span></span>'}</div>`;
  const num = n => `<div class="step">${esc(t('step', { n, t: total }))}</div>`;
  let body;
  if (step === 1) {
    const demo = { pec_haut: 1, pec_mil: 1, delt_ant: 1, tri_lat: 1, tri_long: 1, tri_med: 1, quad_ext: 2, quad_droit: 2, quad_int: 2, dorsal: 3, gastro: 3, soleaire: 3, ischio_bf: 3, ischio_st: 3 };
    const fill = m => demo[m] === 1 ? heatColor(p, .75) : demo[m] === 2 ? heatColor(p, .35) : demo[m] === 3 ? p.target : p.steel;
    body = `${num(1)}<h2 class="h1">${esc(t('onbWelcomeTitle'))}</h2><div class="hero">${bodyPair(fill, p, { label: t('onbWelcomeTitle') })}</div><p>${esc(t('onbWelcomeText'))}</p>`;
  } else if (step === 2) {
    body = `${num(2)}<h2 class="h1">${esc(t('onbTrackTitle'))}</h2><p>${esc(t('onbTrackText'))}</p><div>${trackList()}</div>`;
  } else if (step === 3) {
    body = `${num(3)}<h2 class="h1">${esc(t('onbHowTitle'))}</h2><p>${esc(t('onbHowText'))}</p>
      <div class="card how" style="padding:16px"><div><i class="sw rec"></i><span><b>${esc(t('stRecover'))}</b><br>${esc(t('onbRec'))}</span></div><div><i class="sw ready"></i><span><b>${esc(t('stReady'))}</b><br>${esc(t('onbReady'))}</span></div><div><i class="sw tgt"></i><span><b>${esc(t('stTarget'))}</b><br>${esc(t('onbTarget'))}</span></div></div>`;
  } else {
    body = `${num(4)}<div class="ihero"><img src="icon-192.png" alt="" width="88" height="88"></div><h2 class="h1">${tx('instTitle')}</h2><p>${tx('instWhy')}</p>${guideHTML(ui.instTab)}`;
  }
  const foot = step < total
    ? `<button class="btn" data-act="onbnext">${esc(t('next'))}</button>`
    : step === 4
      ? `<button class="btn" data-act="onbinst">${esc(t('instDone'))}</button><button class="btn ghost" data-act="onbdone">${esc(t('instLater'))}</button><p class="note" style="text-align:center">${tx('instLaterHelp')}</p>`
      : `<button class="btn" data-act="onbdone">${esc(t('start'))}</button>`;
  return `${head}<div class="scroll"><div class="onb">${body}</div></div>
    <div class="ofoot"><div class="in">${foot}</div></div>`;
}
function installHTML() {
  return `<div class="ohdr"><button class="iconbtn" data-act="closeov" aria-label="${esc(t('back'))}">${I.back}</button><h1>${esc(t('instShort'))}</h1><span></span></div>
    <div class="scroll"><div class="onb" style="padding-top:12px"><div class="ihero"><img src="icon-192.png" alt="" width="88" height="88"></div><h2 class="h1">${tx('instTitle')}</h2><p>${tx('instWhy')}</p>${guideHTML(ui.instTab)}</div></div>`;
}
function articleHTML(a) {
  const one = n => `<div class="eyebrow">${esc(t('art' + n + 'Eyebrow'))}</div><h2>${esc(t('art' + n + 'Title'))}</h2><div class="bodytxt">${t('art' + n + 'Body')}</div>`;
  const studies = `<hr><div class="eyebrow">${esc(t('studies'))}</div><ul class="studies" style="margin-top:10px;font-size:14px">${STUDIES.map(x => `<li><a href="${x.url}" target="_blank" rel="noopener">${esc(x.ref)}</a> — ${esc(x[lang()])}</li>`).join('')}</ul>`;
  const content = a === 'all' ? [1, 2, 3].map(one).join('<hr>') + studies : one(+a) + (a === '3' ? studies : '');
  return `<div class="ohdr"><button class="iconbtn" data-act="closeov" aria-label="${esc(t('back'))}">${I.back}</button><h1>${esc(a === 'all' ? t('method') : '')}</h1><span></span></div>
    <div class="scroll"><article class="article">${content}</article></div>`;
}
function renderOverlay() {
  const o = $('#overlay');
  if (!ui.overlay) { o.innerHTML = ''; if (!ui.sheet) document.body.classList.remove('locked'); return; }
  const prev = o.querySelector('.scroll'), y = prev ? prev.scrollTop : 0;
  const html = ui.overlay === 'workout' ? workoutHTML() : ui.overlay === 'tracked' ? trackedHTML() : ui.overlay === 'onb' ? onbHTML() : ui.overlay === 'install' ? installHTML() : articleHTML(ui.article);
  o.innerHTML = `<div class="overlay" role="dialog" aria-modal="true">${html}</div>`;
  const nx = o.querySelector('.scroll'); if (nx) nx.scrollTop = y;
}
function closeOverlay() { ui.overlay = null; draft = null; renderOverlay(); render(); }

/* ---------- connexion ---------- */
function showGate(reason) {
  ui.unlocked = false;
  $('#app').hidden = true; closeSheet(); ui.overlay = null; renderOverlay();
  const p = pal();
  const msg = { expired: t('gateExpired'), failed: t('gateFailed'), loggedOut: t('gateLoggedOut'), scope: t('gateScope'), cancelled: t('gateCancelled') }[reason] || '';
  const last = lastProvider();
  const list = providers().sort((a, b) => (b.id === last) - (a.id === last) || (a.id === 'google' ? -1 : 1));
  const btns = list.map(pv => `<button class="btn sso" data-act="login" data-p="${pv.id}">${I[pv.id === 'google' ? 'google' : 'microsoft']}<span>${esc(t('gateWith', { a: pv.account }))}</span></button>`).join('');
  const g = $('#gate');
  g.innerHTML = `<div class="wordmark">MUSCLE<span>MAP</span></div><div class="tag">${esc(t('appTagline'))}</div>
    <div class="gbody">${bodyPair(m => ({ pec_haut: 1, pec_mil: 1, dorsal: 2, gastro: 2 }[m] === 1 ? heatColor(p, .7) : { dorsal: 1, gastro: 1 }[m] ? p.target : p.steel), p, { label: 'MuscleMap' })}</div>
    <p>${esc(t(list.length > 1 ? 'gateText2' : 'gateText'))}</p><div class="ssos">${btns}</div><p class="err" role="alert">${esc(msg)}</p>`;
  g.hidden = false;
}
function unlock() {
  ui.unlocked = true;
  $('#gate').hidden = true; $('#app').hidden = false;
  render();
}

/* ---------- toast ---------- */
let toastTimer = null;
function toast(msg, action, fn) {
  const el = $('#toast');
  el.innerHTML = `<div class="toast"><span>${esc(msg)}</span>${action ? `<button data-act="toastaction">${esc(action)}</button>` : ''}</div>`;
  toast.fn = fn || null;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.innerHTML = ''; toast.fn = null; }, 4500);
}

/* ---------- actions ---------- */
function toggleTrack(ms, on) {
  const ex = new Set(state.settings.excluded);
  ms.forEach(m => on ? ex.delete(m) : ex.add(m));
  updateSettings({ excluded: [...ex] });
}
function exportData() {
  const blob = new Blob([serialize()], { type: 'application/json' });
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = 'musclemap-data.json'; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function importFile(file) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const inc = parseData(r.result);
      if (!inc.sessions.length && !inc.tombstones.length) { alert(t('importNone')); return; }
      mergeInto(inc); save(); render();
      alert(t('importDone', { n: inc.sessions.length }));
    } catch (e) { alert(t('importBad', { e: e.message })); }
  };
  r.readAsText(file);
}

document.addEventListener('click', e => {
  const tapBody = e.target.closest('[data-bodyact] [data-m]');
  if (tapBody) {
    const m = tapBody.dataset.m, mode = tapBody.closest('[data-bodyact]').dataset.bodyact;
    if (mode === 'sheet') openSheet(GROUP_OF[m]);
    else if (mode === 'toggle' && draft) {
      const g = GROUP_OF[m];
      if (state.settings.entry !== 'muscles' && g) toggleGroup(g);
      else draft.sel.has(m) ? draft.sel.delete(m) : draft.sel.add(m);
      renderOverlay();
    }
    return;
  }
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const a = el.dataset.act, d = el.dataset;
  switch (a) {
    case 'tab': ui.tab = d.tab; ui.showAll = false; window.scrollTo(0, 0); render(); break;
    case 'workout': openWorkout(null); break;
    case 'workout-with': openWorkout(null, d.ms.split(',')); break;
    case 'edit': { const s = state.sessions.find(x => x.id === d.id); if (s) openWorkout(s); break; }
    case 'sheet': openSheet(d.g); break;
    case 'closesheet': closeSheet(); break;
    case 'showall': ui.showAll = !ui.showAll; render(); break;
    case 'syncnow': syncNow(); break;
    case 'login': if (d.p) login(d.p); else showGate(''); break;
    case 'reconnect': reconnect(); break;
    case 'logout': logout(); break;
    case 'export': exportData(); break;
    case 'import': $('#importInput').click(); break;
    case 'lang': updateSettings({ lang: d.v }); setLang(d.v); render(); break;
    case 'theme': updateSettings({ theme: d.v }); applyTheme(); render(); break;
    case 'entry': updateSettings({ entry: d.v }); render(); break;
    case 'step': { const k = d.k, dir = +d.d; if (!canStep(k, dir)) break; const v = state.settings[k] + dir * LIMITS[k][2]; const patch = { [k]: v };
      if (k !== 'targetDays') { const need = Math.floor(Math.max(v, k === 'recSmall' ? state.settings.recBig : state.settings.recSmall) / 24) + 1; if (state.settings.targetDays < need) patch.targetDays = need; }
      updateSettings(patch); render(); break; }
    case 'reset': updateSettings({ ...DEFAULTS }); render(); break;
    case 'tracked': ui.overlay = 'tracked'; document.body.classList.add('locked'); renderOverlay(); break;
    case 'article': ui.overlay = 'article'; ui.article = d.a; document.body.classList.add('locked'); renderOverlay(); break;
    case 'closeov': closeOverlay(); break;
    case 'track': toggleTrack([d.m], el.getAttribute('aria-checked') !== 'true'); if (ui.overlay) renderOverlay(); if (ui.sheet) renderSheet(); render(); break;
    case 'trackg': toggleTrack(GROUPS[d.g].muscles, el.getAttribute('aria-checked') !== 'true'); renderOverlay(); render(); break;
    case 'onbnext': { ui.onbStep = (ui.onbStep || 1) + 1; renderOverlay(); const sc = $('#overlay .scroll'); if (sc) sc.scrollTop = 0; break; }
    case 'onbinst': stopReminders(); // puis comme « onbdone »
    // falls through
    case 'onbdone': startReminders(); updateSettings({ onboarded: true }); ui.onbStep = 1; ui.instTab = null; closeOverlay(); break;
    /* installation sur l'écran d'accueil */
    case 'insttab': ui.instTab = d.v; renderOverlay(); break;
    case 'instopen': if (d.from === 'card') markSeen(); ui.instTab = null; ui.overlay = 'install'; document.body.classList.add('locked'); renderOverlay(); render(); break;
    case 'instx': markSeen(); render(); break;
    case 'instalready': stopReminders(); render(); break;
    case 'instnow': promptInstall().then(ok => {
      if (!ok) { renderOverlay(); return; }
      if (ui.overlay === 'onb') { updateSettings({ onboarded: true }); ui.onbStep = 1; }
      ui.instTab = null; closeOverlay(); toast(t('instThanks'));
    }); break;
    case 'instcopy': (navigator.clipboard ? navigator.clipboard.writeText(appUrl()) : Promise.reject()).then(() => toast(t('instCopied')), () => toast(appUrl())); break;
    case 'filter': draft.filter = d.v; renderOverlay(); break;
    case 'exp': draft.expanded.has(d.g) ? draft.expanded.delete(d.g) : draft.expanded.add(d.g); renderOverlay(); break;
    case 'tm': draft.sel.has(d.m) ? draft.sel.delete(d.m) : draft.sel.add(d.m); renderOverlay(); break;
    case 'tg': toggleGroup(d.g); renderOverlay(); break;
    case 'tapmode': if (state.settings.entry !== d.v) { updateSettings({ entry: d.v }); draft.expanded = expandedFor(draft.sel); renderOverlay(); render(); } break;
    case 'saveworkout': {
      const v = $('#dt') ? $('#dt').value : draft.datetime;
      if (!draft.sel.size) { toast(t('pickOne')); break; }
      const dt = v ? new Date(v) : new Date();
      const keepUnknown = draft.original ? draft.original.muscles.filter(m => !MUSCLES[m]) : [];
      upsertSession({ id: draft.id || uid(), datetime: (isNaN(dt) ? new Date() : dt).toISOString(), muscles: [...draft.sel, ...keepUnknown] });
      closeOverlay(); toast(t('saved')); break;
    }
    case 'delete': {
      if (!confirm(t('confirmDelete'))) break;
      const removed = deleteSession(draft.id);
      closeOverlay();
      toast(t('deleted'), t('undo'), () => { if (removed) { restoreSession(removed); render(); } });
      break;
    }
    case 'toastaction': if (toast.fn) toast.fn(); $('#toast').innerHTML = ''; break;
  }
});
document.addEventListener('input', e => {
  if (e.target.id === 'q') {
    ui.search = e.target.value;
    const pos = e.target.selectionStart;
    render();
    const q = $('#q'); if (q) { q.focus(); try { q.setSelectionRange(pos, pos); } catch (er) {} }
  }
  if (e.target.id === 'dt' && draft) draft.datetime = e.target.value;
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (ui.sheet) closeSheet(); else if (ui.overlay && ui.overlay !== 'onb') closeOverlay();
});
$('#importInput').addEventListener('change', e => { if (e.target.files[0]) importFile(e.target.files[0]); e.target.value = ''; });
if (mq && mq.addEventListener) mq.addEventListener('change', () => { if (state.settings.theme === 'auto') { applyTheme(); render(); if (ui.overlay) renderOverlay(); } });

/* rafraîchit la carte chaque minute (le rouge pâlit) */
setInterval(() => { if (ui.unlocked && !ui.overlay && !ui.sheet && (ui.tab === 'map' || ui.tab === 'history')) render(); }, 60000);

/* ---------- démarrage ---------- */
function maybeOnboard() {
  if (!ui.unlocked) return;
  if (state.settings.onboarded) {
    // déjà passé par l'onboarding (ou sur un autre appareil) : le calendrier des rappels d'installation part d'aujourd'hui
    startReminders();
    return;
  }
  if (!ui.overlay) { ui.overlay = 'onb'; ui.onbStep = 1; ui.onbTotal = isStandalone() ? 3 : 4; document.body.classList.add('locked'); renderOverlay(); }
}
/* le navigateur propose l'installation en un geste (Android, Chrome/Edge sur ordinateur) : on affiche le bouton */
onInstallChange(() => { if (ui.overlay === 'install' || (ui.overlay === 'onb' && ui.onbStep === 4)) renderOverlay(); if (ui.unlocked) render(); });
load();
setLang(state.settings.lang);
applyTheme();
initSync({
  gate: reason => showGate(reason),
  unlock: () => unlock(),
  status: () => updateSyncUI(),
  idle: () => !ui.overlay && !ui.sheet,
  data: () => { setLang(state.settings.lang); applyTheme(); if (ui.unlocked) { render(); if (ui.overlay && ui.overlay !== 'workout') renderOverlay(); } },
}).then(ok => {
  if (ok) { if (!ui.unlocked) unlock(); maybeOnboard(); }
});

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
