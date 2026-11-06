/* MuscleMap — synchro (OneDrive ou Google Drive) et verrou de connexion.
   100 % côté navigateur, sans serveur : les séances sont dans un fichier rangé
   dans l'espace de la personne, que MuscleMap ne voit jamais.

   • OneDrive (Microsoft Graph) — OAuth2 + PKCE. Dossier /Apps/MuscleMap.
     App enregistrée sur https://entra.microsoft.com (« Personal Microsoft accounts
     only », Redirect URI de type SPA = https://flepr.github.io/musclemap/).
     Microsoft limite à 24 h la durée de connexion des apps « SPA » : au-delà, l'app
     tente une reconnexion silencieuse tant que la session Microsoft est ouverte.

   • Google Drive — dossier caché de l'app (« appDataFolder », autorisation
     drive.appdata : l'app ne voit que son propre fichier, la personne ne le voit
     pas dans son Drive). Client OAuth « Application Web » sur
     https://console.cloud.google.com (origine https://flepr.github.io, redirection
     https://flepr.github.io/musclemap/). Sans serveur, Google ne donne qu'un jeton
     d'une heure, sans renouvellement : l'app se reconnecte en silence (aller-retour
     rapide chez Google) à l'ouverture ou au retour dans l'app ; en cours d'usage,
     la pastille propose « Reconnecter ». Les séances restent sur l'appareil en attendant. */
import { parseData, serialize, mergeInto, saveSilently, onSave } from './store.js';

const FILE = 'musclemap-data.json';
const PROV_KEY = 'musclemap.provider';      // fournisseur de la session en cours
const LAST_KEY = 'musclemap.provider.last'; // dernier utilisé (reste après déconnexion)
const LOCAL_KEY = 'musclemap.local';         // « Utiliser sans compte » choisi sur cet appareil

