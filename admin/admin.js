/* MuscleMap Admin — tableau de bord réservé à l'administrateur.
   Connexion Microsoft par Supabase ; les données viennent uniquement des fonctions admin_* de la base,
   qui vérifient côté serveur que le compte connecté est administrateur (private.admins).
   Par compte : identité, dates, nombre de séances. Jamais le contenu des séances d'une personne. */
import { AuthClient } from '../js/vendor/supabase-auth.js';
import { MUSCLES } from '../js/data.js';

const SB = {
  url: 'https://bruthjsnwwbhqfowberc.supabase.co',
  key: 'sb_publishable_NCduKQKzBzS_yeaWXY8LBg__APFrYJL',
};
const VERSION = '1.0.1';   // version de MuscleMap Admin (même règle que l'app : accord de Fabien avant de changer le 1er ou le 2e niveau)
const UMAMI = 'https://cloud.umami.is/';
const here = () => location.origin + location.pathname.replace(/index\.html$/, '');

const auth = new AuthClient({
  url: SB.url + '/auth/v1', headers: { apikey: SB.key }, storageKey: 'musclemap-admin.sb',
  autoRefreshToken: true, persistSession: true, detectSessionInUrl: false, flowType: 'pkce',
});

const $view = document.getElementById('view');
const $actions = document.getElementById('actions');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf = n => Number(n || 0).toLocaleString('fr-FR');
let data = null;
// Réglage de l'admin (sur cet appareil) : compter ou non son propre compte dans les statistiques (non par défaut)
const SELF_KEY = 'musclemap-admin.includeSelf';
const includeSelf = () => { try { return localStorage.getItem(SELF_KEY) === '1'; } catch (e) { return false; } };
function setIncludeSelf(on) { try { on ? localStorage.setItem(SELF_KEY, '1') : localStorage.removeItem(SELF_KEY); } catch (e) {} }

/* ---------- appels à la base ---------- */
async function token() {
  const { data: d } = await auth.getSession();
  return d && d.session ? d.session.access_token : null;
}
async function rpc(name, body) {
  const tok = await token();
  if (!tok) throw Object.assign(new Error('auth'), { auth: true });
  const r = await fetch(`${SB.url}/rest/v1/rpc/${name}`, {
    method: 'POST', cache: 'no-store',
    headers: { apikey: SB.key, Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body || {}),
  });
  if (r.status === 401) throw Object.assign(new Error('auth'), { auth: true });
  if (r.status === 403) throw Object.assign(new Error('forbidden'), { forbidden: true });
  if (!r.ok) {
    let msg = ''; try { msg = (await r.json()).message || ''; } catch (e) {}
    if (/forbidden/.test(msg)) throw Object.assign(new Error('forbidden'), { forbidden: true });
    throw new Error(msg || 'HTTP ' + r.status);
  }
  const txt = await r.text();
  return txt ? JSON.parse(txt) : null;
}

/* ---------- formats ---------- */
const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtWeek = d => new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
function ago(d) {
  if (!d) return 'jamais';
  const m = Math.round((Date.now() - new Date(d)) / 60000);
  if (m < 2) return 'à l’instant';
  if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60); if (h < 24) return `il y a ${h} h`;
  const j = Math.round(h / 24); if (j < 31) return `il y a ${j} j`;
  return fmtDate(d);
}
const muscleName = id => (MUSCLES[id] && MUSCLES[id].fr && MUSCLES[id].fr.name) || id;
const pct = (n, t) => t ? Math.round(100 * n / t) + ' %' : '—';

