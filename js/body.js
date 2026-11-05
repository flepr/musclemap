/* MuscleMap — dessin du corps (face et dos), généré en SVG.
   Repère : 200 × 460 par vue, axe de symétrie x = 100. Chaque forme est décrite
   pour la moitié gauche puis symétrisée ; les points sont lissés en courbes de
   Bézier (Catmull-Rom). Source : design/body/shapes.py (même géométrie). */

const W = 200, H = 460;

function smooth(p, closed) {
  const n = p.length, t = 1 / 6, f = v => Math.round(v * 10) / 10;
  let d = `M${f(p[0][0])} ${f(p[0][1])}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = closed ? p[(i - 1 + n) % n] : p[Math.max(0, i - 1)];
    const p1 = p[i];
    const p2 = closed ? p[(i + 1) % n] : p[i + 1];
    const p3 = closed ? p[(i + 2) % n] : p[Math.min(n - 1, i + 2)];
    d += `C${f(p1[0] + (p2[0] - p0[0]) * t)} ${f(p1[1] + (p2[1] - p0[1]) * t)} ${f(p2[0] - (p3[0] - p1[0]) * t)} ${f(p2[1] - (p3[1] - p1[1]) * t)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return closed ? d + 'Z' : d;
}
const mirror = p => p.map(([x, y]) => [W - x, y]);
const outline = left => left.concat(left.slice(1, -1).reverse().map(([x, y]) => [W - x, y]));

const HEAD = [[100,12],[111,15],[118,26],[119,40],[116,52],[110,61],[100,65],[90,61],[84,52],[81,40],[82,26],[89,15]];
const NECK = [[88,48],[112,48],[114,78],[86,78]];
const TORSO = outline([[100,70],[88,71],[78,79],[62,86],[56,98],[58,120],[61,140],[62,162],[66,186],[70,206],[68,222],[64,238],[66,252],[100,264]]);
const BASE = [
  [HEAD, true], [NECK, true], [TORSO, true],
  [[[60,86],[46,86],[35,98],[31,118],[32,146],[34,172],[36,194],[44,204],[54,202],[58,188],[60,162],[62,138],[64,108]], false],
  [[[38,190],[29,206],[25,228],[25,250],[29,262],[42,262],[50,242],[57,216],[58,196]], false],
  [[[27,256],[23,272],[25,290],[32,302],[40,298],[44,280],[44,260]], false],
  [[[66,230],[56,254],[53,284],[56,314],[62,338],[72,350],[90,348],[93,324],[97,294],[100,270],[100,250]], false],
  [[[64,338],[60,356],[59,380],[62,404],[66,424],[69,436],[86,436],[88,414],[93,388],[95,362],[92,340]], false],
  [[[69,430],[63,442],[66,452],[90,452],[91,432]], false],
];

const FRONT_DECO = [
  [[92,52],[88,62],[91,74],[97,84],[95,70]],
  [[66,140],[62,148],[63,158],[70,161],[76,160],[70,152]],
  [[70,352],[68,370],[69,392],[72,414],[76,396],[76,370],[74,354]],
];
const FRONT = [
  ['fess_moy',  [[[69,229],[62,239],[57,254],[59,264],[65,252],[72,238]]]],
  ['trap_haut', [[[90,58],[86,68],[76,77],[62,85],[78,86],[90,80],[94,70]]]],
  ['delt_lat',  [[[58,86],[46,87],[37,97],[33,114],[35,132],[44,148],[48,126],[52,104],[56,92]]]],
  ['delt_ant',  [[[80,86],[68,84],[58,86],[52,104],[48,126],[46,146],[56,130],[62,112],[70,96]]]],
  ['pec_haut',  [[[99,89],[88,87],[80,88],[70,96],[62,110],[58,117],[72,110],[86,106],[99,106]]]],
  ['pec_mil',   [[[99,109],[86,109],[72,113],[59,119],[68,125],[84,131],[99,133]]]],
  ['pec_bas',   [[[99,136],[84,134],[68,127],[60,122],[62,131],[71,143],[85,151],[99,151]]]],
  ['bic_long',  [[[46,148],[40,160],[37,174],[39,190],[45,198],[49,180],[50,160]]]],
  ['bic_court', [[[52,146],[51,162],[51,180],[49,198],[54,196],[58,180],[59,160],[56,146]]]],
  ['brachial',  [[[37,178],[35,190],[38,201],[44,201],[41,190]]]],
  ['brachiorad',[[[40,200],[33,212],[29,228],[28,244],[32,247],[38,228],[46,208]]]],
  ['flech',     [[[48,205],[40,226],[34,248],[37,258],[44,258],[50,238],[56,216],[56,202]]]],
  ['abdos',     [[[99,155],[88,153],[86,171],[99,172]], [[99,176],[87,176],[86,195],[99,196]],
                 [[99,200],[87,200],[87,218],[99,219]], [[99,223],[87,223],[88,241],[93,253],[99,257]]]],
  ['obliques',  [[[84,166],[76,161],[67,163],[66,184],[70,206],[77,226],[86,240],[86,214],[85,190]]]],
  ['quad_ext',  [[[66,240],[60,252],[55,270],[53,292],[55,314],[61,332],[68,338],[72,322],[70,296],[68,268]]]],
  ['quad_droit',[[[74,242],[71,258],[71,282],[74,304],[78,322],[81,334],[85,322],[86,298],[84,272],[80,252]]]],
  ['quad_int',  [[[89,296],[85,310],[83,326],[85,340],[91,344],[95,334],[96,318],[94,304]]]],
  ['adduc',     [[[81,252],[86,264],[88,280],[92,292],[97,296],[99,280],[99,262],[94,254]]]],
  ['gastro',    [[[86,350],[92,356],[96,370],[95,386],[90,398],[85,388],[84,366]], [[65,350],[61,362],[59,378],[62,394],[66,388],[68,368]]]],
  ['soleaire',  [[[63,396],[63,412],[66,424],[69,410],[67,398]], [[88,400],[91,410],[88,424],[85,412]]]],
];
const FRONT_DETAILS = [
  [[70,176],[82,190]], [[72,200],[84,214]],
  [[84,96],[66,112]], [[88,114],[68,122]], [[88,140],[70,132]],
  [[52,100],[48,124]], [[66,92],[56,118]],
];
const BACK = [
  ['trap_haut', [[[99,54],[92,58],[88,68],[78,78],[64,86],[76,90],[88,92],[99,92]]]],
  ['trap_mil',  [[[99,95],[86,94],[72,91],[63,95],[68,103],[80,110],[92,118],[99,122]]]],
  ['trap_bas',  [[[99,125],[90,119],[80,113],[84,131],[91,150],[99,166]]]],
  ['delt_lat',  [[[58,87],[46,88],[37,98],[33,116],[35,134],[44,148],[44,128],[46,108],[52,94]]]],
  ['delt_post', [[[66,90],[58,88],[52,94],[46,108],[44,128],[46,140],[54,130],[62,112],[68,98]]]],
  ['coiffe',    [[[80,110],[70,104],[64,108],[62,119],[68,129],[79,131],[85,122]]]],
  ['grand_rond',[[[63,126],[59,134],[63,141],[75,143],[82,136],[71,133]]]],
  ['dorsal',    [[[87,134],[78,144],[67,146],[61,156],[63,176],[70,196],[80,214],[88,226],[89,204],[91,182],[96,170],[94,150]]]],
  ['lombaires', [[[99,172],[94,176],[91,196],[90,216],[93,236],[99,244]]]],
  ['tri_lat',   [[[43,148],[37,160],[35,176],[38,190],[44,186],[47,168],[48,152]]]],
  ['tri_long',  [[[50,136],[49,154],[48,172],[48,186],[54,190],[59,174],[61,154],[58,138]]]],
  ['tri_med',   [[[39,192],[38,200],[45,206],[55,202],[55,194],[46,191]]]],
  ['ext',       [[[40,206],[32,222],[28,242],[30,257],[38,257],[44,234],[50,212]]]],
  ['flech',     [[[52,210],[47,232],[42,257],[46,259],[52,238],[57,214]]]],
  ['fess_moy',  [[[96,229],[84,224],[70,228],[63,242],[66,252],[76,246],[88,240],[97,238]]]],
  ['fess_grand',[[[99,244],[88,242],[76,248],[66,258],[62,272],[65,286],[76,292],[90,292],[99,290]]]],
  ['ischio_bf', [[[64,294],[58,310],[58,328],[64,344],[72,334],[74,312],[72,298]]]],
  ['ischio_st', [[[76,297],[76,316],[80,334],[88,346],[94,326],[95,306],[92,295]]]],
  ['adduc',     [[[93,294],[96,314],[98,298]]]],
  ['gastro',    [[[64,350],[59,364],[60,384],[66,398],[74,388],[76,364],[72,352]], [[80,350],[78,372],[82,396],[88,402],[93,388],[94,366],[90,352]]]],
  ['soleaire',  [[[60,388],[62,404],[68,420],[72,412],[66,400]], [[92,392],[93,404],[88,420],[84,412],[90,402]]]],
];
const BACK_DETAILS = [[[99,60],[99,250]], [[70,262],[80,280]], [[82,300],[86,330]]];

/* Pré-calcul des tracés (une fois) */
const both = p => [smooth(p, true), smooth(mirror(p), true)];
const BASE_D = BASE.flatMap(([p, full]) => full ? [smooth(p, true)] : both(p));
function prep(muscles, deco, details) {
  return {
    deco: deco.flatMap(both),
    muscles: muscles.map(([id, polys]) => [id, polys.flatMap(both)]),
    details: details.flatMap(p => [smooth(p, false), smooth(mirror(p), false)]),
  };
}
const VIEWS = { front: prep(FRONT, FRONT_DECO, FRONT_DETAILS), back: prep(BACK, [], BACK_DETAILS) };

/* Groupes visibles sur chaque vue, et zone verticale qu'ils occupent (pour les vignettes) */
const YS = {};
for (const [view, list] of [['front', FRONT], ['back', BACK]])
  for (const [id, polys] of list)
    for (const p of polys) for (const [, y] of p) {
      const k = view + ':' + id;
      YS[k] = YS[k] ? [Math.min(YS[k][0], y), Math.max(YS[k][1], y)] : [y, y];
    }

export const PALETTES = {
  dark: {
    base: '#22252a', deco: '#2d3137', gap: '#16181b', steel: '#454a52', dim: '#33373d', detail: '#0e0f11',
    red: [212, 42, 28], amber: '#e8a33a', sel: '#e3361f', off: '#2d3137',
    tones: ['#d42a1c', '#f0782e', '#f3c46b', '#9fb4c8'], hi: .16, lo: .30,
  },
  light: {
    base: '#d9d6d0', deco: '#cdcac4', gap: '#ffffff', steel: '#b3b8bf', dim: '#c9ccd1', detail: '#8d9198',
    red: [200, 35, 26], amber: '#e39a26', sel: '#c8231a', off: '#d3d0ca',
    tones: ['#c8231a', '#e8691f', '#e0a93c', '#6f8aa6'], hi: .22, lo: .16,
  },
};

/* Couleur « en récupération » : du gris acier (0) au rouge (1) */
export function heatColor(pal, i) {
  const s = hexRgb(pal.steel);
  return '#' + s.map((a, k) => Math.round(a + (pal.red[k] - a) * Math.max(0, Math.min(1, i))).toString(16).padStart(2, '0')).join('');
}
function hexRgb(h) { return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); }

