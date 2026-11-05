"""Génère les images SVG de la maquette MuscleMap (corps de face + dos)."""
import sys, os
D = os.path.dirname(os.path.abspath(sys.argv[0]))
src = open(os.path.join(D, 'body.py')).read().replace('__file__', repr(os.path.join(D, 'body.py')))
exec(src.split("if __name__")[0])

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)

STEEL, BASE, DECO, GAP = '#454a52', '#22252a', '#2d3137', '#0e0f11'
DIM = '#33373d'

def inner(view, fills, default, deco=DECO, base=BASE):
    s = svg(view, fills, default=default, base=base, deco=deco, stroke=GAP)
    body = s.split('\n')[1:-1]
    return [l for l in body if not l.startswith('<defs>')]

DEFS = ('<defs><radialGradient id="vol" cx="50%" cy="32%" r="70%">'
        '<stop offset="0" stop-color="#fff" stop-opacity=".16"/>'
        '<stop offset=".55" stop-color="#fff" stop-opacity="0"/>'
        '<stop offset="1" stop-color="#000" stop-opacity=".30"/></radialGradient></defs>')

def compose(views, crop=None, gap=16):
    """views: list of (view, fills, default). crop: (y0, y1, x0, x1) in body coords."""
    y0, y1, x0, x1 = crop or (0, H, 0, W)
    cw = x1 - x0
    total_w = len(views) * cw + (len(views) - 1) * gap
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {total_w} {y1 - y0}" width="{total_w * 2}" height="{(y1 - y0) * 2}">', DEFS]
    for i, (view, fills, default) in enumerate(views):
        dx = i * (cw + gap) - x0
        out.append(f'<g transform="translate({dx} {-y0})">')
        out += inner(view, fills, default)
        out.append('</g>')
    out.append('</svg>')
    return '\n'.join(out)

def write(name, content):
    open(os.path.join(OUT, name), 'w').write(content)

# ---------- 1) Accueil : carte de récupération ----------
RED, AMBER = (212, 42, 28), '#e8a33a'
def heat(i):  # i = 1 tout juste travaillé -> 0 récupéré
    s = (69, 74, 82)
    return '#%02x%02x%02x' % tuple(round(a + (b - a) * i) for a, b in zip(s, RED))
fresh, mid = heat(0.73), heat(0.40)
HOME = {}
for m in ['pec_haut', 'pec_mil', 'delt_ant', 'delt_lat', 'tri_lat', 'tri_long', 'tri_med']: HOME[m] = fresh
for m in ['quad_ext', 'quad_droit', 'quad_int', 'fess_grand', 'fess_moy', 'adduc']: HOME[m] = mid
for m in ['dorsal', 'grand_rond', 'lombaires', 'trap_mil', 'trap_bas', 'delt_post', 'coiffe',
          'ischio_bf', 'ischio_st', 'gastro', 'soleaire', 'pec_bas']: HOME[m] = AMBER
write('body-home.svg', compose([('front', HOME, STEEL), ('back', HOME, STEEL)]))

# ---------- 2) Nouvelle séance : sélection en cours ----------
SEL = '#e3361f'
SELF = {m: SEL for m in ['dorsal', 'grand_rond', 'lombaires', 'trap_mil', 'trap_bas', 'delt_post', 'coiffe', 'bic_long', 'bic_court', 'brachial']}
write('body-seance.svg', compose([('front', SELF, DIM), ('back', SELF, DIM)]))

# ---------- 3) Fiches de groupe : sous-muscles en 4 teintes ----------
TONES = ['#d42a1c', '#f0782e', '#f3c46b', '#9fb4c8']
GROUPS = {
    'pectoraux': ['pec_haut', 'pec_mil', 'pec_bas'],
    'epaules': ['delt_ant', 'delt_lat', 'delt_post', 'coiffe'],
    'trapezes': ['trap_haut', 'trap_mil', 'trap_bas'],
    'dos': ['dorsal', 'grand_rond', 'lombaires'],
    'biceps': ['bic_long', 'bic_court', 'brachial'],
    'triceps': ['tri_long', 'tri_lat', 'tri_med'],
    'avantbras': ['brachiorad', 'flech', 'ext'],
    'abdos': ['abdos', 'obliques'],
    'fessiers': ['fess_grand', 'fess_moy'],
    'quadriceps': ['quad_droit', 'quad_ext', 'quad_int'],
    'ischios': ['ischio_bf', 'ischio_st'],
    'adducteurs': ['adduc'],
    'mollets': ['gastro', 'soleaire'],
}
def ybounds(view, ids):
    ys = [y for m, polys in VIEWS[view]['muscles'] if m in ids for p in polys for _, y in p]
    return (min(ys), max(ys)) if ys else None

for g, ids in GROUPS.items():
    fills = {m: TONES[i] for i, m in enumerate(ids)}
    views = [v for v in ('front', 'back') if ybounds(v, ids)]
    lo = min(ybounds(v, ids)[0] for v in views); hi = max(ybounds(v, ids)[1] for v in views)
    pad = 26
    y0, y1 = max(0, lo - pad), min(H, hi + pad)
    if y1 - y0 < 150:                     # garde un minimum de contexte
        c = (y0 + y1) / 2; y0, y1 = max(0, c - 75), min(H, c + 75)
    write(f'grp-{g}.svg', compose([(v, fills, DIM) for v in views], crop=(round(y0), round(y1), 14, 186), gap=10))

print('ok', sorted(os.listdir(OUT)))
