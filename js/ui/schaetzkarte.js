// Kompakte Vorderseite einer Schätzkarte: Eingabe + Einheit + Pfeil (Prüfen), eine Hinweiszeile, „Weiß nicht“.
// Wird für Werte (prop.schaetzen) und für Platzierungen (rangSchaetzen) genutzt.
import { parseZahl, pruefe, formatEingabe, toleranzKurz, toleranzText, rangSchaetzen } from '../data/schaetzen.js';
import { el } from './dom.js';
import { icon } from './icons.js';

const genau = new Intl.NumberFormat('de-DE', { maximumSignificantDigits: 6 });

// opt: { prop, s (Schätz-Konfiguration), wahr (in Eingabeeinheiten), einheit (Anzeige neben dem Feld),
//        hinweis (Bereich bzw. Platz 1), toleranz („Richtig bei …“), titel (Tooltip), vorschau?(x) → Text,
//        alsText(x) → Schätzung für die Rückseite, abwEinheit (Einheit der Abweichung) }
// onFertig(richtig, ergebnistext) nach Prüfen bzw. „Weiß nicht“.
export function schaetzFormular(opt, onFertig) {
  const { prop, s } = opt;
  const input = el('input', {
    type: 'text', inputMode: 'decimal', autocomplete: 'off', class: 'schaetz-input', placeholder: '?',
    'aria-label': `${prop.label}: ${opt.einheit}`,
  });
  const vorschau = el('div', { class: 'schaetz-vorschau' });

  input.addEventListener('input', () => {
    vorschau.classList.remove('fehler');
    const x = parseZahl(input.value);
    vorschau.textContent = opt.vorschau && Number.isFinite(x) ? opt.vorschau(x) : '';
  });

  const fertig = (richtig, text) => {
    form.querySelectorAll('input, button').forEach(e => { e.disabled = true; });
    onFertig(richtig, text);
  };

  const form = el('form', { class: 'card-face card-front schaetz-front', novalidate: true },
    el('div', { class: 'schaetz-titel' }, icon(prop.key), el('span', {}, prop.label)),
    el('div', { class: 'schaetz-zeile' },
      input,
      el('span', { class: 'schaetz-einheit' }, opt.einheit),
      el('button', { type: 'submit', class: 'schaetz-ok', 'aria-label': 'Prüfen', title: 'Prüfen (Enter)' }, icon('pfeil'))),
    vorschau,
    el('div', { class: 'schaetz-hinweis', title: opt.titel }, opt.hinweis),
    el('div', { class: 'schaetz-toleranz' }, opt.toleranz),
    el('button', { type: 'button', class: 'schaetz-weiss-nicht',
      onclick: () => fertig(false, 'Keine Schätzung abgegeben') }, 'Weiß nicht'));

  form.addEventListener('submit', e => {
    e.preventDefault();
    const x = parseZahl(input.value);
    if (!Number.isFinite(x)) {
      vorschau.textContent = 'Bitte eine Zahl eingeben.';
      vorschau.classList.add('fehler');
      input.focus();
      return;
    }
    const r = pruefe(s, opt.wahr, x);
    const vz = r.abweichung > 0 ? '+' : r.abweichung < 0 ? '−' : '±';
    const abs = Math.abs(r.abweichung);
    const einheit = typeof opt.abwEinheit === 'function' ? opt.abwEinheit(abs) : opt.abwEinheit;
    fertig(r.richtig, `Deine Schätzung: ${opt.alsText(x)} · Abweichung ${vz}${formatEingabe(abs)} ${einheit}`);
  });

  return { form, input };
}

// Wert schätzen (Feld "schaetzen"), z. B. Einwohner in Mio.
export function wertFormular(country, prop, bereich, onFertig) {
  const s = prop.schaetzen;
  return schaetzFormular({
    prop, s,
    wahr: country[prop.key] / s.faktor,
    einheit: s.einheit,
    hinweis: `Bereich ${bereich}`,
    toleranz: `Richtig bei ${toleranzKurz(s)}`,
    titel: `Wertebereich ${bereich}, richtig bei ${toleranzText(s)}`,
    alsText: x => `${formatEingabe(x)} ${s.einheit}`,
    abwEinheit: s.einheit,
    // Umrechnung in die normale Einheit, z. B. 0,00044 Tsd. km² → „= 0,44 km²“
    vorschau: s.faktor !== 1 ? x => `= ${genau.format(x * s.faktor)}${prop.einheit ? ' ' + prop.einheit : ''}` : null,
  }, onFertig);
}

// Platzierung schätzen, z. B. „Platz ? von 193“
export function rangFormular(prop, rang, onFertig) {
  const s = rangSchaetzen(rang.von);
  return schaetzFormular({
    prop, s,
    wahr: rang.platz,
    einheit: `von ${rang.von}`,
    hinweis: `Platz 1 = ${prop.platz1 || 'höchster Wert'}`,
    toleranz: `Richtig bei ±${s.absolut} Plätzen`,
    titel: `Platz 1 bis ${rang.von}, richtig bei ${toleranzText(s)}`,
    alsText: x => `Platz ${formatEingabe(x)}`,
    abwEinheit: n => (n === 1 ? 'Platz' : 'Plätze'),
  }, onFertig);
}
