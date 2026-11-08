/* MuscleMap — statistiques d'usage anonymes (Umami Cloud).
   But : savoir combien de personnes utilisent l'app, sans jamais savoir qui.
   - Aucun cookie, aucun identifiant envoyé, aucune donnée de séance (ni date, ni muscles), aucune adresse e-mail.
   - Les « actifs du jour / de la semaine » sont comptés avec un simple repère gardé sur l'appareil
     (« déjà compté aujourd'hui ? ») : rien ne permet de relier deux visites entre elles côté Umami.
   - L'adresse envoyée est toujours « / » : les paramètres de connexion (?code=…, #access_token=…) ne partent jamais.
   - Désactivable dans Réglages › À propos (choix gardé sur l'appareil). */

const WEBSITE_ID = '5927f278-4201-4080-ac46-bd9ccbcdb150';                         // ID du site dans Umami Cloud (vide = statistiques coupées)
const SCRIPT = 'https://cloud.umami.is/script.js';
const PROD_HOST = 'flepr.github.io';           // pas de statistiques pendant les tests en local
const KEY = 'musclemap.stats.v1';              // { off, device, day, week }

const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
const write = o => { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} };

export const statsConfigured = () => !!WEBSITE_ID;
export const statsAvailable = () => !!WEBSITE_ID && location.hostname === PROD_HOST;
export const statsOn = () => !read().off;
export function setStats(on) {
  const s = read();
  if (on) delete s.off; else s.off = true;
  write(s);
  if (on) boot();
}

/* ---------- chargement du script et file d'attente ---------- */
let loading = null;
const queue = [];
function boot() {
  if (loading || !statsAvailable() || !statsOn()) return loading;
  loading = new Promise(resolve => {
    const el = document.createElement('script');
    el.src = SCRIPT; el.defer = true;
    el.dataset.websiteId = WEBSITE_ID;
    el.dataset.autoTrack = 'false';      // on décide nous-mêmes de ce qui part
    el.dataset.excludeSearch = 'true';
    el.dataset.excludeHash = 'true';
    el.dataset.domains = PROD_HOST;
    el.onload = () => { resolve(true); flush(); };
    el.onerror = () => resolve(false);   // bloqueur de contenu, hors ligne… : tant pis, l'app continue
    document.head.appendChild(el);
  });
  return loading;
}
/* envois l'un après l'autre : le premier rapporte le jeton de visite que réutilisent les suivants */
let flushing = false;
async function flush() {
  if (flushing || !window.umami) return;
  flushing = true;
  while (queue.length && statsOn()) { try { await window.umami.track(queue.shift()); } catch (e) {} }
  flushing = false;
}
/* provenance : seulement le site d'origine (Instagram…), jamais le retour de connexion Google / Microsoft */
function source() {
  try {
    const r = new URL(document.referrer);
    if (r.hostname === location.hostname || /google\.|live\.com|microsoft|microsoftonline/.test(r.hostname)) return '';
    return r.origin + '/';
  } catch (e) { return ''; }
}
function send(name, data) {
  if (!statsAvailable() || !statsOn()) return;
  const ref = source();
  queue.push(p => {
    const o = { ...p, url: '/', title: 'MuscleMap', referrer: ref };
    if (name) { o.name = name; if (data) o.data = data; }
    return o;
  });
  boot(); flush();
}

/* ---------- ce qui est compté ---------- */
const dayKey = d => d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
function weekKey(d) {                          // semaine commençant le lundi
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
  return dayKey(m);
}

/* À chaque ouverture de l'app (une fois l'écran de connexion passé).
   ctx : { connexion: 'google' | 'onedrive' | 'sans-compte', installee: 'oui' | 'non', langue: 'fr' | 'en' } */
export function trackOpen(ctx) {
  if (!statsAvailable() || !statsOn()) return;
  const s = read(), now = new Date(), d = dayKey(now), w = weekKey(now);
  send();                                                    // une visite
  if (!s.device) { send('nouvel-appareil', ctx); s.device = d; }
  if (s.day !== d) { send('actif-jour', ctx); s.day = d; }
  if (s.week !== w) { send('actif-semaine', ctx); s.week = w; }
  write(s);
}
/* Une séance ajoutée (pas une modification) : seulement le mode de saisie, rien sur son contenu */
export const trackSession = saisie => send('seance', { saisie });
export const trackEvent = (name, data) => send(name, data);