let uid = 0;
function viewMarkup(view, fill, pal, gid, dx = 0, y0 = 0, interactive = false) {
  const V = VIEWS[view];
  let s = `<g transform="translate(${dx} ${-y0})">`;
  for (const d of BASE_D) s += `<path d="${d}" fill="${pal.base}"/>`;
  for (const d of V.deco) s += `<path d="${d}" fill="${pal.deco}" stroke="${pal.gap}" stroke-width="1.1"/>`;
  for (const [id, ds] of V.muscles) {
    const c = fill(id);
    s += `<g class="m${interactive ? ' tap' : ''}" data-m="${id}">`;
    for (const d of ds) s += `<path d="${d}" fill="${c}" stroke="${pal.gap}" stroke-width="1.1" stroke-linejoin="round"/><path d="${d}" fill="url(#${gid})" pointer-events="none"/>`;
    s += '</g>';
  }
  for (const d of V.details) s += `<path d="${d}" fill="none" stroke="${pal.detail}" stroke-width=".9" stroke-linecap="round" opacity=".55" pointer-events="none"/>`;
  return s + '</g>';
}
function defs(pal, gid) {
  return `<defs><radialGradient id="${gid}" cx="50%" cy="32%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity="${pal.hi}"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${pal.lo}"/></radialGradient></defs>`;
}

