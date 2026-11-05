/* MuscleMap — calcul des états (récup / prêt / à cibler) et des priorités. */
import { GROUPS, FAMILIES, GROUP_OF, FAMILY_OF, ALL_MUSCLES, MUSCLES } from './data.js';
import { state } from './store.js';

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
  return { state: st, never: false, hours, days, intensity: hours <= 0 ? 1 : Math.max(0, 1 - hours / rec) };
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

/* Titre « Priorité : … » — renvoie { kind, items } :
   kind 'family' (≥ 3 groupes en retard dans la famille du plus en retard), 'items' (les 2 premiers),
   'clear' (rien à cibler), 'first' (aucune séance). */
export function priority(list) {
  if (!state.sessions.length) return { kind: 'first' };
  if (!list.length) return { kind: 'clear' };
  const top = list[0];
  const sameFamily = list.filter(x => x.family === top.family).length;
  if (sameFamily >= 3) return { kind: 'family', family: top.family };
  return { kind: 'items', items: list.slice(0, 2) };
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
