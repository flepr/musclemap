# Dessin du corps — refonte MuscleMap

Générateur du corps masculin (face + dos, 34 muscles) utilisé pour la maquette de la refonte.

- `shapes.py` : les formes (moitié gauche du corps, symétrisée), repère 200 × 460, une entrée par muscle.
- `body.py` : lissage Catmull-Rom → courbes de Bézier, miroir, ombrage de volume.
- `gen.py` : génère les images de la maquette (`python3 gen.py sortie/`).

Ce n'est pas encore du code de production : la branche `refonte-design` n'est pas publiée.