function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} }
function lsJson(k) { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { return {}; } }
function ssGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
function ssSet(k, v) { try { v == null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v); } catch (e) {} }
const b64url = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const sha256 = s => crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
function randStr(n) { const a = new Uint8Array(n); crypto.getRandomValues(a); return [...a].map(x => ('0' + x.toString(16)).slice(-2)).join(''); }
/* Contenu d'un id_token (JWT) — sert seulement à afficher le compte et à le proposer à la reconnexion */
function jwtClaims(tok) {
  try {
    const p = tok.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent([...atob(p)].map(c => '%' + ('0' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
  } catch (e) { return null; }
}
const authError = msg => Object.assign(new Error(msg), { auth: true });

/* =================== OneDrive =================== */
const MS = {
  clientId: '50051d2a-7bf1-404c-9ffc-62701f17d430',
  authority: 'https://login.microsoftonline.com/consumers',
  scopes: ['Files.ReadWrite.AppFolder', 'offline_access', 'openid', 'profile'],
};
const MS_TOK = 'musclemap.onedrive.v1';
const MS_KNOWN = 'musclemap.onedrive.known';
const GRAPH_CONTENT = 'https://graph.microsoft.com/v1.0/me/drive/special/approot:/' + FILE + ':/content';
const msRedirect = () => location.origin + location.pathname;

const onedrive = {
  id: 'onedrive', name: 'OneDrive', account: 'Microsoft',
  enabled: () => true,
  s: lsJson(MS_TOK),
  save() { try { localStorage.setItem(MS_TOK, JSON.stringify(this.s)); } catch (e) {} },
  connected() { return !!this.s.refresh; },
  known() { return !!lsGet(MS_KNOWN); },
  email() { return this.s.email || ''; },
  async login(silent) {
    const verifier = randStr(48), st = randStr(12);
    ssSet('mm_verifier', verifier); ssSet('mm_state', st); ssSet('mm_pending', 'onedrive');
    const p = new URLSearchParams({
      client_id: MS.clientId, response_type: 'code', redirect_uri: msRedirect(),
      response_mode: 'query', scope: MS.scopes.join(' '),
      code_challenge: b64url(await sha256(verifier)), code_challenge_method: 'S256', state: st,
    });
    if (silent === true) p.set('prompt', 'none');
    location.assign(MS.authority + '/oauth2/v2.0/authorize?' + p.toString());
  },
  /* Retour de Microsoft : ?code=…&state=… (ou ?error=…) */
  isReturn(u) { return u.searchParams.has('code') || (u.searchParams.has('error') && !u.hash.includes('error=')); },
  async handleReturn(u) {
    try { history.replaceState({}, '', msRedirect()); } catch (e) {}
    const err = u.searchParams.get('error');
    if (err) return /^(login_required|interaction_required|consent_required)$/.test(err) ? 'expired' : 'failed';
    if (u.searchParams.get('state') !== ssGet('mm_state')) return 'failed';
    try {
      const body = new URLSearchParams({
        client_id: MS.clientId, grant_type: 'authorization_code', code: u.searchParams.get('code'),
        redirect_uri: msRedirect(), code_verifier: ssGet('mm_verifier') || '', scope: MS.scopes.join(' '),
      });
      const r = await fetch(MS.authority + '/oauth2/v2.0/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
      if (!r.ok) throw new Error('token ' + r.status);
      this.apply(await r.json());
      return null;
    } catch (e) { return 'failed'; }
  },
  apply(j) {
    this.s.access = j.access_token;
    this.s.expires = Date.now() + (j.expires_in || 3600) * 1000;
    if (j.refresh_token) this.s.refresh = j.refresh_token;
    const c = j.id_token && jwtClaims(j.id_token);
    if (c && (c.preferred_username || c.email)) this.s.email = c.preferred_username || c.email;
    this.save();
    lsSet(MS_KNOWN, '1');
  },
  /* Jeton valide ; null si la session a expiré ; erreur si Microsoft est injoignable (on garde la session). */
  async token() {
    if (this.s.access && Date.now() < this.s.expires - 60000) return this.s.access;
    if (!this.s.refresh) return null;
    const body = new URLSearchParams({ client_id: MS.clientId, grant_type: 'refresh_token', refresh_token: this.s.refresh, scope: MS.scopes.join(' ') });
    const r = await fetch(MS.authority + '/oauth2/v2.0/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    if (r.ok) { this.apply(await r.json()); return this.s.access; }
    if (r.status === 400 || r.status === 401) { this.s = {}; this.save(); return null; }
    throw new Error('token ' + r.status);
  },
  /* Les jetons Microsoft se renouvellent seuls : une session perdue est vraiment perdue */
  renewable: false,
  async read(tok) {
    const r = await fetch(GRAPH_CONTENT, { headers: { Authorization: 'Bearer ' + tok }, cache: 'no-store' });
    if (r.status === 404) return [];
    if (r.status === 401) { this.s.access = null; this.save(); }
    if (!r.ok) throw new Error('read ' + r.status);
    return [parseData(await r.text())];
  },
  async write(tok) {
    const r = await fetch(GRAPH_CONTENT, { method: 'PUT', headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' }, body: serialize() });
    if (r.status === 401) { this.s.access = null; this.save(); }
    if (!r.ok) throw new Error('write ' + r.status);
  },
  logout() { this.s = {}; this.save(); lsSet(MS_KNOWN, null); },
};

/* =================== Google Drive =================== */
const GG = {
  /* ID client OAuth (public par nature, ce n'est pas un secret). Vide = bouton Google masqué. */
  clientId: '480407388573-otluvjrocpka2cfe4m63hafms5lfn84v.apps.googleusercontent.com',
  /* Un seul accès demandé (pas openid/email) : Google affiche alors un simple « Continuer »,
     sans case à cocher. L'adresse du compte est lue ensuite via le Drive (about.user). */
  scope: 'https://www.googleapis.com/auth/drive.appdata',
  driveScope: 'https://www.googleapis.com/auth/drive.appdata',
};
const GG_TOK = 'musclemap.google.v1';
const GG_TRY = 'musclemap.google.silentAt';
const DRIVE = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';
const ggRedirect = () => location.origin + location.pathname.replace(/index\.html$/, '');

const google = {
  id: 'google', name: 'Google Drive', account: 'Google',
  enabled: () => !!GG.clientId,
  s: lsJson(GG_TOK),
  save() { try { localStorage.setItem(GG_TOK, JSON.stringify(this.s)); } catch (e) {} },
  connected() { return !!this.s.ok; },
  known() { return !!this.s.ok; },
  email() { return this.s.email || ''; },
  login(silent) {
    const st = randStr(12);
    ssSet('mm_state', st); ssSet('mm_pending', 'google');
    const p = new URLSearchParams({
      client_id: GG.clientId, redirect_uri: ggRedirect(), response_type: 'token',
      scope: GG.scope, state: st, include_granted_scopes: 'true',
    });
    if (this.s.email) p.set('login_hint', this.s.email);
    if (silent === true) { p.set('prompt', 'none'); lsSet(GG_TRY, String(Date.now())); }
    location.assign('https://accounts.google.com/o/oauth2/v2/auth?' + p.toString());
  },
  /* Retour de Google : #access_token=…&state=… (ou #error=…) */
  isReturn(u) { return /(^#|&)(access_token|error)=/.test(u.hash); },
  async handleReturn(u) {
    const h = new URLSearchParams(u.hash.slice(1));
    try { history.replaceState({}, '', ggRedirect()); } catch (e) {}
    const err = h.get('error');
    if (err) return /^(login_required|interaction_required|consent_required|account_selection_required)$/.test(err) ? 'expired' : err === 'access_denied' ? 'cancelled' : 'failed';
    if (h.get('state') !== ssGet('mm_state')) return 'failed';
    // Sans l'accès au Drive (case décochée si Google en affiche une), rien à synchroniser.
    if (!(h.get('scope') || '').split(/\s+/).includes(GG.driveScope)) return 'scope';
    const access = h.get('access_token');
    // Adresse du compte (affichage + reconnexion) ; sans réseau ou en cas d'échec, on s'en passe.
    let email = '';
    try {
      const r = await fetch('https://www.googleapis.com/drive/v3/about?fields=user(emailAddress)', { headers: { Authorization: 'Bearer ' + access }, cache: 'no-store' });
      if (r.ok) email = ((await r.json()).user || {}).emailAddress || '';
    } catch (e) {}
    if (this.s.email && email && email !== this.s.email) this.s.fileId = null;   // autre compte
    this.s = { ...this.s, ok: true, access, expires: Date.now() + (+h.get('expires_in') || 3600) * 1000, email: email || this.s.email || '' };
    this.save();
    return null;
  },
  /* Jeton valide, ou null s'il faut repasser chez Google (jeton d'une heure, pas de renouvellement) */
  async token() {
    if (this.s.access && Date.now() < this.s.expires - 60000) return this.s.access;
    return null;
  },
  renewable: true,
  /* Reconnexion silencieuse : pas plus d'une tentative toutes les 2 minutes (évite les boucles) */
  maySilent() { return Date.now() - (+lsGet(GG_TRY) || 0) > 120000; },
  async api(url, opt, tok) {
    const r = await fetch(url, { ...opt, cache: 'no-store', headers: { ...(opt && opt.headers), Authorization: 'Bearer ' + tok } });
    if (r.status === 401) { this.s.access = null; this.save(); throw authError('auth'); }
    return r;
  },
  async files(tok) {
    const q = encodeURIComponent(`name='${FILE}' and trashed=false`);
    const r = await this.api(`${DRIVE}?spaces=appDataFolder&q=${q}&orderBy=createdTime&fields=files(id)`, {}, tok);
    if (!r.ok) throw new Error('list ' + r.status);
    return ((await r.json()).files || []).map(f => f.id);
  },
  /* Lit le fichier (et ses éventuels doublons, créés si deux appareils ont démarré en même temps) */
  async read(tok) {
    const ids = await this.files(tok);
    this.s.fileId = ids[0] || null; this.extra = ids.slice(1); this.save();
    const out = [];
    for (const id of ids) {
      const r = await this.api(`${DRIVE}/${id}?alt=media`, {}, tok);
      if (r.status === 404) continue;
      if (!r.ok) throw new Error('read ' + r.status);
      out.push(parseData(await r.text()));
    }
    return out;
  },
  async write(tok) {
    if (this.s.fileId) {
      const r = await this.api(`${UPLOAD}/${this.s.fileId}?uploadType=media`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: serialize() }, tok);
      if (r.status === 404) { this.s.fileId = null; this.save(); }
      else if (!r.ok) throw new Error('write ' + r.status);
    }
    if (!this.s.fileId) {
      const b = 'mm' + randStr(8);
      const body = `--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name: FILE, parents: ['appDataFolder'] })}\r\n--${b}\r\nContent-Type: application/json\r\n\r\n${serialize()}\r\n--${b}--`;
      const r = await this.api(`${UPLOAD}?uploadType=multipart&fields=id`, { method: 'POST', headers: { 'Content-Type': 'multipart/related; boundary=' + b }, body }, tok);
      if (!r.ok) throw new Error('create ' + r.status);
      this.s.fileId = (await r.json()).id; this.save();
    }
    // doublons fusionnés ci-dessus : on les supprime
    for (const id of this.extra || []) { try { await this.api(`${DRIVE}/${id}`, { method: 'DELETE' }, tok); } catch (e) {} }
    this.extra = [];
  },
  logout() {
    const tok = this.s.access;
    if (tok) { try { fetch('https://oauth2.googleapis.com/revoke?token=' + encodeURIComponent(tok), { method: 'POST' }).catch(() => {}); } catch (e) {} }
    this.s = {}; this.save(); lsSet(GG_TRY, null);
  },
};

/* =================== commun =================== */
const PROVIDERS = { onedrive, google };
export const providers = () => Object.values(PROVIDERS).filter(p => p.enabled());

/* Fournisseur courant : celui choisi, sinon OneDrive (comptes d'avant le choix) */
function current() { return PROVIDERS[lsGet(PROV_KEY)] || onedrive; }
export const provider = () => current();
export const connected = () => current().connected();
export const available = () => location.protocol !== 'file:';
/* Mode sans compte : séances sur cet appareil uniquement (aucune synchro) */
export const isLocal = () => !connected() && lsGet(LOCAL_KEY) === '1';
function keepData() { try { navigator.storage && navigator.storage.persist && navigator.storage.persist().catch(() => {}); } catch (e) {} }
export function useLocal() { lsSet(LOCAL_KEY, '1'); keepData(); setStatus('local'); hooks.unlock(); }
/* Dernier fournisseur utilisé (pour le mettre en premier sur l'écran de connexion) */
export const lastProvider = () => lsGet(LAST_KEY) || lsGet(PROV_KEY) || (onedrive.known() ? 'onedrive' : '');

let syncTimer = null, syncBusy = false, syncAgain = false;
let hooks = { gate() {}, unlock() {}, status() {}, data() {}, idle: () => true };
export let lastStatus = { state: 'local', at: null };
function setStatus(st) { lastStatus = { state: st, at: st === 'ok' ? new Date() : lastStatus.at }; hooks.status(lastStatus); }

export function login(id, silent) {
  if (!available()) return;
  const p = PROVIDERS[id] || current();
  if (!p.enabled()) return;
  lsSet(PROV_KEY, p.id); lsSet(LAST_KEY, p.id);
  p.login(silent);
}
/* Google : nouvel aller-retour chez Google. Silencieux au retour dans l'app ;
   sur demande (pastille « Reconnecter »), sans prompt=none : Google repasse sans écran
   si sa session est ouverte, sinon demande le mot de passe. */
export function reconnect(silent) { login(current().id, silent === true); }

/* Regroupe les demandes rapprochées en une seule synchro */
export function requestSync(delay) {
  if (!connected()) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(syncNow, delay || 0);
}
/* Récupère le fichier distant, fusionne, renvoie le résultat. Une seule synchro à la fois. */
export async function syncNow() {
  if (!connected()) return;
  if (syncBusy) { syncAgain = true; return; }
  syncBusy = true;
  clearTimeout(syncTimer);
  const p = current();
  try {
    setStatus('syncing');
    const tok = await p.token();
    if (!tok) {
      if (p.renewable) { setStatus('reauth'); return; }
      setStatus('local'); hooks.gate('expired'); return;
    }
    const remotes = await p.read(tok);
    remotes.forEach(r => mergeInto(r));
    saveSilently();
    hooks.data();
    await p.write(tok);
    setStatus('ok');
  } catch (e) {
    if (e.auth) { setStatus('reauth'); return; }
    setStatus(navigator.onLine === false ? 'offline' : 'error');
    requestSync(60000);
    return;
  } finally {
    syncBusy = false;
  }
  if (syncAgain) { syncAgain = false; requestSync(300); }
}

/* Retour dans l'app : Google a besoin d'un nouveau jeton ? on repasse chez Google si rien n'est en cours */
async function onResume() {
  const p = current();
  if (p.renewable && connected() && navigator.onLine !== false && !(await p.token()) && p.maySilent() && hooks.idle()) { reconnect(true); return; }
  requestSync(300);
}

export function logout() {
  clearTimeout(syncTimer);
  lsSet(LAST_KEY, current().id);
  current().logout();
  lsSet(PROV_KEY, null);
  setStatus('local');
  hooks.gate('loggedOut');
}

/* Démarrage : retour de connexion, session valide ? sinon écran de connexion.
   Renvoie true si l'app peut s'ouvrir. */
export async function initSync(h) {
  hooks = { ...hooks, ...h };
  onSave(() => { if (connected()) requestSync(1200); });

  if (!available()) { setStatus('local'); return true; }

  const u = new URL(location.href);
  const back = google.isReturn(u) ? google : onedrive.isReturn(u) ? onedrive : null;
  const returning = !!back;
  let err = '';
  if (back) {
    ssSet('mm_pending', null);
    lsSet(PROV_KEY, back.id); lsSet(LAST_KEY, back.id);
    err = (await back.handleReturn(u)) || '';
    if (!err && back.connected()) lsSet(LOCAL_KEY, null);   // compte connecté : fin du mode sans compte
  }

  const p = current();
  let status = 'none';
  if (p.connected()) {
    try { status = (await p.token()) ? 'ok' : 'none'; }
    catch (e) { status = 'offline'; }
    // Google sans jeton (hors ligne, reconnexion silencieuse refusée ou trop récente) :
    // on ouvre quand même, séances gardées ici, la pastille propose « Reconnecter ».
    if (status === 'none' && p.renewable && (navigator.onLine === false || !p.maySilent() || returning)) status = 'later';
  }
  if (status === 'none') {
    if (!returning && p.known() && navigator.onLine !== false) { login(p.id, true); return false; }
    // Sans compte : l'app s'ouvre directement (sauf échec d'une tentative de connexion, montré sur l'écran d'accueil)
    if (lsGet(LOCAL_KEY) === '1' && !err) { keepData(); setStatus('local'); hooks.unlock(); return true; }
    hooks.gate(err);
    return false;
  }

  window.addEventListener('focus', () => requestSync(300));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) onResume(); });
  window.addEventListener('online', () => requestSync(0));
  hooks.unlock();
  await syncNow();
  return true;
}
