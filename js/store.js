/* MuscleMap — données : séances, suppressions, réglages ; stockage local,
   format de fichier (OneDrive / export), fusion entre appareils. */
import { MUSCLES, LEGACY, DEFAULTS } from './data.js';

const STORAGE_KEY = 'musclemap.sessions.v1';
const TOMB_KEY = 'musclemap.tombstones.v1';
const SETTINGS_KEY = 'musclemap.settings.v1';
const TOMB_TTL = 90 * 24 * 3.6e6;          // traces de suppression oubliées après 90 jours

export const DEFAULT_SETTINGS = {
  lang: 'auto', theme: 'auto',
  recSmall: DEFAULTS.recSmall, recBig: DEFAULTS.recBig, targetDays: DEFAULTS.targetDays,
  entry: 'groups', excluded: [], onboarded: false, updatedAt: 0,
};

export const state = {
  sessions: [],
  tombstones: [],
  settings: { ...DEFAULT_SETTINGS },
};

const listeners = new Set();
export function onSave(fn) { listeners.add(fn); }

function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }

/* --- Validation + conversion de l'ancien format (13 groupes) --- */
function migrateMuscles(list) {
  const out = [];
  for (const m of list) {
    if (MUSCLES[m]) out.push(m);
    else if (LEGACY[m]) out.push(...LEGACY[m]);
    else out.push(m);                      // inconnu : gardé tel quel (version future)
  }
  return [...new Set(out)];
}
function validSession(s) {
  return !!s && typeof s.id === 'string' && s.id !== ''
    && typeof s.datetime === 'string' && !isNaN(new Date(s.datetime).getTime())
    && Array.isArray(s.muscles) && s.muscles.every(m => typeof m === 'string');
}
function cleanSettings(x) {
  if (!x || typeof x !== 'object') return null;
  const s = { ...DEFAULT_SETTINGS };
  if (['auto', 'fr', 'en'].includes(x.lang)) s.lang = x.lang;
  if (['auto', 'light', 'dark'].includes(x.theme)) s.theme = x.theme;
  for (const k of ['recSmall', 'recBig', 'targetDays']) if (Number.isFinite(+x[k]) && +x[k] > 0) s[k] = +x[k];
  if (['groups', 'muscles'].includes(x.entry)) s.entry = x.entry;
  if (Array.isArray(x.excluded)) s.excluded = x.excluded.filter(m => typeof m === 'string');
  s.onboarded = !!x.onboarded;
  s.updatedAt = +x.updatedAt || 0;
  return s;
}
export function parseData(txt) {
  if (!txt || !txt.trim()) return { sessions: [], tombstones: [], settings: null };
  const data = JSON.parse(txt);
  const arrS = Array.isArray(data) ? data : (data && Array.isArray(data.sessions) ? data.sessions : []);
  const arrT = data && Array.isArray(data.tombstones) ? data.tombstones : [];
  return {
    sessions: arrS.filter(validSession).map(s => ({ ...s, muscles: migrateMuscles(s.muscles) })),
    tombstones: arrT.filter(t => t && typeof t.id === 'string').map(t => ({ id: t.id, t: +t.t || 0 })),
    settings: data && !Array.isArray(data) ? cleanSettings(data.settings) : null,
  };
}
export function serialize() {
  return JSON.stringify({ app: 'MuscleMap', version: 3, exportedAt: new Date().toISOString(),
    sessions: state.sessions, tombstones: state.tombstones, settings: state.settings }, null, 2);
}

/* --- Stockage local --- */
export function load() {
  try { state.sessions = parseData(JSON.stringify({ sessions: JSON.parse(lsGet(STORAGE_KEY)) || [] })).sessions; } catch (e) { state.sessions = []; }
  try { const a = JSON.parse(lsGet(TOMB_KEY)); state.tombstones = Array.isArray(a) ? a.filter(t => t && typeof t.id === 'string') : []; } catch (e) { state.tombstones = []; }
  try { state.settings = cleanSettings(JSON.parse(lsGet(SETTINGS_KEY))) || { ...DEFAULT_SETTINGS }; } catch (e) { state.settings = { ...DEFAULT_SETTINGS }; }
}
let silent = false;
export function save() {
  const ok = lsSet(STORAGE_KEY, JSON.stringify(state.sessions))
    & lsSet(TOMB_KEY, JSON.stringify(state.tombstones))
    & lsSet(SETTINGS_KEY, JSON.stringify(state.settings));
  if (!silent) listeners.forEach(fn => fn(!!ok));
}
/* Enregistre sans déclencher de synchro (utilisé pendant une synchro) */
export function saveSilently() { silent = true; try { save(); } finally { silent = false; } }

export function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

/* --- Opérations --- */
export function upsertSession(s) {
  const i = state.sessions.findIndex(x => x.id === s.id);
  const rec = { ...s, updatedAt: Date.now() };
  if (i >= 0) state.sessions[i] = rec; else state.sessions.push(rec);
  save();
}
export function deleteSession(id) {
  const removed = state.sessions.find(s => s.id === id);
  state.sessions = state.sessions.filter(s => s.id !== id);
  state.tombstones = state.tombstones.filter(t => t.id !== id);
  state.tombstones.push({ id, t: Date.now() });
  save();
  return removed;
}
export function restoreSession(s) {
  state.tombstones = state.tombstones.filter(t => t.id !== s.id);
  upsertSession(s);
}
export function updateSettings(patch) {
  state.settings = { ...state.settings, ...patch, updatedAt: Date.now() };
  save();
}

/* --- Fusion avec des données venues d'ailleurs (OneDrive, import) --- */
export function mergeInto(incoming) {
  const inc = Array.isArray(incoming) ? { sessions: incoming, tombstones: [] } : (incoming || { sessions: [], tombstones: [] });

  // 1) Suppressions : on garde l'horodatage le plus récent par id.
  const tmap = new Map(state.tombstones.map(t => [t.id, t.t || 0]));
  for (const t of inc.tombstones || []) tmap.set(t.id, Math.max(tmap.get(t.id) || 0, t.t || 0));

  // 2) Séances : la version modifiée le plus récemment gagne (à égalité, l'entrante).
  const smap = new Map(state.sessions.map(s => [s.id, s]));
  for (const s of inc.sessions || []) {
    const cur = smap.get(s.id);
    if (!cur || (s.updatedAt || 0) >= (cur.updatedAt || 0)) smap.set(s.id, s);
  }

  // 3) Une suppression masque la séance, sauf si elle a été modifiée APRÈS.
  for (const [id, t] of tmap) { const s = smap.get(id); if (s && t >= (s.updatedAt || 0)) smap.delete(id); }

  // 4) Ménage des vieilles suppressions.
  const limit = Date.now() - TOMB_TTL;
  for (const [id, t] of tmap) if (t < limit) tmap.delete(id);

  state.sessions = [...smap.values()];
  state.tombstones = [...tmap].map(([id, t]) => ({ id, t }));

  // 5) Réglages : les plus récents gagnent.
  if (inc.settings && (inc.settings.updatedAt || 0) > (state.settings.updatedAt || 0)) state.settings = inc.settings;
}
