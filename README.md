# MuscleMap

Application web (PWA) de suivi des séances de musculation : à chaque séance on logge les muscles travaillés, et la carte du corps montre ceux qui récupèrent, ceux qui sont prêts et ceux à cibler en priorité.

En ligne : https://flepr.github.io/musclemap/

## Principes
- **13 groupes, 34 muscles** (`js/data.js`). On enregistre un groupe entier d'un tap, ou muscle par muscle.
- **États** : en récup (48 h petits muscles, 72 h gros groupes), prêt, à cibler (5 jours et plus, ou jamais). Seuils réglables, valeurs par défaut sourcées (`STUDIES` dans `js/data.js`).
- **Muscles suivis** : les muscles qu'on ne travaille jamais peuvent être exclus ; ils ne sont jamais « à cibler ».
- **Français / anglais** (auto selon le téléphone, anglais par défaut hors français) ; **thème clair / sombre** (auto selon le téléphone).
- **Synchro sans serveur**, au choix : **OneDrive** (dossier /Apps/MuscleMap, connexion Microsoft) ou **Google Drive** (dossier caché de l'app, autorisation `drive.appdata`, connexion Google). Les séances restent dans l'espace de la personne ; fonctionne hors ligne (service worker).

## Fichiers
- `index.html` — coquille de l'app
- `css/app.css` — styles des deux thèmes
- `js/app.js` — interface ; `js/data.js` — hiérarchie musculaire et contenus ; `js/i18n.js` — textes FR/EN
- `js/store.js` — données, format de fichier (v3), migration de l'ancien format, fusion entre appareils
- `js/logic.js` — calcul des états et des priorités ; `js/body.js` — dessin du corps (SVG)
- `js/sync.js` — connexion Microsoft / Google et synchro OneDrive / Google Drive (ID client Google dans `GG.clientId`)
- `sw.js`, `manifest.json`, icônes — installation sur l'écran d'accueil et mode hors ligne
- `fonts/` — Barlow et Barlow Condensed (SIL Open Font License 1.1, © The Barlow Project Authors)
