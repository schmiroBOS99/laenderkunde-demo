// Startseite: große Kacheln für Lernen, Weltkarte und Lernstand.
import { loadProgress, statusOf } from '../storage/progress.js';
import { el } from './dom.js';
import { icon } from './icons.js';
import { farbe } from './theme.js';

const fmt = new Intl.NumberFormat('de-DE');

function tile(titel, symbol, farbname, href, ...unterknoepfe) {
  return el('div', { class: 'tile-group', style: farbe(farbname) },
    el('a', { class: 'tile', href },
      el('span', { class: 'tile-icon' }, icon(symbol)),
      el('span', { class: 'tile-title' }, titel)),
    ...(unterknoepfe.length ? [el('div', { class: 'tile-subs' }, ...unterknoepfe)] : []));
}

const sub = (text, symbol, onclick, disabled = false) =>
  el('button', { type: 'button', class: 'btn', onclick, disabled }, icon(symbol), text);

// hooks: { onQuick(), onRepeat() }
export function renderHome(root, data, hooks) {
  const progress = loadProgress();
  let gesamt = 0;
  let gelernt = 0;
  let gewusst = 0;
  let falsch = 0;
  for (const c of Object.values(data.countries)) {
    for (const p of data.properties) {
      if (c[p.key] === null || c[p.key] === undefined) continue;
      gesamt += 1;
      const s = statusOf(progress, c.iso3, p.key);
      if (s === 'gelernt') gelernt += 1;
      if (s === 'gewusst') gewusst += 1;
      if (s === 'nicht_gewusst') falsch += 1;
    }
  }

  root.replaceChildren(el('section', { class: 'home' },
    el('div', { class: 'home-head' },
      el('h1', {}, 'Was lernen wir heute?'),
      el('div', { class: 'home-stat' },
        el('span', {}, 'Karten gelernt'),
        el('strong', {}, `${fmt.format(gelernt)} / ${fmt.format(gesamt)}`),
        el('span', {}, `dazu ${fmt.format(gewusst)} gewusst`))),
    el('div', { class: 'tiles' },
      tile('Lernen', 'karten', 'blue', '#/lernen',
        sub('Schnellstart', 'zufall', hooks.onQuick),
        sub('Fehler üben', 'wiederholen', hooks.onRepeat, falsch === 0)),
      tile('Weltkarte', 'globus', 'green', '#/karte'),
      tile('Lernstand', 'diagramm', 'purple', '#/lernstand'))));
}
