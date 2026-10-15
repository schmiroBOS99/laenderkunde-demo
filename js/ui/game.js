// Spielansicht: pro Land Flagge + Name und Flip-Karten je Eigenschaft.
import { formatValue } from '../data/format.js';
import { getRank, formatRank } from '../data/rank.js';
import { el } from './dom.js';
import { icon } from './icons.js';
import { propFarbe } from './theme.js';
import { renderSummary } from './summary.js';
import { infoButton } from './info.js';
import { wertFormular, rangFormular } from './schaetzkarte.js';
import { bereichText, RANG_SCHAETZEN } from '../data/schaetzen.js';

const fmt = new Intl.NumberFormat('de-DE');

export function flag(country) {
  const img = el('img', {
    class: 'flag',
    src: `assets/flags/${country.iso2.toLowerCase()}.svg`,
    alt: `Flagge ${country.name_de}`,
  });
  img.onerror = () => img.replaceWith(el('div', { class: 'flag flag-fallback' }, country.iso2));
  return img;
}

// Vergleichsgruppe für den Rang: alle Länder oder nur die der gewählten Kontinente.
function rankScope(data, kontinente) {
  const alle = new Set(Object.values(data.countries).map(c => c.kontinent));
  if (!kontinente || kontinente.length === 0 || [...alle].every(k => kontinente.includes(k))) {
    return { key: 'welt', countries: data.countries, suffix: '' };
  }
  const countries = Object.fromEntries(Object.entries(data.countries)
    .filter(([, c]) => kontinente.includes(c.kontinent)));
  const suffix = kontinente.length === 1 ? ` in ${kontinente[0]}` : ' in der Auswahl';
  return { key: [...kontinente].sort().join(','), countries, suffix };
}

// Eine Karte. Alle Karten sind gleich groß; die Wertung (✓/✗) sitzt unten auf der Rückseite.
// modus "wert": Zahlen mit "schaetzen" als Wert-Schätzung, sonst Umdrehen.
// modus "platz": alle Zahlen (auch Erhebung, Fluss) als Platz-Schätzung, Texte zum Umdrehen.
// onAnswer(gewusst, korrektur): korrektur = true, wenn eine Wertung geändert wird.
function card(country, prop, index, scope, alle, modus, onAnswer) {
  const rank = getRank(scope.countries, prop, country.iso3, scope.key);
  const wert = formatValue(country, prop) ?? '–';
  const ergebnis = el('div', { class: 'card-schaetzung' });

  let antwort = null;
  const answer = gewusst => {
    if (antwort === gewusst) return;
    const korrektur = antwort !== null;
    antwort = gewusst;
    box.classList.add('answered');
    box.classList.toggle('is-gewusst', gewusst);
    box.classList.toggle('is-nicht-gewusst', !gewusst);
    onAnswer(gewusst, korrektur);
  };
  const wertung = el('div', { class: 'card-wertung' },
    el('button', { type: 'button', class: 'btn btn-ok btn-gewusst', 'aria-label': 'Gewusst', onclick: () => answer(true) },
      icon('ja'), el('span', {}, 'Gewusst')),
    el('button', { type: 'button', class: 'btn btn-bad btn-nicht', 'aria-label': 'Nicht gewusst', onclick: () => answer(false) },
      icon('nein'), el('span', {}, 'Nicht gewusst')));

  const back = el('div', { class: 'card-face card-back' },
    el('div', { class: 'card-label' }, icon(prop.key), prop.label),
    el('div', { class: wert.length > 24 ? 'card-value long' : 'card-value' }, wert),
    ergebnis,
    ...(rank ? [el('div', { class: 'card-rank', title: prop.platz1 ? `Platz 1 = ${prop.platz1}` : '' },
      formatRank(rank) + scope.suffix)] : []),
    wertung);

  const fertig = (richtig, text) => {
    ergebnis.textContent = text;
    box.classList.add('flipped');
    answer(richtig);
  };
  let formular = null;
  if (modus === 'platz' && rank) formular = rangFormular(prop, rank, RANG_SCHAETZEN, fertig);
  else if (modus !== 'platz' && prop.schaetzen) formular = wertFormular(country, prop, bereichText(alle, prop, '–'), fertig);

  let front;
  if (formular) {
    front = formular.form;
  } else {
    front = el('button', { type: 'button', class: 'card-face card-front', 'aria-label': `${prop.label} aufdecken`,
      onclick: () => box.classList.add('flipped') },
      el('span', { class: 'card-icon' }, icon(prop.key)),
      el('div', { class: 'card-label' }, prop.label));
    // Rückseite antippen dreht zurück (außer auf den Wertungsknöpfen)
    back.addEventListener('click', e => { if (!e.target.closest('button')) box.classList.remove('flipped'); });
  }

  // Info-Knopf liegt über der Karte, nicht in einem anderen Knopf (verschachtelte Buttons sind ungültig).
  const box = el('div', { class: 'card', style: propFarbe(prop, index) },
    el('div', { class: 'card-inner' }, front, back),
    infoButton(prop, index));
  box.eingabe = formular?.input ?? null;
  return box;
}

