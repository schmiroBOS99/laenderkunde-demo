// Vorderseite einer Schätzkarte: Zahl eingeben (in der Eingabeeinheit), prüfen oder „Weiß nicht“.
import { parseZahl, pruefe, formatEingabe, toleranzText, bereichText } from '../data/schaetzen.js';
import { el } from './dom.js';
import { icon } from './icons.js';

const genau = new Intl.NumberFormat('de-DE', { maximumSignificantDigits: 6 });

// onFertig(richtig, ergebnistext) wird nach Prüfen bzw. „Weiß nicht“ aufgerufen.
export function schaetzFormular(country, prop, countries, onFertig) {
  const s = prop.schaetzen;
  const input = el('input', {
    type: 'text', inputMode: 'decimal', autocomplete: 'off', class: 'schaetz-input', placeholder: '?',
    'aria-label': `${prop.label} schätzen in ${s.einheit}`,
  });
  // Umrechnung in die normale Einheit, z. B. 0,00044 Tsd. km² → „= 0,44 km²“
  const vorschau = el('div', { class: 'schaetz-vorschau' });
  const meldung = el('div', { class: 'schaetz-meldung' });

  input.addEventListener('input', () => {
    meldung.textContent = '';
    const x = parseZahl(input.value);
    vorschau.textContent = s.faktor !== 1 && Number.isFinite(x)
      ? `= ${genau.format(x * s.faktor)}${prop.einheit ? ' ' + prop.einheit : ''}` : '';
  });

  const fertig = (richtig, text) => {
    input.disabled = true;
    form.querySelectorAll('button').forEach(b => { b.disabled = true; });
    onFertig(richtig, text);
  };

  const form = el('form', { class: 'card-face card-front schaetz-front', novalidate: true },
    el('div', { class: 'schaetz-titel' }, icon(prop.key), prop.label),
    el('div', { class: 'schaetz-zeile' }, input, el('span', { class: 'schaetz-einheit' }, s.einheit)),
    vorschau,
    meldung,
    el('div', { class: 'schaetz-hinweis' },
      `Bereich ${bereichText(countries, prop)}`, el('br'), `Richtig bei ${toleranzText(prop)}`),
    el('div', { class: 'schaetz-knoepfe' },
      el('button', { type: 'submit', class: 'btn btn-primary' }, 'Prüfen'),
      el('button', { type: 'button', class: 'btn', onclick: () => fertig(false, 'Keine Schätzung abgegeben') },
        'Weiß nicht')));

  form.addEventListener('submit', e => {
    e.preventDefault();
    const x = parseZahl(input.value);
    if (!Number.isFinite(x)) {
      meldung.textContent = 'Bitte eine Zahl eingeben.';
      input.focus();
      return;
    }
    const r = pruefe(prop, country[prop.key], x);
    const vz = r.abweichung > 0 ? '+' : r.abweichung < 0 ? '−' : '±';
    fertig(r.richtig,
      `Deine Schätzung: ${formatEingabe(x)} ${s.einheit} · Abweichung ${vz}${formatEingabe(Math.abs(r.abweichung))} ${s.einheit}`);
  });

  return { form, input };
}