/* Corps entier, face + dos côte à côte. fill(id) → couleur. */
export function bodyPair(fill, pal, { interactive = false, label = '' } = {}) {
  const gid = 'vol' + (++uid);
  return `<svg viewBox="0 0 416 460" role="img" aria-label="${label}" class="body">${defs(pal, gid)}`
    + viewMarkup('front', fill, pal, gid, 0, 0, interactive)
    + viewMarkup('back', fill, pal, gid, 216, 0, interactive) + '</svg>';
}

/* Vignette d'un groupe : seulement les vues où il apparaît, recadrée sur sa zone */
export function groupFigure(groupMuscles, fill, pal, label = '') {
  const views = ['front', 'back'].filter(v => groupMuscles.some(m => YS[v + ':' + m]));
  let lo = 1e9, hi = -1e9;
  for (const v of views) for (const m of groupMuscles) { const r = YS[v + ':' + m]; if (r) { lo = Math.min(lo, r[0]); hi = Math.max(hi, r[1]); } }
  let y0 = Math.max(0, lo - 26), y1 = Math.min(H, hi + 26);
  if (y1 - y0 < 150) { const c = (y0 + y1) / 2; y0 = Math.max(0, c - 75); y1 = Math.min(H, c + 75); }
  const x0 = 14, cw = 172, gap = 10, tw = views.length * cw + (views.length - 1) * gap;
  const gid = 'vol' + (++uid);
  let s = `<svg viewBox="0 0 ${tw} ${Math.round(y1 - y0)}" role="img" aria-label="${label}" class="fig">${defs(pal, gid)}`;
  views.forEach((v, i) => { s += viewMarkup(v, fill, pal, gid, i * (cw + gap) - x0, y0); });
  return s + '</svg>';
}
