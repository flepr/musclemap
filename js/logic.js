/* MuscleMap — calcul des états (récup / prêt / à cibler) et des priorités. */
import { GROUPS, FAMILIES, GROUP_OF, FAMILY_OF, ALL_MUSCLES, MUSCLES } from './data.js';
import { state, upsertSession } from './store.js';

const H = 3.6e6;

export const isTracked = m => !state.settings.excluded.includes(m);
export const trackedMuscles = g => GROUPS[g].muscles.filter(isTracked);

/* Dernière séance de chaque muscle (ms) */
export function lastWorked() {
  const map = {};
  for (const s of state.sessions) {
    const t = new Date(s.datetime).getTime();
    for (const m of s.muscles) if (!map[m] || t > map[m]) map[m] = t;
  }
  return map;
}

export function recHours(m) {
  const g = GROUP_OF[m];
  return g && GROUPS[g].size === 'big' ? state.settings.recBig : state.settings.recSmall;
}

/* État d'un muscle : { state: 'recover'|'ready'|'target'|'off', hours, days, intensity, never } */
export function muscleState(m, last, now = Date.now()) {
  const ts = last[m];
  const tracked = isTracked(m);
  if (!ts) return { state: tracked ? 'target' : 'off', never: true, hours: Infinity, days: Infinity, intensity: 0 };
  const hours = (now - ts) / H;
  const rec = recHours(m);
  const days = hours / 24;
  let st;
  if (hours < rec) st = 'recover';
  else if (days >= state.settings.targetDays) st = 'target';
  else st = 'ready';
  if (!tracked) st = 'off';
  return { state: st, never: false, hours, days, rec, intensity: hours <= 0 ? 1 : Math.max(0, 1 - hours / rec) };
}

export function allStates(now = Date.now()) {
  const last = lastWorked();
  const out = {};
  for (const m of ALL_MUSCLES) out[m] = muscleState(m, last, now);
  return out;
}

/* Liste « À cibler » : une entrée par groupe en retard.
   - groupe entièrement en retard → on nomme le groupe
   - groupe partiellement en retard → on nomme le(s) muscle(s) en retard
   Tri : « jamais » d'abord, puis du plus ancien au plus récent. */
export function targets(states) {
  const items = [];
  for (const f of FAMILIES) for (const g of f.groups) {
    const tm = trackedMuscles(g);
    if (!tm.length) continue;
    const late = tm.filter(m => states[m].state === 'target');
    if (!late.length) continue;
    const never = late.every(m => states[m].never);
    const days = Math.max(...late.map(m => states[m].days));
    items.push({ group: g, family: f.id, muscles: late, whole: late.length === tm.length, never, days });
  }
  items.sort((a, b) => (b.never - a.never) || (b.days - a.days));
  return items;
}

/* Titre « Priorité : … » — renvoie { kind, labels, more } :
   kind 'items' : ce qui est rouge sur la carte. Un groupe dont au moins la moitié des muscles suivis
   est à travailler est nommé par le groupe (« dos », « trapèzes ») ; sinon on nomme ses muscles en
   retard (« coiffe des rotateurs »). Les groupes passent avant les muscles isolés ; à égalité,
   « jamais » d'abord puis le plus en retard. Pas de nom de famille générique (« haut du corps ») :
   il englobait des muscles déjà travaillés. Jusqu'à 4 noms ; au-delà, 3 noms puis « et N autres ».
   kind 'clear' (rien à travailler), 'first' (aucune séance). */
export function priority(list, label) {
  if (!state.sessions.length) return { kind: 'first' };
  if (!list.length) return { kind: 'clear' };
  const groups = [], singles = [];
  for (const it of list) {
    if (it.whole || it.muscles.length * 2 >= trackedMuscles(it.group).length) groups.push(label(it.group, null));
    else for (const m of it.muscles) singles.push(label(null, m));
  }
  const names = [...groups, ...singles];
  const n = names.length <= 4 ? names.length : 3;   // jamais « et 1 autre » : on écrit le 4e nom
  return { kind: 'items', labels: names.slice(0, n), more: names.length - n };
}

/* Prochain muscle qui passera « à cibler » (quand rien ne l'est) */
export function nextTarget(states) {
  let best = null;
  for (const m of ALL_MUSCLES) {
    const s = states[m];
    if (!isTracked(m) || s.never) continue;
    const left = state.settings.targetDays - s.days;
    if (left > 0 && (!best || left < best.left)) best = { m, left };
  }
  return best;
}

/* Résumé d'une séance par groupe : [{ group, muscles, whole }] */
export function sessionGroups(muscles) {
  const out = [];
  for (const f of FAMILIES) for (const g of f.groups) {
    const ms = GROUPS[g].muscles.filter(m => muscles.includes(m));
    if (ms.length) out.push({ group: g, muscles: ms, whole: ms.length === GROUPS[g].muscles.length });
  }
  return out;
}
export const knownMuscles = list => list.filter(m => MUSCLES[m]);
export { FAMILY_OF, GROUP_OF };

/* Séance en cours : enregistrée au fur et à mesure (« Valider »), elle reste ouverte (open: true,
   lastAt = dernier ajout) jusqu'à « Terminer », ou se ferme toute seule 1 h après le dernier muscle
   validé. La fermeture est vérifiée à l'ouverture de l'app (pas de minuterie en arrière-plan) : le
   résultat est le même sur tous les appareils. */
export const AUTO_CLOSE = 3.6e6;
const lastAt = s => +s.lastAt || new Date(s.datetime).getTime();
export const liveEnds = s => lastAt(s) + AUTO_CLOSE;
export function openSession(now = Date.now()) {
  let best = null;
  for (const s of state.sessions) if (s.open && liveEnds(s) > now && (!best || lastAt(s) > lastAt(best))) best = s;
  return best;
}
export function closedCopy(s) { const { open, lastAt: _, ...rest } = s; return rest; }
/* Ferme les séances oubliées ; renvoie true si quelque chose a changé */
export function closeStale(now = Date.now()) {
  const keep = openSession(now);
  const stale = state.sessions.filter(s => s.open && s !== keep);
  stale.forEach(s => upsertSession(closedCopy(s)));
  return stale.length > 0;
}
