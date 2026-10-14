// Einstellungen einer Lernrunde: Eigenschaften, Kontinente, UN-Filter, Lernstand, Länderanzahl.
import { loadSettings, saveSettings, selectedProps } from '../storage/settings.js';
import { loadProgress } from '../storage/progress.js';
import { loadVerlauf } from '../storage/verlauf.js';
import { availableCountries, pickSession } from '../data/select.js';
import { el } from './dom.js';
import { icon } from './icons.js';
import { farbe, propFarbe, gruppiert, STATUS, statusFarbe } from './theme.js';
import { zeigeAlleEigenschaften } from './info.js';

const KONTINENT_ORDNUNG = ['Afrika', 'Asien', 'Europa', 'Nordamerika', 'Südamerika', 'Ozeanien'];
const LERNSTAENDE = [...STATUS].reverse();   // Neu → Gelernt
const fmt = new Intl.NumberFormat('de-DE');

// Pille = verstecktes Eingabefeld + gestylter Text; item: { value, label, style, symbol? }
function pill(type, name, item, checked) {
  return el('label', { class: 'pill', style: item.style, title: item.title ?? '' },
    el('input', { type, name, value: item.value, checked }),
    el('span', { class: 'pill-body' }, ...(item.symbol ? [icon(item.symbol)] : []), item.label));
}

function pillGroup(title, name, items, selected, withAllNone) {
  const head = el('div', { class: 'panel-head' }, el('h2', {}, title));
  const box = el('fieldset', { class: 'panel' }, head);
  if (withAllNone) {
    const set = on => () => {
      box.querySelectorAll(`input[name="${name}"]`).forEach(i => { i.checked = on; });
      box.dispatchEvent(new Event('change', { bubbles: true }));
    };
    head.append(el('div', { class: 'panel-actions' },
      el('button', { type: 'button', class: 'link', onclick: set(true) }, 'Alle'),
      el('button', { type: 'button', class: 'link', onclick: set(false) }, 'Keine')));
  }
  box.append(el('div', { class: 'pills' },
    ...items.map(it => pill('checkbox', name, it, selected.includes(it.value)))));
  return box;
}

// Eigenschaften nach Gruppen; Klick auf den Gruppennamen wählt die ganze Gruppe an/ab.
function propPanel(properties, selected) {
  const box = pillGroup('Eigenschaften', 'eigenschaft', [], selected, true);
  box.querySelector('.pills').remove();
  box.querySelector('.panel-actions').prepend(el('button', {
    type: 'button', class: 'link', onclick: () => zeigeAlleEigenschaften(properties),
  }, 'Erklärungen'));
  gruppiert(properties).forEach(([gruppe, props]) => {
    const pills = el('div', { class: 'pills' }, ...props.map(p => pill('checkbox', 'eigenschaft',
      { value: p.key, label: p.label, style: propFarbe(p, properties.indexOf(p)), symbol: p.key, title: p.erklaerung },
      selected.includes(p.key))));
    const toggle = () => {
      const inputs = [...pills.querySelectorAll('input')];
      const an = !inputs.every(i => i.checked);
      inputs.forEach(i => { i.checked = an; });
      box.dispatchEvent(new Event('change', { bubbles: true }));
    };
    box.append(el('div', { class: 'prop-group' },
      el('button', { type: 'button', class: 'group-toggle', onclick: toggle, title: 'Gruppe an-/abwählen' }, gruppe),
      pills));
  });
  return box;
}

const checked = (form, name) =>
  [...form.querySelectorAll(`input[name="${name}"]:checked`)].map(i => i.value);

// Sitzung direkt aus den gespeicherten Einstellungen (Schnellstart), optional mit Abweichungen.
// Liefert { session, kontinente }.
export function sessionFromSettings(data, overrides = {}) {
  const s = { ...loadSettings(), ...overrides };
  s.eigenschaften = selectedProps(s, data.properties.map(p => p.key));
  s.kontinente ??= KONTINENT_ORDNUNG;
  return {
    session: pickSession(availableCountries(data, s, loadProgress()), s.anzahl, loadVerlauf()),
    kontinente: s.kontinente,
  };
}

// hooks: { onStart(session, kontinente) }
export function renderMenu(root, data, hooks) {
  const s = loadSettings();
  const progress = loadProgress();
  const kontinente = KONTINENT_ORDNUNG.filter(k =>
    Object.values(data.countries).some(c => c.kontinent === k));
  const alleProps = data.properties.map(p => p.key);

  const form = el('form', { class: 'menu page-narrow' },
    el('h1', {}, 'Lernrunde einstellen'),
    propPanel(data.properties, selectedProps(s, alleProps)),
    pillGroup('Kontinente', 'kontinent',
      kontinente.map(k => ({ value: k, label: k, style: farbe('teal') })),
      s.kontinente ?? kontinente, true),
    el('fieldset', { class: 'panel' },
      el('div', { class: 'panel-head' }, el('h2', {}, 'Länder')),
      el('div', { class: 'pills' },
        pill('radio', 'un', { value: 'un', label: 'Nur UN-Mitglieder', style: farbe('orange') }, s.nurUN),
        pill('radio', 'un', { value: 'alle', label: 'Alle (inkl. Beobachter und sonstige)', style: farbe('orange') }, !s.nurUN))),
    pillGroup('Lernstand', 'lernstand',
      LERNSTAENDE.map(([value, label]) => ({ value, label, style: statusFarbe(value) })), s.lernstand, false),
    el('fieldset', { class: 'panel' },
      el('div', { class: 'panel-head' },
        el('h2', {}, 'Anzahl Länder'),
        el('output', { class: 'anzahl-anzeige' })),
      el('input', { type: 'range', name: 'anzahl', min: 1, step: 1 })),
    el('button', { type: 'submit', class: 'btn btn-primary btn-big btn-block start' }, 'Los geht’s'));

  const slider = form.querySelector('input[name="anzahl"]');
  const anzeige = form.querySelector('output');
  const start = form.querySelector('.start');
  let wunsch = s.anzahl;   // gewünschte Anzahl, bleibt erhalten wenn verfügbare Zahl schwankt
  let available = [];

  const read = () => ({
    eigenschaften: checked(form, 'eigenschaft'),
    bekannt: alleProps,
    kontinente: checked(form, 'kontinent'),
    nurUN: form.querySelector('input[name="un"]:checked').value === 'un',
    lernstand: checked(form, 'lernstand'),
    anzahl: wunsch,
  });

  function update() {
    const settings = read();
    available = availableCountries(data, settings, progress);
    const max = available.length;
    slider.max = Math.max(max, 1);
    slider.value = Math.min(wunsch, max);
    slider.disabled = max === 0;
    start.disabled = max === 0;
    anzeige.value = max === 0
      ? 'Keine Länder passen zur Auswahl'
      : `${fmt.format(Number(slider.value))} von ${fmt.format(max)}`;
    saveSettings(settings);
  }

  slider.addEventListener('input', () => { wunsch = Number(slider.value); update(); });
  form.addEventListener('change', update);
  form.addEventListener('submit', e => {
    e.preventDefault();
    hooks.onStart(pickSession(available, Number(slider.value), loadVerlauf()), checked(form, 'kontinent'));
  });

  root.replaceChildren(form);
  update();
}
