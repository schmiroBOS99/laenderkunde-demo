// Dialoge: Erklärung einer Eigenschaft, alle Erklärungen, kurze App-Anleitung.
import { el } from './dom.js';
import { icon } from './icons.js';
import { propFarbe, gruppiert, STATUS } from './theme.js';
import { GELERNT_AB } from '../storage/progress.js';
import { bereichText, wertebereich, toleranzText, RANG_SCHAETZEN } from '../data/schaetzen.js';

// Daten für Wertebereiche; wird einmal beim Start gesetzt.
let daten = null;
export function setzeDaten(d) { daten = d; }

// "0,00044 bis 17.100 Tsd. km² (Vatikanstadt bis Russland)"
export function bereichMitLaendern(prop) {
  if (!daten || prop.typ !== 'zahl') return '';
  const b = wertebereich(daten.countries, prop);
  return b ? `${bereichText(daten.countries, prop)} (${b.minLand} bis ${b.maxLand})` : '';
}

function oeffne(titel, ...inhalt) {
  const dlg = el('dialog', { class: 'dialog' },
    el('div', { class: 'dialog-head' },
      el('h2', {}, ...titel),
      el('button', { type: 'button', class: 'info-btn dialog-close', 'aria-label': 'Schließen',
        onclick: () => dlg.close() }, '×')),
    el('div', { class: 'dialog-body' }, ...inhalt));
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });   // Klick auf Hintergrund
  dlg.addEventListener('close', () => dlg.remove());
  document.body.append(dlg);
  dlg.showModal();
}

export function zeigeEigenschaft(prop, index = 0) {
  const fakten = [
    ['Wertebereich', bereichMitLaendern(prop)],
    ['Schätzung richtig bei', prop.schaetzen && toleranzText(prop.schaetzen)],
    ['Platzierung richtig bei', prop.typ === 'zahl' && toleranzText(RANG_SCHAETZEN)],
    ['Platz 1', prop.platz1],
    ['Einheit', prop.einheit],
    ['Quelle', prop.quelle],
    ['Datenstand', prop.datenjahr],
  ].filter(([, v]) => v);
  oeffne([el('span', { style: propFarbe(prop, index), class: 'erkl-icon' }, icon(prop.key)), prop.label],
    el('p', {}, prop.erklaerung ?? 'Keine Erklärung vorhanden.'),
    el('dl', { class: 'fakten' }, ...fakten.flatMap(([k, v]) => [el('dt', {}, k), el('dd', {}, String(v))])));
}

// Kleiner (i)-Knopf, öffnet die Erklärung; stoppt den Klick, damit z. B. Karten nicht umdrehen.
export function infoButton(prop, index = 0) {
  return el('button', {
    type: 'button',
    class: 'info-btn',
    title: prop.erklaerung ?? '',
    'aria-label': `Erklärung: ${prop.label}`,
    onclick: e => { e.stopPropagation(); e.preventDefault(); zeigeEigenschaft(prop, index); },
  }, icon('info'));
}

export function zeigeAlleEigenschaften(properties) {
  oeffne(['Was bedeuten die Kategorien?'],
    ...gruppiert(properties).flatMap(([gruppe, props]) => [
      el('h3', {}, gruppe),
      el('ul', { class: 'erkl-liste' }, ...props.map(p =>
        el('li', { style: propFarbe(p, properties.indexOf(p)) },
          icon(p.key),
          el('div', {}, el('strong', {}, p.label), el('br'), p.erklaerung ?? '',
            ...(bereichMitLaendern(p) ? [el('br'), el('small', { class: 'erkl-bereich' },
              `Bereich: ${bereichMitLaendern(p)}`)] : [])))))]));
}

export function zeigeAppInfo() {
  const stufe = {
    neu: 'noch nie abgefragt',
    nicht_gewusst: 'zuletzt nicht gewusst',
    gewusst: 'zuletzt gewusst',
    gelernt: `${GELERNT_AB}-mal hintereinander gewusst – eine falsche Antwort setzt die Serie zurück`,
  };
  oeffne(['So funktioniert die App'],
    el('p', {}, 'Lerne Zahlen und Fakten zu allen Ländern der Welt mit Karteikarten.'),
    el('h3', {}, 'Lernen'),
    el('ul', {},
      el('li', {}, 'Unter „Lernen“ wählst du Kategorien, Kontinente, Lernstand und Anzahl der Länder.'),
      el('li', {}, 'Zu jedem Land erscheint pro Kategorie eine Karte. Bei Zahlen gibst du eine Schätzung ein: Liegt sie innerhalb der Toleranz (steht auf der Karte), zählt sie als gewusst. Bei Texten (Hauptstadt, Berg, Fluss, Sprache, Religion) überlegst du die Antwort, drehst die Karte um und markierst ehrlich „Gewusst“ oder „Nicht gewusst“. Die Wertung lässt sich nachträglich ändern.'),
      el('li', {}, 'Unter „Abfrage“ kannst du statt der Werte die Platzierung schätzen (z. B. „Platz ? von 193“). Das gilt für alle Zahlen, auch für Erhebung und Fluss. Richtig bei ±10 % des wahren Platzes, mindestens ±2 Plätze.'),
      el('li', {}, '„Schnellstart“ startet mit den zuletzt gewählten Einstellungen, „Fehler üben“ nur mit nicht gewussten Karten.'),
      el('li', {}, 'Der Rang zeigt die Position unter allen Ländern, mit Kontinentfilter nur innerhalb der gewählten Kontinente. Platz 1 ist der höchste Wert, bei der FIFA-Weltrangliste das beste Team.')),
    el('h3', {}, 'Lernstand'),
    el('ul', {}, ...STATUS.map(([k, label]) => el('li', {},
      el('span', { class: `legende-status s-${k}` }), el('strong', {}, label), `: ${stufe[k]}`))),
    el('h3', {}, 'Weltkarte'),
    el('p', {}, 'Zeigt für eine Kategorie, welche Länder du schon kannst. Fahre über ein Land (oder tippe darauf) für Wert und Rang; zoomen mit Mausrad oder zwei Fingern.'),
    el('h3', {}, 'Speicherung'),
    el('p', {}, 'Dein Lernstand liegt nur in diesem Browser. Unter „Lernstand“ kannst du ihn exportieren und in einem anderen Browser importieren.'),
    el('h3', {}, 'Daten'),
    el('p', {}, 'Quellen u. a. Weltbank, Our World in Data, Wikidata, UNESCO, CIA World Factbook und FIFA. Über das ⓘ an jeder Kategorie siehst du Erklärung, Quelle und Datenstand.'));
}
