// Weltkarte: Färbung nach Lernstand für eine Eigenschaft, Tooltip, Zoom, Kleinstaaten als Punkte.
// Nutzt die globalen Bibliotheken d3 und topojson aus lib/.
import { loadAtlas } from '../data/load.js';
import { formatValue } from '../data/format.js';
import { getRank, formatRank } from '../data/rank.js';
import { loadProgress, statusOf } from '../storage/progress.js';
import { el } from './dom.js';
import { gruppiert, STATUS } from './theme.js';
import { infoButton, bereichMitLaendern } from './info.js';

const W = 960;
const H = 500;
const KLEIN = 8;   // Fläche in px² (bei Zoom 1), unter der ein Land zusätzlich als Punkt erscheint
// Länder ohne ISO-Nummer in world-atlas, Zuordnung über den englischen Namen.
const NAME_FALLBACK = { XKX: 'Kosovo' };
// Länder, die in world-atlas fehlen, als Punkt-Feature (id = isonum).
const ZUSATZ = [
  { type: 'Feature', id: '798', properties: { name: 'Tuvalu' }, geometry: { type: 'Point', coordinates: [179.2, -8.5] } },
];

const KLASSEN = [
  ...STATUS,
  ['kein_wert', 'Kein Wert'],
  ['keine_daten', 'Nicht in den Daten'],
];
const STATUS_TEXT = Object.fromEntries(KLASSEN);
const fmt = new Intl.NumberFormat('de-DE');

function featureIndex(countries, features) {
  // Eine ID kann mehrere Features haben (036 = Australien + Ashmore- und Cartierinseln).
  const byId = d3.group(features.filter(f => f.id), f => f.id);
  const byName = d3.group(features, f => f.properties.name);
  const index = new Map();   // Feature → Land
  for (const c of Object.values(countries)) {
    const fs = byId.get(c.isonum) ?? byName.get(NAME_FALLBACK[c.iso3]) ?? [];
    for (const f of fs) index.set(f, c);
  }
  return index;
}

const hasValue = (c, key) => c[key] !== null && c[key] !== undefined && c[key] !== '';

function klasse(c, prop, progress) {
  if (!c) return 'keine_daten';
  if (!hasValue(c, prop.key)) return 'kein_wert';
  return statusOf(progress, c.iso3, prop.key);
}

export async function renderMap(root, data) {
  root.replaceChildren(el('p', {}, 'Lade Karte …'));
  const features = [...await loadAtlas(), ...ZUSATZ];
  const index = featureIndex(data.countries, features);
  const progress = loadProgress();

  const projection = d3.geoNaturalEarth1().fitSize([W, H], { type: 'FeatureCollection', features });
  const path = d3.geoPath(projection);

  const select = el('select', { class: 'map-select', 'aria-label': 'Eigenschaft' },
    ...gruppiert(data.properties).map(([gruppe, props]) => el('optgroup', { label: gruppe },
      ...props.map(p => el('option', { value: p.key }, p.label)))));
  const legend = el('ul', { class: 'map-legend' });
  const tooltip = el('div', { class: 'map-tooltip', hidden: true });
  const wrap = el('div', { class: 'map-wrap' }, tooltip);
  const controls = el('div', { class: 'map-controls' }, select);
  const erklaerung = el('p', { class: 'map-erklaerung' });

  root.replaceChildren(el('section', { class: 'map' },
    el('header', { class: 'map-head' },
      el('h1', {}, 'Weltkarte'),
      controls),
    wrap,
    legend,
    erklaerung,
    el('p', { class: 'map-hint' }, 'Mausrad oder Zwei-Finger-Geste zum Zoomen, Ziehen zum Verschieben.')));

  const svg = d3.select(wrap).append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('class', 'map-svg')
    .attr('role', 'img')
    .attr('aria-label', 'Weltkarte');
  const g = svg.append('g');

  const laender = g.selectAll('path')
    .data(features)
    .join('path')
    .attr('d', path)
    .attr('class', 'land');

  // Kleinstaaten aus den Daten zusätzlich als Punkt.
  const klein = features.filter(f => index.has(f) && path.area(f) < KLEIN);
  const punkte = g.selectAll('circle')
    .data(klein)
    .join('circle')
    .attr('class', 'land punkt')
    .attr('cx', f => path.centroid(f)[0])
    .attr('cy', f => path.centroid(f)[1])
    .attr('r', 4);

  const zoom = d3.zoom()
    .scaleExtent([1, 20])
    .translateExtent([[0, 0], [W, H]])
    .on('zoom', e => {
      g.attr('transform', e.transform);
      punkte.attr('r', 4 / Math.sqrt(e.transform.k));
    });
  svg.call(zoom);

  // Tooltip
  const showTip = (event, f) => {
    const c = index.get(f);
    const prop = data.properties.find(p => p.key === select.value);
    const k = klasse(c, prop, progress);
    const zeilen = [el('strong', {}, c ? c.name_de : f.properties.name)];
    if (c) {
      zeilen.push(el('div', {}, `${prop.label}: ${formatValue(c, prop) ?? '–'}`));
      const rank = getRank(data.countries, prop, c.iso3);
      if (rank) zeilen.push(el('div', {}, formatRank(rank)));
    }
    zeilen.push(el('div', { class: `tip-status s-${k}` }, STATUS_TEXT[k]));
    tooltip.replaceChildren(...zeilen);
    tooltip.hidden = false;
    const [x, y] = d3.pointer(event, wrap);
    const left = Math.min(x + 12, wrap.clientWidth - tooltip.offsetWidth - 4);
    tooltip.style.left = `${Math.max(4, left)}px`;
    const top = y + 12 + tooltip.offsetHeight > wrap.clientHeight ? y - 12 - tooltip.offsetHeight : y + 12;
    tooltip.style.top = `${Math.max(4, top)}px`;
  };
  const hideTip = () => { tooltip.hidden = true; };
  for (const sel of [laender, punkte]) {
    sel.on('pointermove', showTip).on('click', showTip).on('pointerleave', hideTip);
  }

  function color() {
    const prop = data.properties.find(p => p.key === select.value);
    const zahl = {};   // Klasse → Set von ISO3 (Länder können mehrere Features haben)
    const set = f => {
      const c = index.get(f);
      const k = klasse(c, prop, progress);
      if (c) (zahl[k] ??= new Set()).add(c.iso3);
      return `land s-${k}${klein.includes(f) ? ' klein' : ''}`;
    };
    laender.attr('class', set);
    punkte.attr('class', f => `land punkt s-${klasse(index.get(f), prop, progress)}`);
    legend.replaceChildren(...KLASSEN.map(([k, label]) =>
      el('li', {}, el('span', { class: `swatch s-${k}` }),
        k === 'keine_daten' ? label : `${label} (${fmt.format(zahl[k]?.size ?? 0)})`)));
    const i = data.properties.indexOf(prop);
    controls.replaceChildren(select, infoButton(prop, i));
    const bereich = bereichMitLaendern(prop);
    erklaerung.replaceChildren(el('strong', {}, `${prop.label}: `), prop.erklaerung ?? '',
      ...(bereich ? [el('br'), el('small', { class: 'erkl-bereich' }, `Bereich: ${bereich}`)] : []));
    hideTip();
  }

  select.addEventListener('change', color);
  color();
}
