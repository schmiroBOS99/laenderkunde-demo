// Auswertung nach einer Runde.
import { formatValue } from '../data/format.js';
import { el } from './dom.js';
import { icon } from './icons.js';
import { farbe } from './theme.js';

const fmt = new Intl.NumberFormat('de-DE');
const pct = new Intl.NumberFormat('de-DE', { style: 'percent', maximumFractionDigits: 0 });

// results: [{ iso3, key, gewusst }]; hooks: { onRepeat(session), onMenu() }
export function renderSummary(root, data, results, hooks) {
  const props = new Map(data.properties.map(p => [p.key, p]));
  const gewusst = results.filter(r => r.gewusst).length;
  const falsch = results.filter(r => !r.gewusst);

  // Nicht gewusste Paare als neue Sitzung gruppieren.
  const repeat = [];
  for (const r of falsch) {
    let s = repeat.find(x => x.iso3 === r.iso3);
    if (!s) repeat.push(s = { iso3: r.iso3, props: [] });
    s.props.push(r.key);
  }

  const liste = el('ul', { class: 'summary-list' }, ...falsch.map(r => {
    const c = data.countries[r.iso3];
    const p = props.get(r.key);
    return el('li', {}, el('strong', {}, `${c.name_de} – ${p.label}: `), formatValue(c, p) ?? '–');
  }));

  const quote = results.length ? gewusst / results.length : 0;
  const tileFarbe = quote >= 0.7 ? 'green' : quote >= 0.4 ? 'yellow' : 'coral';

  root.replaceChildren(el('section', { class: 'summary page-narrow' },
    el('h1', {}, 'Auswertung'),
    el('div', { class: 'summary-score', style: farbe(tileFarbe) },
      ...(results.length === 0
        ? [el('span', { class: 'score-text' }, 'Keine Karten beantwortet.')]
        : [el('span', { class: 'score-pct' }, pct.format(quote)),
           el('span', { class: 'score-text' }, `${fmt.format(gewusst)} von ${fmt.format(results.length)} gewusst`)])),
    ...(falsch.length ? [el('div', { class: 'panel' }, el('h2', {}, 'Nicht gewusst'), liste)] : []),
    el('div', { class: 'summary-actions' },
      ...(repeat.length ? [el('button', { type: 'button', class: 'btn btn-primary btn-big btn-block',
        onclick: () => hooks.onRepeat(repeat) }, icon('wiederholen'), 'Nicht Gewusstes wiederholen')] : []),
      el('button', { type: 'button', class: 'btn btn-block', onclick: hooks.onMenu }, 'Zur Startseite'))));
  window.scrollTo(0, 0);
}
