// Einstieg: Daten laden, Seiten über den URL-Hash wechseln (#/, #/lernen, #/karte, #/lernstand).
import { loadData } from './data/load.js';
import { renderHome } from './ui/home.js';
import { renderMenu, sessionFromSettings } from './ui/menu.js';
import { renderGame } from './ui/game.js';
import { renderMap } from './ui/map.js';
import { renderProgressPage } from './ui/progress-panel.js';
import { recordAnswer, reviseAnswer } from './storage/progress.js';
import { el } from './ui/dom.js';
import { icon } from './ui/icons.js';
import { zeigeAppInfo, setzeDaten } from './ui/info.js';
import { merkeVerlauf } from './storage/verlauf.js';

const root = document.getElementById('app');
const nav = document.getElementById('nav');

const SEITEN = [
  ['#/lernen', 'Lernen', 'karten'],
  ['#/karte', 'Weltkarte', 'globus'],
  ['#/lernstand', 'Lernstand', 'diagramm'],
];

nav.replaceChildren(
  ...SEITEN.map(([href, text, symbol]) => el('a', { href }, icon(symbol), el('span', {}, text))),
  el('button', { type: 'button', class: 'nav-info', onclick: zeigeAppInfo, 'aria-label': 'Info zur App' },
    icon('info'), el('span', {}, 'Info')));

async function init() {
  const data = await loadData();
  setzeDaten(data);

  const play = (session, kontinente, modus) => {
    if (session.length === 0) return alert('Keine passenden Karten gefunden.');
    merkeVerlauf(session.map(s => s.iso3));
    renderGame(root, data, session,
      { onAnswer: recordAnswer, onRevise: reviseAnswer, onMenu: () => go('#/') }, kontinente, modus);
  };
  const playSettings = overrides => {
    const { session, kontinente, modus } = sessionFromSettings(data, overrides);
    play(session, kontinente, modus);
  };

  const routes = {
    '#/': () => renderHome(root, data, {
      onQuick: () => playSettings(),
      onRepeat: () => playSettings({ lernstand: ['nicht_gewusst'] }),
    }),
    '#/lernen': () => renderMenu(root, data, { onStart: play }),
    '#/karte': () => renderMap(root, data).catch(err => {
      root.textContent = 'Karte konnte nicht geladen werden.';
      console.error(err);
    }),
    '#/lernstand': () => renderProgressPage(root, data, render),
  };

  function render() {
    const hash = routes[location.hash] ? location.hash : '#/';
    nav.querySelectorAll('a').forEach(a =>
      a.toggleAttribute('aria-current', a.getAttribute('href') === hash));
    nav.querySelector('[aria-current]')?.setAttribute('aria-current', 'page');
    routes[hash]();
    window.scrollTo(0, 0);
  }

  // Gleicher Hash (z. B. aus dem Spiel zurück auf "Lernen") löst kein hashchange aus.
  function go(hash) {
    if (location.hash === hash) render();
    else location.hash = hash;
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#/"]');
    if (a && a.getAttribute('href') === location.hash) { e.preventDefault(); render(); }
  });

  window.addEventListener('hashchange', render);
  render();
}

init().catch(err => {
  root.textContent = 'Daten konnten nicht geladen werden.';
  console.error(err);
});
