/* MuscleMap — synchro OneDrive (Microsoft Graph) et verrou de connexion.
   OAuth2 + PKCE, 100 % côté navigateur, sans serveur. Les données sont dans le
   dossier OneDrive /Apps/MuscleMap.
   App enregistrée sur https://entra.microsoft.com (« Personal Microsoft accounts
   only », Redirect URI de type SPA = https://flepr.github.io/musclemap/).
   Microsoft limite à 24 h la durée de connexion des apps « SPA » : au-delà, l'app
   tente une reconnexion silencieuse tant que la session Microsoft est ouverte. */
import { state, parseData, serialize, mergeInto, saveSilently, onSave } from './store.js';

const ONEDRIVE = {
  clientId: '50051d2a-7bf1-404c-9ffc-62701f17d430',
  authority: 'https://login.microsoftonline.com/consumers',
  scopes: ['Files.ReadWrite.AppFolder', 'offline_access', 'openid', 'profile'],
  fileName: 'musclemap-data.json',
};
const TOK_KEY = 'musclemap.onedrive.v1';
const KNOWN_KEY = 'musclemap.onedrive.known';
const GRAPH_CONTENT = 'https://graph.microsoft.com/v1.0/me/drive/special/approot:/' + ONEDRIVE.fileName + ':/content';

let cloud = loadCloud();
let syncTimer = null, syncBusy = false, syncAgain = false;
let hooks = { gate() {}, unlock() {}, status() {}, data() {} };
export let lastStatus = { state: 'local', at: null };

function loadCloud() { try { return JSON.parse(localStorage.getItem(TOK_KEY)) || {}; } catch (e) { return {}; } }
function saveCloud() { try { localStorage.setItem(TOK_KEY, JSON.stringify(cloud)); } catch (e) {} }
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} }
export const connected = () => !!(cloud && cloud.refresh);
export const available = () => location.protocol !== 'file:';
const redirectUri = () => location.origin + location.pathname;

function setStatus(st) { lastStatus = { state: st, at: st === 'ok' ? new Date() : lastStatus.at }; hooks.status(lastStatus); }

/* --- PKCE --- */
const b64url = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const sha256 = s => crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
function randStr(n) { const a = new Uint8Array(n); crypto.getRandomValues(a); return [...a].map(x => ('0' + x.toString(16)).slice(-2)).join(''); }

export async function login(silent) {
  if (!available()) return;
  const verifier = randStr(48);
  const challenge = b64url(await sha256(verifier));
  const st = randStr(12);
  sessionStorage.setItem('mm_verifier', verifier);
  sessionStorage.setItem('mm_state', st);
  const p = new URLSearchParams({
    client_id: ONEDRIVE.clientId, response_type: 'code', redirect_uri: redirectUri(),
    response_mode: 'query', scope: ONEDRIVE.scopes.join(' '),
    code_challenge: challenge, code_challenge_method: 'S256', state: st,
  });
  if (silent === true) p.set('prompt', 'none');
  location.assign(ONEDRIVE.authority + '/oauth2/v2.0/authorize?' + p.toString());
}

function applyToken(j) {
  cloud.access = j.access_token;
  cloud.expires = Date.now() + (j.expires_in || 3600) * 1000;
  if (j.refresh_token) cloud.refresh = j.refresh_token;
  saveCloud();
  lsSet(KNOWN_KEY, '1');
}
async function exchangeCode(code) {
  const body = new URLSearchParams({
    client_id: ONEDRIVE.clientId, grant_type: 'authorization_code', code,
    redirect_uri: redirectUri(), code_verifier: sessionStorage.getItem('mm_verifier') || '',
    scope: ONEDRIVE.scopes.join(' '),
  });
  const r = await fetch(ONEDRIVE.authority + '/oauth2/v2.0/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  if (!r.ok) throw new Error('token ' + r.status);
  applyToken(await r.json());
}
/* Jeton valide ; null si la session a expiré ; erreur si Microsoft est injoignable (on garde la session). */
async function accessToken() {
  if (cloud.access && Date.now() < cloud.expires - 60000) return cloud.access;
  if (!cloud.refresh) return null;
  const body = new URLSearchParams({ client_id: ONEDRIVE.clientId, grant_type: 'refresh_token', refresh_token: cloud.refresh, scope: ONEDRIVE.scopes.join(' ') });
  const r = await fetch(ONEDRIVE.authority + '/oauth2/v2.0/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  if (r.ok) { applyToken(await r.json()); return cloud.access; }
  if (r.status === 400 || r.status === 401) { cloud = {}; saveCloud(); return null; }
  throw new Error('token ' + r.status);
}

async function readRemote(tok) {
  const r = await fetch(GRAPH_CONTENT, { headers: { Authorization: 'Bearer ' + tok }, cache: 'no-store' });
  if (r.status === 404) return { sessions: [], tombstones: [], settings: null };
  if (r.status === 401) { cloud.access = null; saveCloud(); }
  if (!r.ok) throw new Error('read ' + r.status);
  return parseData(await r.text());
}
async function writeRemote(tok) {
  const r = await fetch(GRAPH_CONTENT, { method: 'PUT', headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' }, body: serialize() });
  if (r.status === 401) { cloud.access = null; saveCloud(); }
  if (!r.ok) throw new Error('write ' + r.status);
}

/* Regroupe les demandes rapprochées en une seule synchro */
export function requestSync(delay) {
  if (!connected()) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(syncNow, delay || 0);
}
/* Récupère OneDrive, fusionne, renvoie le résultat. Une seule synchro à la fois. */
export async function syncNow() {
  if (!connected()) return;
  if (syncBusy) { syncAgain = true; return; }
  syncBusy = true;
  clearTimeout(syncTimer);
  try {
    setStatus('syncing');
    const tok = await accessToken();
    if (!tok) { setStatus('local'); hooks.gate('expired'); return; }
    const remote = await readRemote(tok);
    mergeInto(remote);
    saveSilently();
    hooks.data();
    await writeRemote(tok);
    setStatus('ok');
  } catch (e) {
    setStatus(navigator.onLine === false ? 'offline' : 'error');
    requestSync(60000);
    return;
  } finally {
    syncBusy = false;
  }
  if (syncAgain) { syncAgain = false; requestSync(300); }
}

export function logout() {
  clearTimeout(syncTimer);
  cloud = {}; saveCloud(); lsSet(KNOWN_KEY, null);
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
  const code = u.searchParams.get('code'), err = u.searchParams.get('error');
  const returning = !!(code || err);
  if (returning) {
    try { history.replaceState({}, '', redirectUri()); } catch (e) {}
    const silentMiss = /^(login_required|interaction_required|consent_required)$/.test(err || '');
    try {
      if (err) throw new Error(u.searchParams.get('error_description') || err);
      if (u.searchParams.get('state') !== sessionStorage.getItem('mm_state')) throw new Error('state');
      await exchangeCode(code);
    } catch (e) { hooks.gate(silentMiss ? 'expired' : 'failed'); }
  }

  let status = 'none';
  if (connected()) {
    try { status = (await accessToken()) ? 'ok' : 'none'; }
    catch (e) { status = 'offline'; }
  }
  if (status === 'none') {
    if (!returning && lsGet(KNOWN_KEY) && navigator.onLine !== false) { login(true); return false; }
    if (!returning) hooks.gate('');
    return false;
  }

  window.addEventListener('focus', () => requestSync(300));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) requestSync(300); });
  window.addEventListener('online', () => requestSync(0));
  hooks.unlock();
  await syncNow();
  return true;
}
