/* MuscleMap — rappels « Sauvegarde tes séances » en mode sans compte.
   Même calendrier que les rappels d'installation : J+1, J+3, J+7, J+14, J+21 après le choix
   « Utiliser sans compte », puis plus rien. Gardé sur l'appareil (pas synchronisé). */
import { t } from './i18n.js';
import { isLocal } from './sync.js';
import { tx } from './install.js';

const STEPS = [1, 3, 7, 14, 21];
const KEY = 'musclemap.backup.v1';
const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } };
const write = s => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* stockage indisponible */ } };
const dayStart = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
const elapsed = start => Math.round((dayStart(Date.now()) - start) / 864e5);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* point de départ : le choix « sans compte » (ou la première ouverture sans compte après cette mise à jour) */
export function startBackupReminders() {
  const s = read();
  if (!s.start) write({ ...s, start: dayStart(Date.now()), done: s.done || [] });
}
/* carte fermée ou fichier exporté : les paliers déjà passés sont « faits » */
export function backupSeen() {
  const s = read();
  const n = s.start ? elapsed(s.start) : 0;
  write({ ...s, done: [...new Set([...(s.done || []), ...STEPS.filter(d => d <= n)])] });
}
export function backupDue() {
  if (!isLocal()) return false;
  const s = read();
  if (!s.start) return false;
  const n = elapsed(s.start);
  return STEPS.some(d => d <= n && !(s.done || []).includes(d));
}

const CLOUD = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 18a4.5 4.5 0 0 1-.5-8.97A6 6 0 0 1 18 9.5a4 4 0 0 1-.5 8.5H7z"/><path d="M12 11v5M9.5 13.5 12 11l2.5 2.5"/></svg>';

/* carte de rappel de l'écran Carte */
export function backupCard() {
  if (!backupDue()) return '';
  return `<section class="card instcard bkcard" aria-labelledby="bk-h">
    <div class="ihead"><span class="bkico">${CLOUD}</span><div class="tmain"><b id="bk-h">${tx('bkTitle')}</b><span>${tx('bkCard')}</span></div>
      <button class="iconbtn" data-act="bkx" aria-label="${esc(t('close'))}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
    <div class="ibtns"><button class="btn small acc" data-act="login">${esc(t('bkConnect'))}</button><button class="btn small" data-act="bkexport">${esc(t('bkExport'))}</button></div>
  </section>`;
}
