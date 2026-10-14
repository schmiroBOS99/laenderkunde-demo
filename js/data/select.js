// Auswahl der Länder × Eigenschaften anhand der Menü-Einstellungen.
import { statusOf } from '../storage/progress.js';

const hasValue = (c, key) => c[key] !== null && c[key] !== undefined && c[key] !== '';

// Paare (Eigenschaften) eines Landes, die zu Wert- und Lernstandfilter passen.
function matchingProps(c, props, progress, lernstand) {
  return props.filter(p => hasValue(c, p.key) && lernstand.includes(statusOf(progress, c.iso3, p.key)));
}

// Alle Länder, die die Filter erfüllen, mit ihren passenden Eigenschaften.
export function availableCountries(data, settings, progress) {
  const props = data.properties.filter(p => settings.eigenschaften.includes(p.key));
  return Object.values(data.countries)
    .filter(c => settings.kontinente.includes(c.kontinent))
    .filter(c => !settings.nurUN || c.status === 'un')
    .map(c => ({ country: c, props: matchingProps(c, props, progress, settings.lernstand) }))
    .filter(x => x.props.length > 0);
}

function mischen(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Auswahl von n Ländern; liefert [{ iso3, props: [key] }] in zufälliger Reihenfolge.
// verlauf = zuletzt abgefragte Länder (neueste zuerst): Noch nie gezeigte Länder kommen zuerst dran,
// danach die am längsten nicht gezeigten. So wird über mehrere Runden durch alle Länder rotiert.
export function pickSession(available, n, verlauf = []) {
  const pos = new Map(verlauf.map((iso3, i) => [iso3, i]));
  const alter = x => pos.get(x.country.iso3) ?? Number.MAX_SAFE_INTEGER;   // größer = länger her
  const auswahl = mischen(available.slice())
    .sort((a, b) => alter(b) - alter(a))   // stabil: Gleichrangige bleiben zufällig gemischt
    .slice(0, n);
  return mischen(auswahl).map(x => ({ iso3: x.country.iso3, props: x.props.map(p => p.key) }));
}
