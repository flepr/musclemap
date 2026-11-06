/* MuscleMap — installer l'app sur l'écran d'accueil (même méthode que Λεξούλα).
   Suggéré, jamais imposé : 4e étape de l'onboarding, carte de rappel sur la Carte
   à J+1, J+3, J+7, J+14 et J+21 (puis plus rien), instructions toujours dans Réglages.
   Ce module ne fait que du texte HTML et l'état des rappels ; les clics sont gérés par app.js. */
import { t, lang } from './i18n.js';
import { isLocal } from './sync.js';

const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- appareil ---------- */
const UA = navigator.userAgent || '';
export const isIOS = () => /iPhone|iPad|iPod/.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const isAndroid = () => /Android/i.test(UA);
export const isStandalone = () =>
  !!(window.matchMedia && (matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches)) || navigator.standalone === true;
/* navigateurs intégrés aux applis (Instagram, Messenger, LinkedIn…) : on ne peut pas y installer */
export const inAppBrowser = () => /Instagram|FBAN|FBAV|FB_IAB|FBIOS|Messenger|LinkedInApp|Snapchat|Line\/|MicroMessenger|TikTok|musical_ly/i.test(UA);
export const platform = () => (isIOS() ? 'ios' : isAndroid() ? 'android' : 'desktop');
export const appUrl = () => location.origin + location.pathname;

/* ---------- Android et ordinateur (Chrome, Edge) : installation en un geste ---------- */
let deferred = null;
let changed = () => {};
export function onInstallChange(fn) { changed = fn; }
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; changed(); });
window.addEventListener('appinstalled', () => { deferred = null; stopReminders(); changed(); });
export const canPrompt = () => !!deferred;
export async function promptInstall() {
  if (!deferred) return false;
  const d = deferred; deferred = null;
  d.prompt();
  const { outcome } = await d.userChoice.catch(() => ({}));
  if (outcome === 'accepted') { stopReminders(); return true; }
  return false;
}

/* ---------- calendrier des rappels (gardé sur l'appareil, pas synchronisé) ---------- */
const STEPS = [1, 3, 7, 14, 21];
const KEY = 'musclemap.install.v1';
const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } };
const write = s => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* stockage indisponible */ } };
const dayStart = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
const elapsed = start => Math.round((dayStart(Date.now()) - start) / 864e5);

/* point de départ : la fin de l'onboarding, ou la première ouverture après cette mise à jour */
export function startReminders() {
  const s = read();
  if (!s.start) write({ ...s, start: dayStart(Date.now()), done: s.done || [] });
}
export function stopReminders() { write({ ...read(), stop: true }); }
/* carte vue ou fermée : les paliers déjà passés sont « faits » (une seule carte même si on a sauté des jours) */
export function markSeen() {
  const s = read();
  const n = s.start ? elapsed(s.start) : 0;
  write({ ...s, done: [...new Set([...(s.done || []), ...STEPS.filter(d => d <= n)])] });
}
export function cardDue() {
  if (isStandalone()) return false;
  const s = read();
  if (!s.start || s.stop) return false;
  const n = elapsed(s.start);
  return STEPS.some(d => d <= n && !(s.done || []).includes(d));
}

/* ---------- textes ---------- */
const ICON_SHARE = '<svg class="ico" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5"/><path d="M8 10H6a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1h-2"/></svg>';
const ICON_MORE = '<svg class="ico" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>';
const ICON_DOTS = '<svg class="ico" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>';
/* typographie française : espaces insécables avant « : ; ? ! » et dans les guillemets */
const nb = s => lang() !== 'fr' ? s : s.replace(/« /g, '« ').replace(/ »/g, ' »').replace(/ ([:;?!])/g, ' $1');
export const tx = (key, vars) => esc(nb(t(key, vars)));
const withIcons = key => tx(key).replace('{share}', ICON_SHARE).replace('{more}', ICON_MORE).replace('{dots}', ICON_DOTS);
const steps = items => `<ol class="isteps">${items.map(x => `<li>${x}</li>`).join('')}</ol>`;

function iosPane() {
  return steps([withIcons('instIos1'), tx('instIos2'), tx('instIos3'), tx(isLocal() ? 'instIos4Local' : 'instIos4')]);
}
function androidPane() {
  return `${deferred && isAndroid() ? `<button class="btn" data-act="instnow">${esc(t('instButton'))}</button><p class="note">${tx('instAndOr')}</p>` : ''}
    ${steps([withIcons('instAnd1'), tx('instAnd2'), tx('instAnd3')])}
    <p class="note">${tx('instAndOther')}</p>`;
}
function desktopPane() {
  return `<p class="itxt">${tx('instDesk')}</p>
    <div class="ilink"><code>${esc(appUrl().replace(/^https?:\/\//, ''))}</code><button class="btn small" data-act="instcopy">${esc(t('instCopy'))}</button></div>
    ${deferred && !isAndroid() ? `<p class="note">${tx('instDeskHere')}</p><div><button class="btn small" data-act="instnow">${esc(t('instButton'))}</button></div>` : ''}`;
}

/* guide complet : avertissement « navigateur d'une appli », onglets iPhone / Android / Ordinateur,
   ouvert sur l'appareil détecté. `sel` = onglet choisi par l'utilisateur (sinon détection). */
export function guideHTML(sel) {
  const p = sel || platform();
  const tabs = [['ios', 'iPhone'], ['android', 'Android'], ['desktop', t('instTabDesktop')]];
  return `${inAppBrowser() ? `<div class="inotice"><span>${tx('instInapp')}</span><div><button class="btn small" data-act="instcopy">${esc(t('instCopy'))}</button></div></div>` : ''}
    <div class="seg c3" role="radiogroup" aria-label="${esc(t('instDevice'))}">${tabs.map(([k, l]) => `<button role="radio" aria-checked="${k === p}" data-act="insttab" data-v="${k}">${esc(l)}</button>`).join('')}</div>
    <div class="ipane">${p === 'ios' ? iosPane() : p === 'android' ? androidPane() : desktopPane()}</div>`;
}

/* carte de rappel de l'écran Carte */
export function installCard() {
  if (!cardDue()) return '';
  return `<section class="card instcard" aria-labelledby="inst-h">
    <div class="ihead"><img src="icon-192.png" alt="" width="48" height="48"><div class="tmain"><b id="inst-h">${tx('instTitle')}</b><span>${tx('instCard')}</span></div>
      <button class="iconbtn" data-act="instx" aria-label="${esc(t('close'))}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
    <div class="ibtns"><button class="btn small acc" data-act="instopen" data-from="card">${esc(t('instHow'))}</button><button class="btn small" data-act="instalready">${esc(t('instAlready'))}</button></div>
  </section>`;
}