/* ---------- graphiques ---------- */
// Barres verticales sur 12 semaines (une seule série : pas de légende, le titre la nomme)
function weekChart(id, weeks, key, unit) {
  const W = 340, H = 130, padL = 4, padB = 22, padT = 18, n = weeks.length;
  const max = Math.max(1, ...weeks.map(w => w[key]));
  const slot = (W - padL * 2) / n, bw = Math.max(6, slot - 6);
  const last = weeks[n - 1];
  let bars = '';
  weeks.forEach((w, i) => {
    const v = w[key], h = Math.round((H - padB - padT) * v / max), x = padL + i * slot + (slot - bw) / 2, y = H - padB - h;
    const r = Math.min(4, bw / 2, h);
    // barre ancrée à la ligne de base, extrémité arrondie (4 px)
    const path = h > 0
      ? `M${x},${H - padB} V${y + r} Q${x},${y} ${x + r},${y} H${x + bw - r} Q${x + bw},${y} ${x + bw},${y + r} V${H - padB} Z`
      : `M${x},${H - padB - 1} h${bw} v1 h-${bw} Z`;
    bars += `<g data-chart="${id}" data-i="${i}"><rect class="hit" x="${padL + i * slot}" y="0" width="${slot}" height="${H}"/><path class="bar${v ? '' : ' zero'}" d="${path}"/></g>`;
    if (i % 3 === 2 || i === n - 1) bars += `<text x="${x + bw / 2}" y="${H - 6}" text-anchor="middle">${esc(fmtWeek(w.week))}</text>`;
  });
  const lx = padL + (n - 1) * slot + slot / 2, ly = H - padB - Math.round((H - padB - padT) * last[key] / max) - 5;
  bars += `<text class="val" x="${lx}" y="${ly}" text-anchor="middle">${nf(last[key])}</text>`;
  const svg = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(unit)} par semaine, 12 dernières semaines">
    <line x1="0" y1="${H - padB + .5}" x2="${W}" y2="${H - padB + .5}"/>${bars}</svg>`;
  charts[id] = { weeks, key, unit };
  return svg + `<div class="cap" id="cap-${id}">Semaine du ${esc(fmtWeek(last.week))} : ${nf(last[key])} ${esc(unit)}</div>`;
}
const charts = {};
function showBar(id, i) {
  const c = charts[id]; if (!c) return;
  const w = c.weeks[i];
  document.querySelectorAll(`[data-chart="${id}"] .bar`).forEach((b, j) => b.classList.toggle('on', j === +i));
  const cap = document.getElementById('cap-' + id);
  if (cap) cap.textContent = `Semaine du ${fmtWeek(w.week)} : ${nf(w[c.key])} ${c.unit}`;
}

// Barres horizontales : muscles les plus logués (part des séances qui contiennent le muscle)
function muscleBars(list, totalSessions) {
  const top = list.slice(0, 12);
  if (!top.length) return '<p class="muted">Pas encore de séance.</p>';
  const max = top[0].n;
  return `<div class="hbars">${top.map(m => `<div class="hb" title="${esc(muscleName(m.id))} : ${nf(m.n)} séances">
      <span class="lbl">${esc(muscleName(m.id))}</span><i style="width:${Math.max(1, 100 * m.n / max)}%"></i><span class="n">${pct(m.n, totalSessions)}</span></div>`).join('')}</div>
    <p class="note">Part des séances (tous comptes confondus) dans lesquelles chaque muscle a été logué.</p>`;
}

/* ---------- écrans ---------- */
function gate(msg, err) {
  $actions.hidden = true;
  $view.innerHTML = `<div class="gate">
    <p>${esc(msg || 'Espace réservé à l’administrateur de MuscleMap.')}</p>
    ${err ? `<p class="err">${esc(err)}</p>` : ''}
    <button class="btn primary" data-act="login">Se connecter avec Microsoft</button>
    <p class="note" style="margin-top:28px">MuscleMap Admin v${VERSION}</p>
  </div>`;
}
function forbidden(email) {
  $actions.hidden = false;
  $view.innerHTML = `<div class="gate"><p><b>Accès réservé.</b><br>Le compte ${esc(email || '')} n’est pas administrateur de MuscleMap.</p>
    <button class="btn" data-act="logout">Se déconnecter</button></div>`;
}

function render() {
  const o = data.overview, users = data.users;
  const a = o.accounts, s = o.sessions, act = o.active, st = o.settings, wk = o.weeks || [];
  const thisWeek = wk[wk.length - 1] || { sessions: 0, loggers: 0 };
  const lang = st.lang || {}, theme = st.theme || {};
  const langTxt = ['fr', 'en', 'auto'].filter(k => lang[k]).map(k => `${{ fr: 'français', en: 'anglais', auto: 'auto' }[k]} ${nf(lang[k])}`).join(' · ') || '—';
  const themeTxt = ['auto', 'dark', 'light'].filter(k => theme[k]).map(k => `${{ auto: 'auto', dark: 'sombre', light: 'clair' }[k]} ${nf(theme[k])}`).join(' · ') || '—';
  $actions.hidden = false;
  $view.innerHTML = `
    <p class="note" style="margin-top:12px">${includeSelf() ? 'Statistiques avec ton compte.' : 'Statistiques sans ton compte.'} Réglage en bas de page.</p>
    <div class="tiles" style="margin-top:8px">
      <div class="tile"><b>${nf(a.total)}</b><span>comptes</span></div>
      <div class="tile"><b>${nf(act.week)}</b><span>actifs sur 7 jours</span></div>
      <div class="tile"><b>${nf(s.last7)}</b><span>séances sur 7 jours</span></div>
      <div class="tile"><b>${nf(act.day)}</b><span>actifs aujourd’hui</span></div>
    </div>

    <h2>Comptes</h2>
    <div class="card"><dl class="kv">
      <dt>Google</dt><dd>${nf(a.google)}</dd>
      <dt>Microsoft</dt><dd>${nf(a.microsoft)}</dd>
      <dt>Repris de l’ancien système (OneDrive / Google Drive)</dt><dd>${nf(a.migrated)}</dd>
      <dt>Sans aucune séance</dt><dd>${nf(a.empty)}</dd>
    </dl></div>
    <div class="card"><b>Nouveaux comptes par semaine</b>${weekChart('new', wk, 'new_accounts', 'nouveaux comptes')}</div>

    <h2>Utilisateurs actifs</h2>
    <div class="card"><dl class="kv">
      <dt>Ont ouvert l’app depuis 24 h</dt><dd>${nf(act.day)}</dd>
      <dt>Depuis 7 jours</dt><dd>${nf(act.week)}</dd>
      <dt>Depuis 30 jours</dt><dd>${nf(act.month)}</dd>
    </dl><p class="note">Ouverture = dernière synchronisation du compte, connecté à internet.</p></div>
    <div class="card"><b>Personnes ayant logué au moins une séance</b>${weekChart('loggers', wk, 'loggers', 'personnes')}</div>

    <h2>Séances</h2>
    <div class="card"><dl class="kv">
      <dt>Total</dt><dd>${nf(s.total)}</dd>
      <dt>Sur 7 jours</dt><dd>${nf(s.last7)}</dd>
      <dt>Sur 30 jours</dt><dd>${nf(s.last30)}</dd>
      <dt>Moyenne cette semaine, par personne active</dt><dd>${thisWeek.loggers ? (thisWeek.sessions / thisWeek.loggers).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) : '—'}</dd>
    </dl></div>
    <div class="card"><b>Séances par semaine</b>${weekChart('sessions', wk, 'sessions', 'séances')}</div>

    <h2>Usage de l’app</h2>
    <div class="card"><b>Muscles les plus logués</b>${muscleBars(o.muscles || [], s.total)}</div>
    <div class="card"><dl class="kv">
      <dt>Langue</dt><dd>${esc(langTxt)}</dd>
      <dt>Thème</dt><dd>${esc(themeTxt)}</dd>
      <dt>Sélection détaillée muscle par muscle</dt><dd>${nf(st.detailed)} / ${nf(st.accounts)}</dd>
      <dt>Durées de récup modifiées</dt><dd>${nf(st.custom_thresholds)} / ${nf(st.accounts)}</dd>
      <dt>Muscles exclus du suivi</dt><dd>${nf(st.excluded)} / ${nf(st.accounts)}</dd>
      <dt>Statistiques anonymes coupées</dt><dd>${nf(st.stats_off)} / ${nf(st.accounts)}</dd>
    </dl><p class="note">Appareils, installations et provenance (Instagram…) : <a href="${UMAMI}" target="_blank" rel="noopener">statistiques Umami</a>.</p></div>

    <h2>Comptes · ${nf(users.length)}</h2>
    ${users.map(u => `<div class="card user">
      <div class="who"><b>${esc(u.name || u.email || 'Sans nom')}</b><span>${esc(u.email || '')}</span></div>
      ${u.is_admin ? '<span class="badge amber">Admin</span>' : `<button class="del" data-act="del" data-id="${esc(u.id)}">Supprimer</button>`}
      <div class="meta">
        <span>${u.provider === 'azure' ? 'Microsoft' : u.provider === 'google' ? 'Google' : esc(u.provider || '—')}</span>
        <span>inscrit le ${esc(fmtDate(u.created_at))}</span>
        <span>ouverture ${esc(ago(u.last_open))}</span>
        <span>${nf(u.sessions)} séance${u.sessions > 1 ? 's' : ''}</span>
        ${u.migrated ? '<span class="badge">repris</span>' : ''}
      </div>
    </div>`).join('')}
    <h2>Réglages</h2>
    <div class="card">
      <button class="sw" role="switch" aria-checked="${includeSelf()}" data-act="self">
        <span>Inclure mon compte dans les statistiques<br><span class="note" style="margin:0">La liste des comptes le montre toujours.</span></span><span class="k"></span>
      </button>
    </div>
    <p class="note center" style="margin-top:14px">Mis à jour ${esc(new Date(o.generated_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }))}</p>
    <button class="out" data-act="logout">Se déconnecter</button>
    <p class="note center" style="margin-top:14px">MuscleMap Admin v${VERSION}</p>`;
}

/* ---------- chargement ---------- */
async function load() {
  try {
    const { data: d } = await auth.getSession();
    if (!d || !d.session) { gate(); return; }
    const ok = await rpc('admin_check');
    if (!ok) { forbidden(d.session.user.email); return; }
    const [overview, users] = await Promise.all([rpc('admin_overview', { p_exclude_admins: !includeSelf() }), rpc('admin_users')]);
    data = { overview, users: users || [] };
    render();
  } catch (e) {
    if (e.auth) { gate('Session expirée : reconnecte-toi.'); return; }
    if (e.forbidden) { forbidden(''); return; }
    $actions.hidden = false;
    $view.innerHTML = `<div class="gate"><p class="err">Impossible de charger les données${navigator.onLine === false ? ' (hors ligne)' : ''}.</p>
      <button class="btn" data-act="refresh">Réessayer</button></div>`;
  }
}

function tip(msg) {
  const t = document.getElementById('tip');
  t.textContent = msg; t.hidden = false;
  clearTimeout(tip.t); tip.t = setTimeout(() => { t.hidden = true; }, 3000);
}

document.addEventListener('click', async e => {
  const g = e.target.closest('[data-chart]');
  if (g) { showBar(g.dataset.chart, g.dataset.i); return; }
  const b = e.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act;
  if (act === 'login') {
    b.disabled = true;
    const { error } = await auth.signInWithOAuth({ provider: 'azure', options: { redirectTo: here(), scopes: 'openid email profile' } });
    if (error) { b.disabled = false; gate('', 'Connexion impossible, réessaie.'); }
  } else if (act === 'logout') {
    try { await auth.signOut({ scope: 'local' }); } catch (err) {}
    gate('Déconnecté.');
  } else if (act === 'self') {
    setIncludeSelf(!includeSelf());
    b.setAttribute('aria-checked', String(includeSelf()));
    load();
  } else if (act === 'refresh') {
    $view.innerHTML = '<p class="muted center">Chargement…</p>';
    load();
  } else if (act === 'del') {
    const u = (data && data.users || []).find(x => x.id === b.dataset.id); if (!u) return;
    if (!confirm(`Supprimer définitivement le compte ${u.email || u.name} et ses ${u.sessions} séance(s) enregistrée(s) en ligne ?\n\nLes séances restent seulement sur ses appareils.`)) return;
    b.disabled = true;
    try { await rpc('admin_delete_user', { p_id: u.id }); tip('Compte supprimé.'); load(); }
    catch (err) { b.disabled = false; tip('Suppression impossible.'); }
  }
});
document.addEventListener('mouseover', e => { const g = e.target.closest('[data-chart]'); if (g) showBar(g.dataset.chart, g.dataset.i); });

/* Retour de Microsoft (?code=… ou ?error=…) */
(async () => {
  const u = new URL(location.href);
  const code = u.searchParams.get('code'), err = u.searchParams.get('error');
  if (code || err) {
    history.replaceState({}, '', here());
    if (err) { gate('', err === 'access_denied' ? 'Connexion annulée.' : 'Connexion impossible, réessaie.'); return; }
    const { error } = await auth.exchangeCodeForSession(code);
    if (error) { gate('', 'Connexion impossible, réessaie.'); return; }
  }
  load();
})();

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js', { scope: './' }).catch(() => {});
}
