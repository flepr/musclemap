"""MuscleMap body generator — left half of a symmetric male figure, mirrored.
Coordinate system: 200 x 460 per view, centre x = 100."""
import json, sys, colorsys

W, H = 200, 460

def smooth_closed(p, t=1/6):
    n = len(p)
    d = f"M{p[0][0]:.1f} {p[0][1]:.1f}"
    for i in range(n):
        p0, p1, p2, p3 = p[(i-1) % n], p[i], p[(i+1) % n], p[(i+2) % n]
        c1 = (p1[0] + (p2[0]-p0[0])*t, p1[1] + (p2[1]-p0[1])*t)
        c2 = (p2[0] - (p3[0]-p1[0])*t, p2[1] - (p3[1]-p1[1])*t)
        d += f"C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]:.1f} {p2[1]:.1f}"
    return d + "Z"

def smooth_open(p, t=1/6):
    n = len(p)
    d = f"M{p[0][0]:.1f} {p[0][1]:.1f}"
    for i in range(n-1):
        p0, p1, p2, p3 = p[max(0, i-1)], p[i], p[i+1], p[min(n-1, i+2)]
        c1 = (p1[0] + (p2[0]-p0[0])*t, p1[1] + (p2[1]-p0[1])*t)
        c2 = (p2[0] - (p3[0]-p1[0])*t, p2[1] - (p3[1]-p1[1])*t)
        d += f"C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]:.1f} {p2[1]:.1f}"
    return d

def mirror(p): return [(W - x, y) for x, y in p]

def outline(left):
    """left half outline from top-centre to bottom-centre -> full closed outline"""
    right = [(W - x, y) for x, y in reversed(left[1:-1])]
    return left + right

exec(open(__file__.replace('body.py', 'shapes.py')).read())

def svg(view, fills=None, default='#3a3f46', base='#24272c', stroke='#0e0f11', sw=1.1,
        detail='#0e0f11', bg=None, ids=False, deco='#2c3036', shade=True):
    fills = fills or {}
    V = VIEWS[view]
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}">']
    if bg: out.append(f'<rect width="{W}" height="{H}" fill="{bg}"/>')
    if shade:
        out.append('<defs><radialGradient id="vol" cx="50%" cy="32%" r="70%">'
                   '<stop offset="0" stop-color="#fff" stop-opacity=".16"/>'
                   '<stop offset=".55" stop-color="#fff" stop-opacity="0"/>'
                   '<stop offset="1" stop-color="#000" stop-opacity=".30"/></radialGradient></defs>')
    for name, pts, full in V['base']:
        shapes = [pts] if full else [pts, mirror(pts)]
        for s in shapes:
            out.append(f'<path d="{smooth_closed(s)}" fill="{base}"/>')
    for pts in V.get('deco', []):
        for s in ([pts, mirror(pts)]):
            out.append(f'<path d="{smooth_closed(s)}" fill="{deco}" stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round"/>')
    for mid, polys in V['muscles']:
        f = fills.get(mid, default)
        for pts in polys:
            for s in ([pts, mirror(pts)]):
                a = f' data-m="{mid}"' if ids else ''
                out.append(f'<path{a} d="{smooth_closed(s)}" fill="{f}" stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round"/>')
                if shade: out.append(f'<path d="{smooth_closed(s)}" fill="url(#vol)" pointer-events="none"/>')
    for pts in V.get('details', []):
        for s in ([pts, mirror(pts)]):
            out.append(f'<path d="{smooth_open(s)}" fill="none" stroke="{detail}" stroke-width="0.9" stroke-linecap="round" opacity=".55"/>')
    out.append('</svg>')
    return '\n'.join(out)

if __name__ == '__main__':
    # debug: each muscle a distinct hue
    import os
    outdir = sys.argv[1]
    for view in VIEWS:
        ms = [m for m, _ in VIEWS[view]['muscles']]
        fills = {}
        for i, m in enumerate(ms):
            r, g, b = colorsys.hls_to_rgb(i / len(ms), .5, .6)
            fills[m] = '#%02x%02x%02x' % (int(r*255), int(g*255), int(b*255))
        open(os.path.join(outdir, f'dbg-{view}.svg'), 'w').write(svg(view, fills, bg='#0e0f11'))
        open(os.path.join(outdir, f'plain-{view}.svg'), 'w').write(svg(view, {}, default='#4a4f57', bg='#0e0f11'))
