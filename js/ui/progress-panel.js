// Lernstand-Seite: Fortschritt je Eigenschaft, Export, Import, Zurücksetzen.
import { loadProgress, statusOf, exportProgress, importProgress, resetProgress } from '../storage/progress.js';
import { el } from './dom.js';
import { icon } from './icons.js';
import { propFarbe, gruppiert, STATUS } from './theme.js';
import { infoButton } from './info.js';

const fmt = new Intl.NumberFormat('de-DE');

function download(text, filename) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = el('a', { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Zählt die Lernstand-Stufen für alle Länder mit Wert.
function zaehle(data, prop, progress) {
  const z = Object.fromEntries(STATUS.map(([k]) => [k, 0]));
  for (const c of Object.values(data.countries)) {
    if (c[prop.key] === null || c[prop.key] === undefined) continue;
    z[statusOf(progress, c.iso3, prop.key)] += 1;
  }
  return z;
}

function zeile(prop, i, z) {
  const gesamt = Object.values(z).reduce((a, b) => a + b, 0);
  const anteil = n => `${(n / gesamt) * 100}%`;
  return el('li', { class: 'stat-row', style: propFarbe(prop, i) },
    el('span', { class: 'stat-icon' }, icon(prop.key)),
    el('div', { class: 'stat-main' },
      el('div', { class: 'stat-label' },
        el('span', { class: 'stat-name' }, prop.label, infoButton(prop, i)),
        el('span', { class: 'stat-zahl', title: 'gelernt · gewusst · nicht gewusst / Karten gesamt' },
          `${fmt.format(z.gelernt)} · ${fmt.format(z.gewusst)} · ${fmt.format(z.nicht_gewusst)} / ${fmt.format(gesamt)}`)),
      el('div', { class: 'stat-bar', title: STATUS.map(([k, label]) => `${label} ${z[k]}`).join(', ') },
        // „Neu“ ist der leere Rest des Balkens
        ...STATUS.filter(([k]) => k !== 'neu').map(([k]) =>
          el('span', { class: `s-${k}`, style: `width: ${anteil(z[k])}` })))));
}

// onChange wird nach Import/Zurücksetzen aufgerufen (Seite neu aufbauen).
export function renderProgressPage(root, data, onChange) {
  const progress = loadProgress();
  const status = el('p', { class: 'panel-status' });

  const file = el('input', { type: 'file', accept: '.json,application/json', hidden: true });
  file.addEventListener('change', async () => {
    const f = file.files[0];
    if (!f) return;
    try {
      const n = importProgress(await f.text());
      alert(`${fmt.format(n)} Einträge importiert.`);
      onChange();
    } catch {
      status.textContent = 'Import fehlgeschlagen: keine gültige Lernstand-Datei.';
    }
    file.value = '';
  });

  const datum = new Date().toISOString().slice(0, 10);
  root.replaceChildren(el('section', { class: 'page-narrow' },
    el('h1', {}, 'Lernstand'),
    el('div', { class: 'panel' },
      el('div', { class: 'panel-head' },
        el('h2', {}, 'Fortschritt'),
        el('div', { class: 'legend-mini' },
          ...STATUS.flatMap(([k, label]) => [el('span', { class: `dot s-${k === 'neu' ? 'leer' : k}` }), label]))),
      ...gruppiert(data.properties).flatMap(([gruppe, props]) => [
        el('h3', { class: 'stat-group' }, gruppe),
        el('ul', { class: 'stat-list' },
          ...props.map(p => zeile(p, data.properties.indexOf(p), zaehle(data, p, progress))))])),
    el('div', { class: 'panel' },
      el('div', { class: 'panel-head' }, el('h2', {}, 'Sichern und übertragen')),
      el('p', { class: 'hint' }, 'Der Lernstand liegt nur in diesem Browser. Exportiere ihn als Sicherung oder um ihn in einem anderen Browser zu importieren.'),
      el('div', { class: 'panel-buttons' },
        el('button', { type: 'button', class: 'btn',
          onclick: () => download(exportProgress(), `lernstand-${datum}.json`) }, icon('export'), 'Exportieren'),
        el('button', { type: 'button', class: 'btn', onclick: () => file.click() }, icon('import'), 'Importieren'),
        el('button', { type: 'button', class: 'btn danger', onclick: () => {
          if (confirm('Gesamten Lernstand löschen? Das kann nicht rückgängig gemacht werden.')) {
            resetProgress();
            onChange();
          }
        } }, icon('loeschen'), 'Zurücksetzen')),
      file,
      status)));
}
