// Schätzfragen für Zahl-Eigenschaften (Feld "schaetzen" in properties.json):
// { einheit: Eingabeeinheit, faktor: Wert je Eingabeeinheit, relativ?: Anteil vom wahren Wert, absolut: Mindesttoleranz }
// Richtig, wenn |Schätzung − Wert| ≤ max(relativ × Wert, absolut) – alles in Eingabeeinheiten.

const zahlFmt = new Intl.NumberFormat('de-DE', { maximumSignificantDigits: 3, maximumFractionDigits: 6 });
const genauFmt = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 6 });
const pctFmt = new Intl.NumberFormat('de-DE', { style: 'percent', maximumFractionDigits: 0 });

// Deutsche Eingabe: "84,5", "1.430" (Tausenderpunkt), "0.5" (Punkt als Komma), "-3".
export function parseZahl(text) {
  let t = String(text).trim().replace(/\s/g, '').replace('−', '-');
  if (t === '') return NaN;
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
  return /^-?\d*\.?\d+$/.test(t) ? Number(t) : NaN;
}

export const formatEingabe = x => zahlFmt.format(x);

// Platzierung raten: feste Toleranz je Vergleichsgruppe (±5 % der Länderzahl, mind. ±2 Plätze),
// z. B. weltweit ±10, Europa ±2. Fest statt relativ zum wahren Platz, damit der Hinweis nichts verrät.
export const RANG_ANTEIL = 0.05;
export const rangSchaetzen = anzahl =>
  ({ einheit: 'Plätze', faktor: 1, absolut: Math.max(2, Math.round(RANG_ANTEIL * anzahl)) });

// s = Schätz-Konfiguration ({ einheit, faktor, relativ?, absolut }), wahr in Eingabeeinheiten
export function toleranz(s, wahr) {
  return Math.max((s.relativ ?? 0) * Math.abs(wahr), s.absolut ?? 0);
}

// Lang: "±10 % (mind. ±0,05 Mio.)" bzw. "±8 von 100"; kurz (Karte): "±10 %" bzw. "±8"
export function toleranzText(s) {
  const abs = `±${genauFmt.format(s.absolut)} ${s.einheit}`;
  return s.relativ ? `±${pctFmt.format(s.relativ)} (mind. ${abs})` : abs;
}
export function toleranzKurz(s) {
  return s.relativ ? `±${pctFmt.format(s.relativ)}` : `±${genauFmt.format(s.absolut)}`;
}

// Prüft eine Schätzung; wahr und schaetzung in Eingabeeinheiten. Liefert { richtig, abweichung }.
export function pruefe(s, wahr, schaetzung) {
  const abweichung = schaetzung - wahr;
  return { richtig: Math.abs(abweichung) <= toleranz(s, wahr) + 1e-9, abweichung };
}

// Kleinster und größter Wert aller Länder (mit Ländernamen), gecacht je Eigenschaft.
const bereichCache = new Map();
export function wertebereich(countries, prop) {
  if (!bereichCache.has(prop.key)) {
    const list = Object.values(countries).filter(c => typeof c[prop.key] === 'number');
    if (list.length === 0) return null;
    const min = list.reduce((a, c) => (c[prop.key] < a[prop.key] ? c : a));
    const max = list.reduce((a, c) => (c[prop.key] > a[prop.key] ? c : a));
    bereichCache.set(prop.key, { min: min[prop.key], max: max[prop.key], minLand: min.name_de, maxLand: max.name_de });
  }
  return bereichCache.get(prop.key);
}

// "0,00044 bis 17.100 Tsd. km²" (in Eingabeeinheit, sonst in der normalen Einheit); trenner z. B. "–"
export function bereichText(countries, prop, trenner = ' bis ') {
  const b = wertebereich(countries, prop);
  if (!b) return '';
  const f = prop.schaetzen?.faktor ?? 1;
  const von = formatEingabe(b.min / f);
  const bis = formatEingabe(b.max / f);
  if (prop.vorsatz) return `${prop.vorsatz}${von}${trenner}${bis}`;
  const einheit = prop.schaetzen?.einheit ?? prop.einheit ?? '';
  return `${von}${trenner}${bis}${einheit ? ' ' + einheit : ''}`;
}