// session: [{ iso3, props: [key] }]
// hooks: { onAnswer(iso3, key, gewusst), onRevise(iso3, key, gewusst), onMenu() }
// kontinente: Kontinentfilter der Runde (Rang nur innerhalb dieser Kontinente), null = Welt
// modus: "wert" (Werte schätzen) | "platz" (Platzierung schätzen)
export function renderGame(root, data, session, hooks, kontinente = null, modus = 'wert') {
  const props = new Map(data.properties.map(p => [p.key, p]));
  const indices = new Map(data.properties.map((p, idx) => [p.key, idx]));
  const scope = rankScope(data, kontinente);
  const total = session.reduce((n, s) => n + s.props.length, 0);
  const results = [];
  let i = 0;

  const finish = () => renderSummary(root, data, results, {
    onRepeat: s => renderGame(root, data, s, hooks, kontinente, modus),
    onMenu: hooks.onMenu,
  });

  function show() {
    const { iso3, props: keys } = session[i];
    const country = data.countries[iso3];
    let offen = keys.length;

    const bar = el('div', { class: 'progress-bar' }, el('div', { class: 'progress-fill' }));
    const setBar = () => {
      bar.firstChild.style.width = `${(results.length / total) * 100}%`;
    };
    const weiter = el('button', {
      type: 'button', class: 'btn btn-primary btn-big btn-block weiter', disabled: true,
      onclick: () => { i += 1; i < session.length ? show() : finish(); },
    }, i + 1 < session.length ? 'Weiter' : 'Auswertung');

    // Nach einer Schätzung springt der Fokus ins nächste offene Eingabefeld (flüssig per Tastatur).
    const naechsteEingabe = () => cards.find(c => c.eingabe && !c.eingabe.disabled)?.eingabe;

    const cards = keys.map(key => card(country, props.get(key), indices.get(key), scope, data.countries, modus,
      (gewusst, korrektur) => {
        if (korrektur) {
          results.find(r => r.iso3 === iso3 && r.key === key).gewusst = gewusst;
          hooks.onRevise?.(iso3, key, gewusst);
          return;
        }
        results.push({ iso3, key, gewusst });
        hooks.onAnswer?.(iso3, key, gewusst);
        setBar();
        offen -= 1;
        if (offen === 0) weiter.disabled = false;
        (naechsteEingabe() ?? (offen === 0 ? weiter : null))?.focus({ preventScroll: true });
      }));

    root.replaceChildren(el('section', { class: 'game page-narrow' },
      el('header', { class: 'game-head' },
        el('span', {}, `Land ${fmt.format(i + 1)} von ${fmt.format(session.length)}`),
        el('button', { type: 'button', class: 'link', onclick: finish }, 'Beenden')),
      bar,
      el('div', { class: 'country' }, flag(country), el('h2', {}, country.name_de)),
      el('div', { class: 'cards' }, ...cards),
      weiter));
    setBar();
    window.scrollTo(0, 0);
    naechsteEingabe()?.focus({ preventScroll: true });
  }

  show();
}
